/**
 * useMegapotLPDeposit Hook
 * Deposit USDC as liquidity to Megapot with specified risk percentage
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'

/** Minimum deposit: 250 USDC */
const MIN_DEPOSIT_USDC = 250

/** Extract readable error message */
function extractErrorMessage(err: unknown): string {
  if (err == null) return 'Deposit failed'
  const e = err as { reason?: string; shortMessage?: string; message?: string; data?: string }
  const reason = e.reason ?? e.shortMessage ?? e.message

  if (reason && typeof reason === 'string') {
    if (reason.includes('insufficient allowance')) return 'Please approve USDC spending first'
    if (reason.includes('insufficient balance')) return 'Insufficient USDC balance'
    if (reason.includes('pool cap')) return 'LP pool has reached maximum capacity'
    if (reason.includes('minimum deposit')) return `Minimum deposit is ${MIN_DEPOSIT_USDC} USDC`
    return reason
  }

  return 'Deposit failed'
}

export function useMegapotLPDeposit() {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deposit = useCallback(
    async (
      smartWalletAddress: string,
      amountUsdc: number,
      riskPercentage: number
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      setLoading(true)
      setError(null)

      try {
        // Validate inputs
        if (amountUsdc < MIN_DEPOSIT_USDC) {
          throw new Error(`Minimum deposit is ${MIN_DEPOSIT_USDC} USDC`)
        }
        if (riskPercentage < 1 || riskPercentage > 100) {
          throw new Error('Risk percentage must be between 1 and 100')
        }

        if (!wallets || wallets.length === 0) {
          throw new Error('Wallet not connected')
        }

        const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
        const ethereumProvider = await wallet.getEthereumProvider()
        const provider = new ethers.BrowserProvider(ethereumProvider)
        const signer = await provider.getSigner()

        const addresses = CONTRACTS.baseSepolia
        const megapotAddress = addresses.MEGAPOT
        const mpusdcAddress = addresses.MPUSDC

        // Convert to szabo (1 USDC = 1,000,000 szabo)
        const valueInSzabo = BigInt(Math.floor(amountUsdc * 1_000_000))

        // 1. Check MPUSDC balance in Smart Wallet
        const mpusdc = new ethers.Contract(mpusdcAddress, ABIS.MPUSDC, provider)
        const balance = await mpusdc.balanceOf(smartWalletAddress)
        console.log('[LP Deposit] MPUSDC balance:', ethers.formatUnits(balance, 6), 'USDC')

        if (balance < valueInSzabo) {
          throw new Error(`Insufficient MPUSDC balance. Have ${ethers.formatUnits(balance, 6)}, need ${amountUsdc}`)
        }

        // 2. Check and set allowance if needed
        const allowance = await mpusdc.allowance(smartWalletAddress, megapotAddress)
        console.log('[LP Deposit] Current allowance:', ethers.formatUnits(allowance, 6), 'USDC')

        const smartWallet = new ethers.Contract(smartWalletAddress, ABIS.SMART_WALLET, signer)

        if (allowance < valueInSzabo) {
          console.log('[LP Deposit] Approving MPUSDC...')
          const approveData = mpusdc.interface.encodeFunctionData('approve', [
            megapotAddress,
            valueInSzabo,
          ])
          const approveTx = await smartWallet.execute(mpusdcAddress, 0n, approveData)
          await approveTx.wait()
          console.log('[LP Deposit] Approval confirmed')
        }

        // 3. Deposit liquidity
        console.log('[LP Deposit] Depositing', amountUsdc, 'USDC with', riskPercentage, '% risk...')
        const megapotInterface = new ethers.Interface(ABIS.MEGAPOT)
        const depositData = megapotInterface.encodeFunctionData('lpDeposit', [
          riskPercentage,
          valueInSzabo,
        ])

        const tx = await smartWallet.execute(megapotAddress, 0n, depositData)
        console.log('[LP Deposit] Tx sent:', tx.hash)

        const receipt = await tx.wait()
        console.log('[LP Deposit] Confirmed:', receipt?.hash)

        setLoading(false)
        return { success: true, txHash: receipt?.hash }
      } catch (err) {
        console.error('[LP Deposit] Error:', err)
        const errorMsg = extractErrorMessage(err)
        setError(errorMsg)
        setLoading(false)
        return { success: false, error: errorMsg }
      }
    },
    [wallets]
  )

  return {
    deposit,
    loading,
    error,
    MIN_DEPOSIT_USDC,
  }
}
