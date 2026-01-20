import { useReadContract } from 'wagmi'
import { FACTORY_ADDRESS, SimpleWalletFactoryABI } from '@/lib/contracts'

export function useSmartWallet(ownerAddress?: string) {
  const { data: smartWallet, isLoading, refetch } = useReadContract({
    address: FACTORY_ADDRESS,
    abi: SimpleWalletFactoryABI,
    functionName: 'getWalletAddress',
    args: ownerAddress ? [ownerAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!ownerAddress,
      // Refetch when address changes and don't use stale cache
      staleTime: 0,
      refetchOnMount: true,
    },
  })

  // Check if wallet exists (not zero address)
  const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'
  const hasSmartWallet = smartWallet && smartWallet !== ZERO_ADDRESS

  return {
    smartWallet: hasSmartWallet ? smartWallet : null,
    loading: isLoading,
    hasSmartWallet,
    refetch,
  }
}
