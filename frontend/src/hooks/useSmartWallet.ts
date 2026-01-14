'use client'

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { SimpleWalletFactoryABI, SimpleSmartWalletABI, addresses } from '@/lib/contracts'
import { ZERO_ADDRESS } from '@/lib/constants'
import { useEffect } from 'react'
import { useWalletStore } from '@/store/walletStore'

export function useSmartWallet(ownerAddress: `0x${string}` | undefined) {
  const { setSmartWalletAddress, setIsCreatingWallet } = useWalletStore()

  // Check if user has a wallet
  const {
    data: hasWallet,
    isLoading: isCheckingWallet,
    refetch: refetchHasWallet,
  } = useReadContract({
    address: addresses.factory,
    abi: SimpleWalletFactoryABI,
    functionName: 'hasWallet',
    args: ownerAddress ? [ownerAddress] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: !!ownerAddress,
    },
  })

  // Get wallet address
  const {
    data: walletAddress,
    isLoading: isLoadingWallet,
    refetch: refetchWallet,
  } = useReadContract({
    address: addresses.factory,
    abi: SimpleWalletFactoryABI,
    functionName: 'getWallet',
    args: ownerAddress ? [ownerAddress] : undefined,
    chainId: sepolia.id,
    query: {
      enabled: !!ownerAddress && hasWallet === true,
    },
  })

  // Get wallet balance
  const {
    data: balance,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
  } = useReadContract({
    address: walletAddress,
    abi: SimpleSmartWalletABI,
    functionName: 'getETHBalance',
    chainId: sepolia.id,
    query: {
      enabled: !!walletAddress && walletAddress !== ZERO_ADDRESS,
      refetchInterval: 10_000,
    },
  })

  // Create wallet
  const {
    writeContract: createWalletWrite,
    data: createWalletHash,
    isPending: isCreating,
    error: createError,
  } = useWriteContract()

  // Wait for transaction receipt
  const { isLoading: isWaitingForTx, isSuccess: isCreated } = useWaitForTransactionReceipt({
    hash: createWalletHash,
  })

  // Refetch wallet data after creation
  useEffect(() => {
    if (isCreated) {
      refetchHasWallet()
      refetchWallet()
      setIsCreatingWallet(false)
    }
  }, [isCreated, refetchHasWallet, refetchWallet, setIsCreatingWallet])

  // Update store when wallet address changes
  useEffect(() => {
    if (walletAddress && walletAddress !== ZERO_ADDRESS) {
      setSmartWalletAddress(walletAddress)
    }
  }, [walletAddress, setSmartWalletAddress])

  const createWallet = () => {
    if (!ownerAddress) return
    setIsCreatingWallet(true)
    createWalletWrite({
      address: addresses.factory,
      abi: SimpleWalletFactoryABI,
      functionName: 'createWallet',
      args: [ownerAddress],
    })
  }

  const isValidWallet = walletAddress && walletAddress !== ZERO_ADDRESS

  return {
    walletAddress: isValidWallet ? walletAddress : null,
    balance,
    hasWallet: hasWallet === true,
    isLoading: isCheckingWallet || isLoadingWallet,
    isLoadingBalance,
    isCreating: isCreating || isWaitingForTx,
    createWallet,
    createError,
    refetchBalance,
  }
}
