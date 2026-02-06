/**
 * useMegapotLPPosition Hook
 * Read LP position data and pool stats from Megapot contract
 */

import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import { CONTRACTS, ABIS } from '@/config/contracts'

const RPC_URL = 'https://base-sepolia-rpc.publicnode.com'

export interface LPPosition {
  principal: number      // Total deposited amount (USDC)
  stake: number          // Amount at risk (principal * riskPercentage)
  riskPercentage: number // 0-100%
  active: boolean        // Is position active
}

export interface LPPoolStats {
  lpPoolTotal: number    // Total LP in pool (USDC)
  lpPoolCap: number      // Maximum LP cap (USDC)
  userShare: number      // User's share of pool (%)
}

export function useMegapotLPPosition(smartWalletAddress: string | null) {
  const [position, setPosition] = useState<LPPosition | null>(null)
  const [poolStats, setPoolStats] = useState<LPPoolStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPosition = useCallback(async () => {
    if (!smartWalletAddress) {
      setPosition(null)
      setPoolStats(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL)
      const megapot = new ethers.Contract(
        CONTRACTS.baseSepolia.MEGAPOT,
        ABIS.MEGAPOT,
        provider
      )

      // Fetch LP position and pool stats in parallel
      const [lpInfo, poolTotal, poolCap] = await Promise.all([
        megapot.lpsInfo(smartWalletAddress).catch(() => null),
        megapot.lpPoolTotal().catch(() => 0n),
        megapot.lpPoolCap().catch(() => 0n),
      ])

      // Parse LP position (values are in szabo: 1,000,000 = 1 USDC)
      if (lpInfo) {
        const principal = Number(lpInfo.principal) / 1_000_000
        const stake = Number(lpInfo.stake) / 1_000_000
        const riskPercentage = Number(lpInfo.riskPercentage)
        const active = lpInfo.active

        setPosition({
          principal,
          stake,
          riskPercentage,
          active,
        })
      } else {
        setPosition({
          principal: 0,
          stake: 0,
          riskPercentage: 0,
          active: false,
        })
      }

      // Parse pool stats
      const lpPoolTotalNum = Number(poolTotal) / 1_000_000
      const lpPoolCapNum = Number(poolCap) / 1_000_000
      const userPrincipal = lpInfo ? Number(lpInfo.principal) / 1_000_000 : 0
      const userShare = lpPoolTotalNum > 0 ? (userPrincipal / lpPoolTotalNum) * 100 : 0

      setPoolStats({
        lpPoolTotal: lpPoolTotalNum,
        lpPoolCap: lpPoolCapNum,
        userShare,
      })

      setLoading(false)
    } catch (err) {
      console.error('[LP Position] Error fetching:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch LP position')
      setLoading(false)
    }
  }, [smartWalletAddress])

  // Fetch on mount and when address changes
  useEffect(() => {
    fetchPosition()
  }, [fetchPosition])

  return {
    position,
    poolStats,
    loading,
    error,
    refresh: fetchPosition,
  }
}
