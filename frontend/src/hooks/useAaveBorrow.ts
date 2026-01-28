/**
 * useAaveBorrow Hook
 * Borrow-only from Aave via Smart Wallet (Pool.borrow)
 * Uses executeBatch on Smart Wallet; no BuildingRegistry/BankAdapter.
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'

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

export function useAaveBorrow() {
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
    }
  }

  const borrow = useCallback(
    async (
      smartWalletAddress: string,
      asset: string,
      amount: number
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      setLoading(true)
      setError(null)

      try {
        const { signer, addresses, smartWalletAbi, aavePoolAbi } = await getContracts()

        const assetAddress = ASSET_ADDRESSES[asset]
        const decimals = ASSET_DECIMALS[asset]
        if (!assetAddress || !decimals) {
          setLoading(false)
          return { success: false, error: `Unsupported asset: ${asset}` }
        }

        const amountWei = ethers.parseUnits(amount.toString(), decimals)

        const poolInterface = new ethers.Interface(aavePoolAbi)
        const borrowData = poolInterface.encodeFunctionData('borrow', [
          assetAddress,
          amountWei,
          INTEREST_RATE_MODE_VARIABLE,
          0,
          smartWalletAddress,
        ])

        const targets = [addresses.AAVE_POOL]
        const values = [0n]
        const datas = [borrowData]

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
        console.log('[Borrow] Gas estimate:', gasEstimate.toString())

        const tx = await smartWallet.executeBatch(targets, values, datas, {
          gasLimit: gasEstimate + 50_000n,
        })

        console.log('[Borrow] Tx sent:', tx.hash)
        const receipt = await tx.wait()
        console.log('[Borrow] Confirmed:', receipt?.hash)

        setLoading(false)
        return { success: true, txHash: receipt?.hash }
      } catch (err: any) {
        console.error('Error in borrow:', err)
        const errorMessage = err.reason || err.message || 'Borrow failed'
        setError(errorMessage)
        setLoading(false)
        return { success: false, error: errorMessage }
      }
    },
    [wallets]
  )

  return {
    borrow,
    loading,
    error,
  }
}
