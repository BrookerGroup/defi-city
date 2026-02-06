/**
 * useMegapotLPWithdraw Hook
 * Two-step withdrawal process:
 * 1. Set risk percentage to 0 (initiates withdrawal)
 * 2. After next jackpot, call withdrawAllLp()
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'

/** Extract readable error message */
function extractErrorMessage(err: unknown): string {
  if (err == null) return 'Withdrawal failed'
  const e = err as { reason?: string; shortMessage?: string; message?: string }
  const reason = e.reason ?? e.shortMessage ?? e.message

  if (reason && typeof reason === 'string') {
    if (reason.includes('not ready')) return 'Withdrawal not ready yet. Please wait for next jackpot.'
    if (reason.includes('no position')) return 'No LP position found'
    if (reason.includes('already pending')) return 'Withdrawal already pending'
    return reason
  }

  return 'Withdrawal failed'
}

export function useMegapotLPWithdraw() {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Step 1: Initiate withdrawal by setting risk to 0
   * After this, user must wait for next jackpot drawing
   */
  const initiateWithdraw = useCallback(
    async (
      smartWalletAddress: string
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      setLoading(true)
      setError(null)

      try {
        if (!wallets || wallets.length === 0) {
          throw new Error('Wallet not connected')
        }

        const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
        const ethereumProvider = await wallet.getEthereumProvider()
        const provider = new ethers.BrowserProvider(ethereumProvider)
        const signer = await provider.getSigner()

        const megapotAddress = CONTRACTS.baseSepolia.MEGAPOT

        console.log('[LP Withdraw] Initiating withdrawal (setting risk to 0)...')
        const megapotInterface = new ethers.Interface(ABIS.MEGAPOT)
        const adjustRiskData = megapotInterface.encodeFunctionData('lpAdjustRiskPercentage', [0])

        const smartWallet = new ethers.Contract(smartWalletAddress, ABIS.SMART_WALLET, signer)
        const tx = await smartWallet.execute(megapotAddress, 0n, adjustRiskData)
        console.log('[LP Withdraw] Tx sent:', tx.hash)

        const receipt = await tx.wait()
        console.log('[LP Withdraw] Initiation confirmed:', receipt?.hash)

        setLoading(false)
        return { success: true, txHash: receipt?.hash }
      } catch (err) {
        console.error('[LP Withdraw] Initiate error:', err)
        const errorMsg = extractErrorMessage(err)
        setError(errorMsg)
        setLoading(false)
        return { success: false, error: errorMsg }
      }
    },
    [wallets]
  )

  /**
   * Step 2: Complete withdrawal after jackpot has run
   * Only callable when risk is 0 and jackpot has completed
   */
  const completeWithdraw = useCallback(
    async (
      smartWalletAddress: string
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      setLoading(true)
      setError(null)

      try {
        if (!wallets || wallets.length === 0) {
          throw new Error('Wallet not connected')
        }

        const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
        const ethereumProvider = await wallet.getEthereumProvider()
        const provider = new ethers.BrowserProvider(ethereumProvider)
        const signer = await provider.getSigner()

        const megapotAddress = CONTRACTS.baseSepolia.MEGAPOT

        console.log('[LP Withdraw] Completing withdrawal...')
        const megapotInterface = new ethers.Interface(ABIS.MEGAPOT)
        const withdrawData = megapotInterface.encodeFunctionData('withdrawAllLp', [])

        const smartWallet = new ethers.Contract(smartWalletAddress, ABIS.SMART_WALLET, signer)
        const tx = await smartWallet.execute(megapotAddress, 0n, withdrawData)
        console.log('[LP Withdraw] Tx sent:', tx.hash)

        const receipt = await tx.wait()
        console.log('[LP Withdraw] Withdrawal confirmed:', receipt?.hash)

        setLoading(false)
        return { success: true, txHash: receipt?.hash }
      } catch (err) {
        console.error('[LP Withdraw] Complete error:', err)
        const errorMsg = extractErrorMessage(err)
        setError(errorMsg)
        setLoading(false)
        return { success: false, error: errorMsg }
      }
    },
    [wallets]
  )

  /**
   * Adjust risk percentage (1-100)
   * Can be used to change exposure without withdrawing
   */
  const adjustRisk = useCallback(
    async (
      smartWalletAddress: string,
      newRiskPercentage: number
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      setLoading(true)
      setError(null)

      try {
        if (newRiskPercentage < 0 || newRiskPercentage > 100) {
          throw new Error('Risk percentage must be between 0 and 100')
        }

        if (!wallets || wallets.length === 0) {
          throw new Error('Wallet not connected')
        }

        const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
        const ethereumProvider = await wallet.getEthereumProvider()
        const provider = new ethers.BrowserProvider(ethereumProvider)
        const signer = await provider.getSigner()

        const megapotAddress = CONTRACTS.baseSepolia.MEGAPOT

        console.log('[LP Adjust] Setting risk to', newRiskPercentage, '%...')
        const megapotInterface = new ethers.Interface(ABIS.MEGAPOT)
        const adjustRiskData = megapotInterface.encodeFunctionData('lpAdjustRiskPercentage', [
          newRiskPercentage,
        ])

        const smartWallet = new ethers.Contract(smartWalletAddress, ABIS.SMART_WALLET, signer)
        const tx = await smartWallet.execute(megapotAddress, 0n, adjustRiskData)
        console.log('[LP Adjust] Tx sent:', tx.hash)

        const receipt = await tx.wait()
        console.log('[LP Adjust] Confirmed:', receipt?.hash)

        setLoading(false)
        return { success: true, txHash: receipt?.hash }
      } catch (err) {
        console.error('[LP Adjust] Error:', err)
        const errorMsg = extractErrorMessage(err)
        setError(errorMsg)
        setLoading(false)
        return { success: false, error: errorMsg }
      }
    },
    [wallets]
  )

  return {
    initiateWithdraw,
    completeWithdraw,
    adjustRisk,
    loading,
    error,
  }
}
