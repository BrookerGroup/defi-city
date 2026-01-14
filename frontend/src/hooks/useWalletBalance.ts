'use client'

import { useBalance } from 'wagmi'
import { formatEther } from 'viem'
import { sepolia } from 'wagmi/chains'

export function useWalletBalance(address: `0x${string}` | undefined) {
  const { data, isLoading, refetch } = useBalance({
    address,
    chainId: sepolia.id,
    query: {
      enabled: !!address,
      refetchInterval: 10_000,
    },
  })

  return {
    balance: data?.value,
    formatted: data ? formatEther(data.value) : '0',
    symbol: data?.symbol || 'ETH',
    isLoading,
    refetch,
  }
}
