/**
 * useLotteryRunJackpot Hook
 * Manually trigger the Megapot jackpot drawing (testnet necessity)
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'

export function useLotteryRunJackpot() {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const runJackpot = useCallback(
    async (smartWalletAddress: string): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      setLoading(true)
      setError(null)

      try {
        if (!wallets || wallets.length === 0) throw new Error('Wallet not connected')

        const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
        const ethereumProvider = await wallet.getEthereumProvider()
        const provider = new ethers.BrowserProvider(ethereumProvider)
        const signer = await provider.getSigner()

        const addresses = CONTRACTS.baseSepolia
        const megapot = new ethers.Contract(addresses.MEGAPOT, ABIS.MEGAPOT, provider)

        // 1. Get the required fee for Pyth Entropy
        console.log('[Lottery] Fetching jackpot fee...')
        const fee = await megapot.getJackpotFee()
        console.log('[Lottery] Jackpot fee:', ethers.formatEther(fee), 'ETH')

        // 2. Generate a random 32-byte value
        const userRandomNumber = ethers.hexlify(ethers.randomBytes(32))
        console.log('[Lottery] User random number:', userRandomNumber)

        // 3. Build the call to runJackpot
        const megapotInterface = new ethers.Interface(ABIS.MEGAPOT)
        const runJackpotData = megapotInterface.encodeFunctionData('runJackpot', [userRandomNumber])

        // 4. Execute via Smart Wallet
        const smartWallet = new ethers.Contract(smartWalletAddress, ABIS.SMART_WALLET, signer)
        
        console.log('[Lottery] Executing runJackpot via Smart Wallet...')
        const tx = await smartWallet.execute(addresses.MEGAPOT, fee, runJackpotData)
        
        console.log('[Lottery] Tx sent:', tx.hash)
        const receipt = await tx.wait()
        console.log('[Lottery] Confirmed:', receipt?.hash)

        setLoading(false)
        return { success: true, txHash: receipt?.hash }
      } catch (err: any) {
        console.error('Error running jackpot:', err)
        const rawMessage = err.reason || err.message || 'Run jackpot failed'

        // Detect "already run" error — jackpot was already executed, new round likely started
        const alreadyRun = rawMessage.toLowerCase().includes('jackpot can only be run once')
        if (alreadyRun) {
          console.log('[Lottery] Jackpot was already run this round. New round should be starting.')
          setLoading(false)
          return { success: false, error: 'ALREADY_RUN' }
        }

        setError(rawMessage)
        setLoading(false)
        return { success: false, error: rawMessage }
      }
    },
    [wallets]
  )

  return {
    runJackpot,
    loading,
    error,
  }
}
