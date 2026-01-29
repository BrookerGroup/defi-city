/**
 * useAaveRepay Hook
 * Repay borrowed assets to Aave via Smart Wallet (Pool.repay)
 * Uses executeBatch on Smart Wallet for approve + repay
 * When repaying all, also calls recordDemolition to remove the borrow building
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'
import { Building } from './useCityBuildings'

const INTEREST_RATE_MODE_VARIABLE = 2

const ASSET_ADDRESSES: Record<string, string> = {
  USDC: CONTRACTS.baseSepolia.USDC,
  USDT: CONTRACTS.baseSepolia.USDT,
  ETH: CONTRACTS.baseSepolia.ETH,
  WBTC: CONTRACTS.baseSepolia.WBTC,
  LINK: CONTRACTS.baseSepolia.LINK,
}

const ASSET_DECIMALS: Record<string, number> = {
  USDC: 6,
  USDT: 6,
  ETH: 18,
  WBTC: 8,
  LINK: 18,
}

// ERC20 ABI for approve
const ERC20_ABI = [
  'function approve(address spender, uint256 amount) external returns (bool)',
  'function allowance(address owner, address spender) external view returns (uint256)',
]

export function useAaveRepay() {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getContracts = async () => {
    if (!wallets || wallets.length === 0) throw new Error('Wallet not connected')

    const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
    const ethereumProvider = await wallet.getEthereumProvider()
    const provider = new ethers.BrowserProvider(ethereumProvider)
    const signer = await provider.getSigner()

    const network = 'baseSepolia'
    const addresses = CONTRACTS[network]

    return {
      signer,
      provider,
      addresses,
      smartWalletAbi: ABIS.SMART_WALLET,
      aavePoolAbi: ABIS.AAVE_POOL,
      coreAbi: ABIS.DEFICITY_CORE,
    }
  }

  const repay = useCallback(
    async (
      userAddress: string,
      smartWalletAddress: string,
      asset: string,
      amount: number,
      repayAll: boolean = false,
      building?: Building
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      setLoading(true)
      setError(null)

      try {
        const { signer, addresses, smartWalletAbi, aavePoolAbi, coreAbi } = await getContracts()

        const assetAddress = ASSET_ADDRESSES[asset]
        const decimals = ASSET_DECIMALS[asset]
        if (!assetAddress || !decimals) {
          setLoading(false)
          return { success: false, error: `Unsupported asset: ${asset}` }
        }

        // If repayAll, use type(uint256).max to repay entire debt
        const amountWei = repayAll
          ? ethers.MaxUint256
          : ethers.parseUnits(amount.toString(), decimals)

        // For repayAll, we need to approve a large amount (or the actual debt amount)
        // We'll approve MaxUint256 for simplicity when repaying all
        const approveAmount = repayAll
          ? ethers.MaxUint256
          : amountWei

        console.log(`[Repay] Repaying ${repayAll ? 'ALL' : amount} ${asset}`)

        // Build approve calldata
        const erc20Interface = new ethers.Interface(ERC20_ABI)
        const approveData = erc20Interface.encodeFunctionData('approve', [
          addresses.AAVE_POOL,
          approveAmount,
        ])

        // Build repay calldata
        const poolInterface = new ethers.Interface(aavePoolAbi)
        const repayData = poolInterface.encodeFunctionData('repay', [
          assetAddress,
          amountWei,
          INTEREST_RATE_MODE_VARIABLE,
          smartWalletAddress, // onBehalfOf
        ])

        // Execute batch: approve + repay (+ recordDemolition if repaying all)
        const targets: string[] = [assetAddress, addresses.AAVE_POOL]
        const values: bigint[] = [0n, 0n]
        const datas: string[] = [approveData, repayData]

        // If repaying all AND we have a building, add recordDemolition to remove the borrow building
        if (repayAll && building) {
          console.log(`[Repay] Adding recordDemolition for building ID ${building.id}`)
          const coreInterface = new ethers.Interface(coreAbi)
          const demolitionData = coreInterface.encodeFunctionData('recordDemolition', [
            userAddress,     // owner
            building.id,     // buildingId
            0,               // returnedAmount (0 since funds already repaid)
          ])

          targets.push(addresses.DEFICITY_CORE)
          values.push(0n)
          datas.push(demolitionData)
        }

        const smartWallet = new ethers.Contract(
          smartWalletAddress,
          smartWalletAbi,
          signer
        )

        const gasEstimate = await smartWallet.executeBatch.estimateGas(
          targets,
          values,
          datas
        )
        console.log('[Repay] Gas estimate:', gasEstimate.toString())

        const tx = await smartWallet.executeBatch(targets, values, datas, {
          gasLimit: gasEstimate + 100_000n,
        })

        console.log('[Repay] Tx sent:', tx.hash)
        const receipt = await tx.wait()
        console.log('[Repay] Confirmed:', receipt?.hash)

        setLoading(false)
        return { success: true, txHash: receipt?.hash }
      } catch (err: any) {
        console.error('Error in repay:', err)
        const errorMessage = err.reason || err.message || 'Repay failed'
        setError(errorMessage)
        setLoading(false)
        return { success: false, error: errorMessage }
      }
    },
    [wallets]
  )

  return {
    repay,
    loading,
    error,
  }
}
