'use client'

import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { parseUnits, parseEther, encodeFunctionData } from 'viem'
import { toast } from 'sonner'
import { useEffect, useState, useCallback } from 'react'
import { TOKEN_ADDRESSES, TOKEN_DECIMALS, ZERO_ADDRESS } from '@/lib/constants'
import type { DepositTokenSymbol } from './useDepositToken'

// ERC20 ABI for transfer function
const ERC20_ABI = [
  {
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

// SmartWallet ABI for execute function
const SMART_WALLET_ABI = [
  {
    inputs: [
      { name: 'dest', type: 'address' },
      { name: 'value', type: 'uint256' },
      { name: 'func', type: 'bytes' }
    ],
    name: 'execute',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const

type WithdrawStep = 'idle' | 'withdrawing' | 'success' | 'error'

export function useWithdrawToken(
  smartWalletAddress: `0x${string}` | null,
  recipientAddress: `0x${string}` | undefined,
  token: DepositTokenSymbol
) {
  const [step, setStep] = useState<WithdrawStep>('idle')
  const [withdrawAmount, setWithdrawAmount] = useState<bigint>(0n)

  const isNativeETH = token === 'ETH'
  const tokenAddress = isNativeETH ? ZERO_ADDRESS : TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES]
  const decimals = TOKEN_DECIMALS[token]

  // Withdraw transaction
  const {
    writeContract,
    data: hash,
    isPending,
    error,
    reset: resetWrite,
  } = useWriteContract()

  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash,
  })

  // Handle withdrawal success
  useEffect(() => {
    if (isSuccess && step === 'withdrawing') {
      setStep('success')
      toast.success('Withdrawal successful!', {
        description: `${token} has been withdrawn to your wallet`,
        action: hash ? {
          label: 'View TX',
          onClick: () => window.open(`https://sepolia.basescan.org/tx/${hash}`, '_blank'),
        } : undefined,
      })
    }
  }, [isSuccess, step, token, hash])

  // Handle errors
  useEffect(() => {
    const errorObj = error || receiptError
    if (errorObj && step !== 'idle' && step !== 'success') {
      setStep('error')
      toast.error('Withdrawal failed', {
        description: errorObj.message,
      })
    }
  }, [error, receiptError, step])

  const withdraw = useCallback((amount: string) => {
    if (!smartWalletAddress) {
      toast.error('No Smart Wallet found')
      return
    }

    if (!recipientAddress) {
      toast.error('Wallet not connected')
      return
    }

    // Validate amount
    const trimmedAmount = amount.trim()
    if (!trimmedAmount || isNaN(Number(trimmedAmount))) {
      toast.error('Invalid amount', {
        description: 'Please enter a valid number',
      })
      return
    }

    const numAmount = parseFloat(trimmedAmount)
    if (numAmount <= 0) {
      toast.error('Invalid amount', {
        description: 'Amount must be greater than 0',
      })
      return
    }

    setStep('withdrawing')

    // Handle native ETH withdrawal
    if (isNativeETH) {
      const value = parseEther(trimmedAmount)
      setWithdrawAmount(value)

      // Call SmartWallet.execute(recipient, value, "0x")
      writeContract({
        address: smartWalletAddress,
        abi: SMART_WALLET_ABI,
        functionName: 'execute',
        args: [recipientAddress, value, '0x'],
      })
      return
    }

    // Handle ERC-20 token withdrawal
    const value = parseUnits(trimmedAmount, decimals)
    setWithdrawAmount(value)

    // Encode transfer(recipient, amount) call
    const transferCalldata = encodeFunctionData({
      abi: ERC20_ABI,
      functionName: 'transfer',
      args: [recipientAddress, value],
    })

    // Call SmartWallet.execute(tokenAddress, 0, transferCalldata)
    writeContract({
      address: smartWalletAddress,
      abi: SMART_WALLET_ABI,
      functionName: 'execute',
      args: [tokenAddress as `0x${string}`, 0n, transferCalldata],
    })
  }, [smartWalletAddress, recipientAddress, decimals, tokenAddress, writeContract, isNativeETH])

  const reset = useCallback(() => {
    setStep('idle')
    setWithdrawAmount(0n)
    resetWrite()
  }, [resetWrite])

  return {
    withdraw,
    step,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    error,
    reset,
    isNativeETH,
  }
}
