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
          smartWalletAbi,
          aavePoolAbi,
          addresses,
        } = await getContracts()

        const assetAddress = ASSET_ADDRESSES[asset]
        const decimals = ASSET_DECIMALS[asset]
        const amountWei = ethers.parseUnits(amount.toString(), decimals)

        console.log(`[Withdraw] Withdrawing ${amount} ${asset} from Aave to Smart Wallet: ${smartWalletAddress}`)

        const targets: string[] = []
        const values: bigint[] = []
        const datas: string[] = []

        // 1. Prepare Aave Pool Withdraw call
        const poolInterface = new ethers.Interface(aavePoolAbi)
        // Pool.withdraw(asset, amount, to)
        const withdrawData = poolInterface.encodeFunctionData('withdraw', [
          assetAddress,
          amountWei,
          smartWalletAddress
        ])

        targets.push(addresses.AAVE_POOL)
        values.push(0n)
        datas.push(withdrawData)

        // 2. If asset is ETH, we need to unwrap it (WETH -> ETH)
        if (asset === 'ETH') {
          console.log('[Withdraw] Detected ETH: Appending WETH.withdraw() to batch')
          const wethInterface = new ethers.Interface(['function withdraw(uint256)'])
          const unwrapData = wethInterface.encodeFunctionData('withdraw', [amountWei])
          
          targets.push(assetAddress) // WETH address
          values.push(0n)
          datas.push(unwrapData)
        }

        // 3. If buildingIds are provided, record demolition in DefiCityCore
        if (buildingIds && buildingIds.length > 0) {
          const coreInterface = new ethers.Interface(ABIS.DEFICITY_CORE)
          const singerAddress = await signer.getAddress()
          
          for (const id of buildingIds) {
            if (id > 0) {
              console.log(`[Withdraw] Appending demolition for building ${id}`)
              // recordDemolition(address user, uint256 buildingId, uint256 returnedAmount)
              const demolitionData = coreInterface.encodeFunctionData('recordDemolition', [
                singerAddress,
                id,
                amountWei
              ])

              targets.push(addresses.DEFICITY_CORE)
              values.push(0n)
              datas.push(demolitionData)
            }
          }
        }

        // 4. Execute via SmartWallet
        const smartWallet = new ethers.Contract(
          smartWalletAddress,
          smartWalletAbi,
          signer
        )

        console.log('Executing batch withdraw via SmartWallet...')
        const executeTx = await smartWallet.executeBatch(
          targets,
          values,
          datas,
          {
            gasLimit: 3000000,
          }
        )

        console.log('Withdraw transaction sent:', executeTx.hash)
        const receipt = await executeTx.wait()
        console.log('Withdraw transaction confirmed:', receipt.hash)

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
