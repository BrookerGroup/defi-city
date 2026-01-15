'use client'

import { useSendTransaction, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { toast } from 'sonner'
import { useEffect } from 'react'

export function useDeposit(smartWalletAddress: `0x${string}` | null) {
  const {
    sendTransaction,
    data: hash,
    isPending,
    error,
    reset,
  } = useSendTransaction()

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    if (isSuccess) {
      toast.success('Deposit successful!', {
        description: 'ETH has been deposited to your Smart Wallet',
      })
    }
  }, [isSuccess])

  useEffect(() => {
    if (error || receiptError) {
      toast.error('Deposit failed', {
        description: error?.message || receiptError?.message,
      })
    }
  }, [error, receiptError])

  const deposit = (amount: string) => {
    if (!smartWalletAddress) {
      toast.error('No Smart Wallet found')
      return
    }

    // Validate amount format
    const trimmedAmount = amount.trim()
    if (!trimmedAmount || isNaN(Number(trimmedAmount))) {
      toast.error('Invalid amount', {
        description: 'Please enter a valid number',
      })
      return
    }

    const value = parseEther(trimmedAmount)
    if (value <= 0n) {
      toast.error('Invalid amount', {
        description: 'Amount must be greater than 0',
      })
      return
    }

    // Safety check: warn for large deposits (> 10 ETH)
    const MAX_SAFE_DEPOSIT = parseEther('10')
    if (value > MAX_SAFE_DEPOSIT) {
      toast.warning('Large deposit detected', {
        description: `You are about to deposit ${trimmedAmount} ETH. Please confirm this is correct.`,
      })
    }

    // Hard limit: prevent extremely large deposits (> 1000 ETH)
    const MAX_DEPOSIT = parseEther('1000')
    if (value > MAX_DEPOSIT) {
      toast.error('Amount too large', {
        description: 'Maximum deposit is 1000 ETH per transaction',
      })
      return
    }

    sendTransaction({
      to: smartWalletAddress,
      value,
    })
  }

  return {
    deposit,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    error,
    reset,
  }
}
