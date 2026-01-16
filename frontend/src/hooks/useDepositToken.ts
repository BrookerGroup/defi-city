'use client'

import { useWriteContract, useWaitForTransactionReceipt, useReadContract, useSendTransaction } from 'wagmi'
import { parseUnits, parseEther, maxUint256 } from 'viem'
import { toast } from 'sonner'
import { useEffect, useState, useCallback } from 'react'
import { TOKEN_ADDRESSES, TOKEN_DECIMALS, ZERO_ADDRESS } from '@/lib/constants'

// Extended token type to include ETH
export type DepositTokenSymbol = 'USDC' | 'USDT' | 'WBTC' | 'WETH' | 'ETH'

// Standard ERC20 ABI
const ERC20_ABI = [
  {
    inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'to', type: 'address' }, { name: 'amount', type: 'uint256' }],
    name: 'transfer',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ name: 'owner', type: 'address' }, { name: 'spender', type: 'address' }],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

type DepositStep = 'idle' | 'approving' | 'approved' | 'depositing' | 'success' | 'error'

export function useDepositToken(
  smartWalletAddress: `0x${string}` | null,
  ownerAddress: `0x${string}` | undefined,
  token: DepositTokenSymbol
) {
  const [step, setStep] = useState<DepositStep>('idle')
  const [depositAmount, setDepositAmount] = useState<bigint>(0n)

  const isNativeETH = token === 'ETH'
  const tokenAddress = isNativeETH ? ZERO_ADDRESS : TOKEN_ADDRESSES[token as keyof typeof TOKEN_ADDRESSES]
  const decimals = TOKEN_DECIMALS[token]

  // Check current allowance (only for ERC-20 tokens)
  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: tokenAddress as `0x${string}`,
    abi: ERC20_ABI,
    functionName: 'allowance',
    args: ownerAddress && smartWalletAddress ? [ownerAddress, smartWalletAddress] : undefined,
    query: {
      enabled: !isNativeETH && !!ownerAddress && !!smartWalletAddress && tokenAddress !== ZERO_ADDRESS,
    },
  })

  // Approve transaction (ERC-20 only)
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
    error: approveError,
    reset: resetApprove,
  } = useWriteContract()

  const {
    isLoading: isApproveConfirming,
    isSuccess: isApproveSuccess,
    error: approveReceiptError,
  } = useWaitForTransactionReceipt({
    hash: approveHash,
  })

  // Transfer transaction (ERC-20)
  const {
    writeContract: writeTransfer,
    data: transferHash,
    isPending: isTransferPending,
    error: transferError,
    reset: resetTransfer,
  } = useWriteContract()

  const {
    isLoading: isTransferConfirming,
    isSuccess: isTransferSuccess,
    error: transferReceiptError,
  } = useWaitForTransactionReceipt({
    hash: transferHash,
  })

  // Native ETH transfer
  const {
    sendTransaction,
    data: ethTransferHash,
    isPending: isEthTransferPending,
    error: ethTransferError,
    reset: resetEthTransfer,
  } = useSendTransaction()

  const {
    isLoading: isEthTransferConfirming,
    isSuccess: isEthTransferSuccess,
    error: ethTransferReceiptError,
  } = useWaitForTransactionReceipt({
    hash: ethTransferHash,
  })

  // Handle approval success - proceed to transfer
  useEffect(() => {
    if (isApproveSuccess && step === 'approving') {
      setStep('approved')
      refetchAllowance()
      toast.success('Approval successful!', {
        description: `${token} approved. Now depositing...`,
      })
      // Auto-proceed to transfer
      if (smartWalletAddress && depositAmount > 0n) {
        writeTransfer({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: 'transfer',
          args: [smartWalletAddress, depositAmount],
        })
        setStep('depositing')
      }
    }
  }, [isApproveSuccess, step, smartWalletAddress, depositAmount, tokenAddress, token, writeTransfer, refetchAllowance])

  // Handle ERC-20 transfer success
  useEffect(() => {
    if (isTransferSuccess && step === 'depositing' && !isNativeETH) {
      setStep('success')
      toast.success('Deposit successful!', {
        description: `${token} has been deposited to your Smart Wallet`,
        action: transferHash ? {
          label: 'View TX',
          onClick: () => window.open(`https://sepolia.basescan.org/tx/${transferHash}`, '_blank'),
        } : undefined,
      })
    }
  }, [isTransferSuccess, step, token, transferHash, isNativeETH])

  // Handle ETH transfer success
  useEffect(() => {
    if (isEthTransferSuccess && step === 'depositing' && isNativeETH) {
      setStep('success')
      toast.success('Deposit successful!', {
        description: 'ETH has been deposited to your Smart Wallet',
        action: ethTransferHash ? {
          label: 'View TX',
          onClick: () => window.open(`https://sepolia.basescan.org/tx/${ethTransferHash}`, '_blank'),
        } : undefined,
      })
    }
  }, [isEthTransferSuccess, step, ethTransferHash, isNativeETH])

  // Handle errors
  useEffect(() => {
    const error = approveError || approveReceiptError || transferError || transferReceiptError || ethTransferError || ethTransferReceiptError
    if (error && step !== 'idle' && step !== 'success') {
      setStep('error')
      toast.error('Transaction failed', {
        description: error.message,
      })
    }
  }, [approveError, approveReceiptError, transferError, transferReceiptError, ethTransferError, ethTransferReceiptError, step])

  const deposit = useCallback((amount: string) => {
    if (!smartWalletAddress) {
      toast.error('No Smart Wallet found')
      return
    }

    if (!ownerAddress) {
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

    // Handle native ETH deposit
    if (isNativeETH) {
      const value = parseEther(trimmedAmount)
      setDepositAmount(value)
      setStep('depositing')
      sendTransaction({
        to: smartWalletAddress,
        value,
      })
      return
    }

    // Handle ERC-20 token deposit
    const value = parseUnits(trimmedAmount, decimals)
    setDepositAmount(value)

    // Check if approval is needed
    const currentAllowance = allowance ?? 0n
    if (currentAllowance < value) {
      // Need to approve first
      setStep('approving')
      writeApprove({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [smartWalletAddress, maxUint256], // Approve max for convenience
      })
    } else {
      // Already approved, proceed to transfer
      setStep('depositing')
      writeTransfer({
        address: tokenAddress as `0x${string}`,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [smartWalletAddress, value],
      })
    }
  }, [smartWalletAddress, ownerAddress, decimals, allowance, tokenAddress, writeApprove, writeTransfer, sendTransaction, isNativeETH])

  const reset = useCallback(() => {
    setStep('idle')
    setDepositAmount(0n)
    resetApprove()
    resetTransfer()
    resetEthTransfer()
  }, [resetApprove, resetTransfer, resetEthTransfer])

  const needsApproval = useCallback((amount: string): boolean => {
    if (isNativeETH) return false
    if (!amount || isNaN(Number(amount))) return false
    const value = parseUnits(amount.trim(), decimals)
    return (allowance ?? 0n) < value
  }, [isNativeETH, decimals, allowance])

  // Combined hash for both ETH and ERC-20
  const hash = isNativeETH ? ethTransferHash : transferHash

  return {
    deposit,
    step,
    isPending: isApprovePending || isTransferPending || isEthTransferPending,
    isConfirming: isApproveConfirming || isTransferConfirming || isEthTransferConfirming,
    isSuccess: isNativeETH ? isEthTransferSuccess : isTransferSuccess,
    hash,
    approveHash,
    error: approveError || transferError || ethTransferError,
    reset,
    needsApproval,
    allowance,
    isNativeETH,
  }
}
