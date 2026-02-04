/**
 * useLotteryClaimWinnings Hook
 * Claim Megapot lottery winnings via SmartWallet.execute
 * Single call: Megapot.withdrawWinnings()
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'

export function useLotteryClaimWinnings() {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const claimWinnings = useCallback(
    async (
      smartWalletAddress: string
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      setLoading(true)
      setError(null)

      console.log('[Lottery] Claiming winnings...')

      try {
        if (!wallets || wallets.length === 0) throw new Error('Wallet not connected')

        const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
        const ethereumProvider = await wallet.getEthereumProvider()
        const provider = new ethers.BrowserProvider(ethereumProvider)
        const signer = await provider.getSigner()

        const addresses = CONTRACTS.baseSepolia
        const megapotInterface = new ethers.Interface(ABIS.MEGAPOT)

        const callData = megapotInterface.encodeFunctionData('withdrawWinnings', [])

        const smartWallet = new ethers.Contract(smartWalletAddress, ABIS.SMART_WALLET, signer)

        const gasEstimate = await smartWallet.execute.estimateGas(
          addresses.MEGAPOT,
          0n,
          callData
        )
        console.log('[Lottery] Claim gas estimate:', gasEstimate.toString())

        const tx = await smartWallet.execute(addresses.MEGAPOT, 0n, callData, {
          gasLimit: gasEstimate + 100_000n,
        })

        console.log('[Lottery] Claim tx sent:', tx.hash)
        const receipt = await tx.wait()
        console.log('[Lottery] Claim confirmed:', receipt?.hash)

        setLoading(false)
        return { success: true, txHash: receipt?.hash }
      } catch (err: any) {
        console.error('Error claiming lottery winnings:', err)
        const errorMessage = err.reason || err.message || 'Claim winnings failed'
        setError(errorMessage)
        setLoading(false)
        return { success: false, error: errorMessage }
      }
    },
    [wallets]
  )

  return {
    claimWinnings,
    loading,
    error,
  }
}
