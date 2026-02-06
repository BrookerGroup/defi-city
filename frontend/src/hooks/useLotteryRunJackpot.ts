/**
 * useLotteryRunJackpot Hook
 * Manually trigger the Megapot jackpot drawing (testnet necessity)
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'

/** Minimum ETH required in Smart Wallet (fee + gas buffer) */
const MIN_ETH_BUFFER = ethers.parseEther('0.0001') // 0.0001 ETH buffer

/** Extract a readable revert message from ethers/contract error */
function extractRevertMessage(err: unknown): string {
  if (err == null) return 'Run jackpot failed'
  const e = err as {
    reason?: string
    shortMessage?: string
    message?: string
    data?: string
    info?: { error?: { data?: string } }
  }

  const reason = e.reason ?? e.shortMessage ?? e.message

  // Check for common error patterns in reason string
  if (reason && typeof reason === 'string') {
    const lowerReason = reason.toLowerCase()
    if (lowerReason.includes('jackpot can only be run once')) {
      return 'ALREADY_RUN'
    }
    if (lowerReason.includes('round not ended')) {
      return 'Round has not ended yet. Please wait for the timer to reach 0.'
    }
    if (lowerReason.includes('no tickets')) {
      return 'No tickets purchased in this round. Cannot run drawing.'
    }
    if (lowerReason.includes('insufficient funds') || lowerReason.includes('insufficient balance')) {
      return 'Insufficient ETH in Smart Wallet to pay for drawing fee.'
    }
    if (lowerReason.includes('execution reverted')) {
      // Try to extract more info from data
    }
  }

  // Try to decode error data
  const data = e.data ?? e.info?.error?.data
  if (data && typeof data === 'string') {
    const hex = data.startsWith('0x') ? data : '0x' + data
    const sig = hex.slice(0, 10)

    // ExecutionFailed(string) from SmartWallet - inner call reverted
    if (sig === '0xf00364b1') {
      try {
        const payload = hex.slice(10)
        if (payload.length >= 64) {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + payload)
          if (decoded[0] === 'Call failed without reason') {
            return 'Drawing failed. Your Smart Wallet may not have enough ETH to pay the fee (~0.00002 ETH). Please transfer some ETH to your Smart Wallet.'
          }
          if (decoded[0]) return decoded[0] as string
        }
      } catch {
        // ignore decode error
      }
      return 'Drawing failed. Please ensure your Smart Wallet has ETH for the fee.'
    }

    // Error(string) - standard revert
    if (sig === '0x08c379a0') {
      try {
        const payload = hex.slice(10)
        if (payload.length >= 64) {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['string'], '0x' + payload)
          if (decoded[0]) return decoded[0] as string
        }
      } catch {
        // ignore decode error
      }
    }

    // Panic(uint256) - assertion/overflow errors
    if (sig === '0x4e487b71') {
      try {
        const payload = hex.slice(10)
        if (payload.length >= 64) {
          const decoded = ethers.AbiCoder.defaultAbiCoder().decode(['uint256'], '0x' + payload)
          const code = Number(decoded[0])
          if (code === 1) return 'Contract assertion failed'
          if (code === 17) return 'Arithmetic overflow'
          if (code === 18) return 'Division by zero'
        }
      } catch {
        // ignore
      }
    }
  }

  return typeof reason === 'string' ? reason : 'Run jackpot failed'
}

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

        // 2. Check Smart Wallet ETH balance
        const swBalance = await provider.getBalance(smartWalletAddress)
        const requiredAmount = fee + MIN_ETH_BUFFER
        console.log('[Lottery] Smart Wallet ETH balance:', ethers.formatEther(swBalance), 'ETH')
        console.log('[Lottery] Required (fee + buffer):', ethers.formatEther(requiredAmount), 'ETH')

        if (swBalance < requiredAmount) {
          const shortfall = requiredAmount - swBalance
          const errorMsg = `Insufficient ETH in Smart Wallet. Need ${ethers.formatEther(requiredAmount)} ETH but only have ${ethers.formatEther(swBalance)} ETH. Please transfer at least ${ethers.formatEther(shortfall)} ETH to your Smart Wallet.`
          console.error('[Lottery]', errorMsg)
          setError(errorMsg)
          setLoading(false)
          return { success: false, error: errorMsg }
        }

        // 3. Generate a random 32-byte value
        const userRandomNumber = ethers.hexlify(ethers.randomBytes(32))
        console.log('[Lottery] User random number:', userRandomNumber)

        // 4. Build the call to runJackpot
        const megapotInterface = new ethers.Interface(ABIS.MEGAPOT)
        const runJackpotData = megapotInterface.encodeFunctionData('runJackpot', [userRandomNumber])

        // 5. Create Smart Wallet contract instance
        const smartWallet = new ethers.Contract(smartWalletAddress, ABIS.SMART_WALLET, signer)

        // 6. Simulate first to catch errors early with better messages
        console.log('[Lottery] Simulating runJackpot...')
        try {
          await smartWallet.execute.staticCall(addresses.MEGAPOT, fee, runJackpotData)
          console.log('[Lottery] Simulation passed')
        } catch (simErr: unknown) {
          const simMsg = extractRevertMessage(simErr)
          console.error('[Lottery] Simulation failed:', simMsg, simErr)

          if (simMsg === 'ALREADY_RUN') {
            setLoading(false)
            return { success: false, error: 'ALREADY_RUN' }
          }

          setError(simMsg)
          setLoading(false)
          return { success: false, error: simMsg }
        }

        // 7. Execute the actual transaction
        console.log('[Lottery] Executing runJackpot via Smart Wallet...')
        const tx = await smartWallet.execute(addresses.MEGAPOT, fee, runJackpotData)

        console.log('[Lottery] Tx sent:', tx.hash)
        const receipt = await tx.wait()
        console.log('[Lottery] Confirmed:', receipt?.hash)

        setLoading(false)
        return { success: true, txHash: receipt?.hash }
      } catch (err: unknown) {
        console.error('Error running jackpot:', err)
        const errorMsg = extractRevertMessage(err)

        // Detect "already run" error — jackpot was already executed, new round likely started
        if (errorMsg === 'ALREADY_RUN') {
          console.log('[Lottery] Jackpot was already run this round. New round should be starting.')
          setLoading(false)
          return { success: false, error: 'ALREADY_RUN' }
        }

        setError(errorMsg)
        setLoading(false)
        return { success: false, error: errorMsg }
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
