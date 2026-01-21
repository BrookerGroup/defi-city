import { useState, useEffect, useCallback } from 'react'
import { createPublicClient, http } from 'viem'
import { baseSepolia } from 'viem/chains'
import { CORE_ADDRESS, DefiCityCoreABI } from '@/lib/contracts'

// Base Sepolia RPC - using publicnode as primary
const BASE_SEPOLIA_RPC = 'https://base-sepolia-rpc.publicnode.com'

// Create a public client for reading contract data
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http(BASE_SEPOLIA_RPC),
})

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

export function useSmartWallet(ownerAddress?: string) {
  const [smartWallet, setSmartWallet] = useState<`0x${string}` | null>(null)
  const [loading, setLoading] = useState(false)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchWalletAddress = useCallback(async () => {
    if (!ownerAddress) {
      setSmartWallet(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setIsError(false)
    setError(null)

    try {
      console.log('[useSmartWallet] Fetching wallet for:', ownerAddress)
      console.log('[useSmartWallet] Using CORE_ADDRESS:', CORE_ADDRESS)

      // Use DefiCityCore.getWallet() to get user's SmartWallet
      const result = await publicClient.readContract({
        address: CORE_ADDRESS,
        abi: DefiCityCoreABI,
        functionName: 'getWallet',
        args: [ownerAddress as `0x${string}`],
      })

      console.log('[useSmartWallet] Contract result:', result)

      if (result && result !== ZERO_ADDRESS) {
        setSmartWallet(result as `0x${string}`)
      } else {
        setSmartWallet(null)
      }
    } catch (err) {
      console.error('[useSmartWallet] Error:', err)
      setIsError(true)
      setError(err instanceof Error ? err : new Error('Failed to fetch wallet address'))
      setSmartWallet(null)
    } finally {
      setLoading(false)
    }
  }, [ownerAddress])

  // Fetch on mount and when address changes
  useEffect(() => {
    fetchWalletAddress()
  }, [fetchWalletAddress])

  const hasSmartWallet = !!smartWallet && smartWallet !== ZERO_ADDRESS

  return {
    smartWallet,
    loading,
    hasSmartWallet,
    isError,
    error,
    refetch: fetchWalletAddress,
  }
}
