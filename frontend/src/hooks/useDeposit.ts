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

    const value = parseEther(amount)
    if (value <= 0n) {
      toast.error('Invalid amount')
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
