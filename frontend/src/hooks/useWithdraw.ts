'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseEther } from 'viem'
import { toast } from 'sonner'
import { useEffect } from 'react'
import { SimpleSmartWalletABI } from '@/lib/contracts'

export function useWithdraw(smartWalletAddress: `0x${string}` | null) {
  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset,
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  useEffect(() => {
    if (isSuccess) {
      toast.success('Withdrawal successful!', {
        description: 'ETH has been withdrawn from your Smart Wallet',
      })
    }
  }, [isSuccess])

  useEffect(() => {
    if (error || receiptError) {
      toast.error('Withdrawal failed', {
        description: error?.message || receiptError?.message,
      })
    }
  }, [error, receiptError])

  const withdraw = (amount: string, recipient: `0x${string}`) => {
    if (!smartWalletAddress) {
      toast.error('No Smart Wallet found')
      return
    }

    const value = parseEther(amount)
    if (value <= 0n) {
      toast.error('Invalid amount')
      return
    }

    writeContract({
      address: smartWalletAddress,
      abi: SimpleSmartWalletABI,
      functionName: 'withdrawETH',
      args: [recipient, value],
    })
  }

  const withdrawAll = (recipient: `0x${string}`) => {
    if (!smartWalletAddress) {
      toast.error('No Smart Wallet found')
      return
    }

    writeContract({
      address: smartWalletAddress,
      abi: SimpleSmartWalletABI,
      functionName: 'withdrawAllETH',
      args: [recipient],
    })
  }

  return {
    withdraw,
    withdrawAll,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    error,
    reset,
  }
}
