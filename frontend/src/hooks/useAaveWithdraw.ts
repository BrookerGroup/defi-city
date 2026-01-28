/**
 * useAaveWithdraw Hook
 * Integration for Aave withdrawal from Smart Wallet
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'

// Asset addresses mapping
const ASSET_ADDRESSES: Record<string, string> = {
  USDC: CONTRACTS.baseSepolia.USDC,
  USDT: CONTRACTS.baseSepolia.USDT,
  ETH: CONTRACTS.baseSepolia.ETH,
}

// Asset decimals mapping
const ASSET_DECIMALS: Record<string, number> = {
  USDC: 6,
  USDT: 6,
  ETH: 18,
}

export function useAaveWithdraw() {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getContracts = async () => {
    if (!wallets || wallets.length === 0) {
      throw new Error('Wallet not connected')
    }

    const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
    const ethereumProvider = await wallet.getEthereumProvider()
    const provider = new ethers.BrowserProvider(ethereumProvider)
    const signer = await provider.getSigner()

    const network = 'baseSepolia'
    const addresses = CONTRACTS[network]

    const smartWalletAbi = ABIS.SMART_WALLET
    const aavePoolAbi = ABIS.AAVE_POOL
    const erc20Abi = ABIS.ERC20

    return {
      signer,
      provider,
      smartWalletAbi,
      aavePoolAbi,
      erc20Abi,
      addresses,
    }
  }

  const withdraw = useCallback(
    async (
      smartWalletAddress: string,
      asset: string,
      amount: number,
      buildingIds?: number[]
    ) => {
      setLoading(true)
      setError(null)

      try {
        const {
          signer,
          provider,
          smartWalletAbi,
          aavePoolAbi,
          addresses,
        } = await getContracts()

        const assetAddress = ASSET_ADDRESSES[asset]
        const decimals = ASSET_DECIMALS[asset]

        // Read actual on-chain aToken balance for logging and WETH unwrap amount
        const dataProvider = new ethers.Contract(addresses.AAVE_DATA_PROVIDER, ABIS.AAVE_DATA_PROVIDER, provider)
        const userData = await dataProvider.getUserReserveData(assetAddress, smartWalletAddress)
        const actualATokenBalance: bigint = userData.currentATokenBalance

        if (actualATokenBalance === 0n) {
          setLoading(false)
          return { success: false, error: 'No balance to withdraw' }
        }

        // Check available liquidity in the Aave pool
        // Assets are held at the aToken contract address, not the Pool
        const dpTokens = new ethers.Contract(addresses.AAVE_DATA_PROVIDER, [
          'function getReserveTokensAddresses(address asset) external view returns (address, address, address)'
        ], provider)
        const [aTokenAddress] = await dpTokens.getReserveTokensAddresses(assetAddress)
        const tokenForBalance = new ethers.Contract(assetAddress, ['function balanceOf(address) view returns (uint256)'], provider)
        const availableLiquidity: bigint = await tokenForBalance.balanceOf(aTokenAddress)

        // Use the actual on-chain aToken balance (raw BigInt) for the withdrawal amount.
        // Do NOT use MaxUint256 — this Aave deployment doesn't handle it properly (causes Panic OVERFLOW(17)).
        // Do NOT convert through float — 18-decimal ETH loses precision in JS Number.
        const withdrawAmount = actualATokenBalance

        if (availableLiquidity < withdrawAmount) {
          setLoading(false)
          return {
            success: false,
            error: 'Insufficient liquidity'
          }
        }

        const ownerAddress = await signer.getAddress()

        console.log(`[Withdraw] Withdrawing ${asset} from Aave | requested: ${amount}, onChain: ${ethers.formatUnits(actualATokenBalance, decimals)}, liquidity: ${ethers.formatUnits(availableLiquidity, decimals)}`)

        const targets: string[] = []
        const values: bigint[] = []
        const datas: string[] = []

        // 1. Aave Pool withdraw → WETH/ERC20 goes to Smart Wallet
        const poolInterface = new ethers.Interface(aavePoolAbi)
        const withdrawData = poolInterface.encodeFunctionData('withdraw', [
          assetAddress,
          withdrawAmount,
          smartWalletAddress
        ])

        targets.push(addresses.AAVE_POOL)
        values.push(0n)
        datas.push(withdrawData)

        // 2. For ETH: unwrap WETH → ETH inside the same batch
        if (asset === 'ETH') {
          const wethInterface = new ethers.Interface(['function withdraw(uint256)'])
          const unwrapData = wethInterface.encodeFunctionData('withdraw', [withdrawAmount])

          targets.push(assetAddress)
          values.push(0n)
          datas.push(unwrapData)
        }

        // 3. If buildingIds are provided, record demolition in DefiCityCore
        if (buildingIds && buildingIds.length > 0) {
          const coreInterface = new ethers.Interface(ABIS.DEFICITY_CORE)

          for (const id of buildingIds) {
            if (id > 0) {
              console.log(`[Withdraw] Appending demolition for building ${id}`)
              const demolitionData = coreInterface.encodeFunctionData('recordDemolition', [
                ownerAddress,
                id,
                actualATokenBalance
              ])

              targets.push(addresses.DEFICITY_CORE)
              values.push(0n)
              datas.push(demolitionData)
            }
          }
        }

        // 4. Execute batch via SmartWallet
        const smartWallet = new ethers.Contract(
          smartWalletAddress,
          smartWalletAbi,
          signer
        )

        console.log('[Withdraw] Batch calls:', targets.map((t, i) => ({
          target: t,
          value: values[i].toString(),
          dataLength: datas[i].length,
        })))

        // Estimate gas first to catch errors before sending
        try {
          const gasEstimate = await smartWallet.executeBatch.estimateGas(targets, values, datas)
          console.log('[Withdraw] Gas estimate OK:', gasEstimate.toString())
        } catch (estimateError: any) {
          console.error('[Withdraw] Gas estimation failed — testing each call individually:')

          for (let i = 0; i < targets.length; i++) {
            try {
              await smartWallet.execute.estimateGas(targets[i], values[i], datas[i])
              console.log(`  Call ${i + 1} (target: ${targets[i]}): OK`)
            } catch (callError: any) {
              const reason = callError.reason || callError.data || callError.message || 'Unknown'
              console.error(`  Call ${i + 1} (target: ${targets[i]}): FAILED →`, reason)
            }
          }

          throw estimateError
        }

        console.log('[Withdraw] Executing batch withdraw via SmartWallet...')
        const executeTx = await smartWallet.executeBatch(
          targets,
          values,
          datas,
          {
            gasLimit: 3000000,
          }
        )

        console.log('[Withdraw] Batch transaction sent:', executeTx.hash)
        const receipt = await executeTx.wait()
        console.log('[Withdraw] Batch transaction confirmed:', receipt.hash)

        setLoading(false)
        return {
          success: true,
          txHash: receipt.hash,
        }
      } catch (err: any) {
        console.error('Error in withdraw:', err)
        const errorMessage = err.reason || err.message || 'Failed to withdraw from Aave'
        setError(errorMessage)
        setLoading(false)
        return {
          success: false,
          error: errorMessage,
        }
      }
    },
    [wallets]
  )

  return {
    withdraw,
    loading,
    error,
  }
}
