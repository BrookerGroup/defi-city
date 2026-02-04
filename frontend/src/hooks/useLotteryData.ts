/**
 * useLotteryData Hook
 * Fetches real-time Megapot lottery protocol data (jackpot, time remaining, ticket price)
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'
import { MPUSDC_DECIMALS } from '@/lib/constants'

export interface LotteryData {
  jackpotAmount: number
  ticketPrice: number
  timeRemaining: number
  roundEndTime: number
  roundDuration: number
  feeBps: number
  allowPurchasing: boolean
}

export function useLotteryData() {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [data, setData] = useState<LotteryData | null>(null)
  const [error, setError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const fetchData = useCallback(async () => {
    if (!wallets || wallets.length === 0) return

    setLoading(true)
    try {
      const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
      const ethereumProvider = await wallet.getEthereumProvider()
      const provider = new ethers.BrowserProvider(ethereumProvider)

      const addresses = CONTRACTS.baseSepolia
      const megapot = new ethers.Contract(addresses.MEGAPOT, ABIS.MEGAPOT, provider)

      const [lpPoolTotal, ticketPrice, lastJackpotEndTime, roundDurationInSeconds, feeBps, allowPurchasing] =
        await Promise.all([
          megapot.lpPoolTotal(),
          megapot.ticketPrice(),
          megapot.lastJackpotEndTime(),
          megapot.roundDurationInSeconds(),
          megapot.feeBps(),
          megapot.allowPurchasing(),
        ])

      const jackpotAmount = Number(ethers.formatUnits(lpPoolTotal, MPUSDC_DECIMALS))
      const ticketPriceNum = Number(ethers.formatUnits(ticketPrice, MPUSDC_DECIMALS))
      const endTime = Number(lastJackpotEndTime) + Number(roundDurationInSeconds)
      const now = Math.floor(Date.now() / 1000)
      const timeRemaining = Math.max(0, endTime - now)

      setData({
        jackpotAmount,
        ticketPrice: ticketPriceNum,
        timeRemaining,
        roundEndTime: endTime,
        roundDuration: Number(roundDurationInSeconds),
        feeBps: Number(feeBps),
        allowPurchasing,
      })
      setError(null)
    } catch (err: any) {
      console.error('Error fetching lottery data:', err)
      setError(err.message || 'Failed to fetch lottery data')
    } finally {
      setLoading(false)
    }
  }, [wallets])

  // Client-side countdown timer
  useEffect(() => {
    if (!data) return

    if (timerRef.current) clearInterval(timerRef.current)

    timerRef.current = setInterval(() => {
      setData((prev) => {
        if (!prev) return prev
        const now = Math.floor(Date.now() / 1000)
        const timeRemaining = Math.max(0, prev.roundEndTime - now)
        if (timeRemaining === 0 && prev.timeRemaining > 0) {
          // Round ended, refetch
          fetchData()
        }
        return { ...prev, timeRemaining }
      })
    }, 1000)

    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [data?.roundEndTime, fetchData])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  return {
    data,
    loading,
    error,
    refresh: fetchData,
  }
}
