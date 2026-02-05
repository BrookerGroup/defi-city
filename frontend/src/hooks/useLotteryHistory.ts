/**
 * useLotteryHistory Hook
 * Queries Megapot contract event logs for lottery history (purchases, jackpot results, claims)
 */

import { useState, useCallback, useEffect } from 'react'
import { ethers } from 'ethers'
import { CONTRACTS, ABIS, SUPPORTED_CHAINS } from '@/config/contracts'
import { MPUSDC_DECIMALS } from '@/lib/constants'

export interface LotteryHistoryEntry {
  type: 'purchase' | 'jackpot_win' | 'jackpot_loss' | 'claim'
  timestamp: number
  blockNumber: number
  txHash: string
  amount?: number
  ticketsBps?: number
  winner?: string
}

export function useLotteryHistory(smartWalletAddress: string | null) {
  const [history, setHistory] = useState<LotteryHistoryEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHistory = useCallback(async () => {
    if (!smartWalletAddress) return

    setLoading(true)
    setError(null)

    try {
      // Use Base Sepolia public RPC directly — Privy's BrowserProvider doesn't support eth_getLogs
      const provider = new ethers.JsonRpcProvider(
        SUPPORTED_CHAINS.baseSepolia.rpcUrls.default.http[0]
      )

      const addresses = CONTRACTS.baseSepolia
      const megapot = new ethers.Contract(addresses.MEGAPOT, ABIS.MEGAPOT, provider)

      // Query from a reasonable range (last ~50k blocks ≈ few days on Base)
      const currentBlock = await provider.getBlockNumber()
      const fromBlock = Math.max(0, currentBlock - 50000)

      const [purchaseEvents, jackpotEvents, withdrawalEvents] = await Promise.all([
        megapot.queryFilter(megapot.filters.UserTicketPurchase(smartWalletAddress), fromBlock),
        megapot.queryFilter(megapot.filters.JackpotRun(), fromBlock),
        megapot.queryFilter(megapot.filters.UserWinWithdrawal(smartWalletAddress), fromBlock),
      ])

      const entries: LotteryHistoryEntry[] = []

      // Process purchase events
      for (const event of purchaseEvents) {
        const log = event as ethers.EventLog
        const block = await log.getBlock()
        entries.push({
          type: 'purchase',
          timestamp: block?.timestamp ?? 0,
          blockNumber: log.blockNumber,
          txHash: log.transactionHash,
          ticketsBps: Number(log.args[1]),
        })
      }

      // Process jackpot events — check if user won or lost
      for (const event of jackpotEvents) {
        const log = event as ethers.EventLog
        const winner = log.args[1] as string
        const isWinner = winner.toLowerCase() === smartWalletAddress.toLowerCase()

        // Only show jackpot events if user had tickets (was a participant)
        // We check if any purchase event is in the same or earlier block
        const hadTickets = purchaseEvents.some(
          (pe) => pe.blockNumber <= log.blockNumber
        )
        if (!hadTickets && !isWinner) continue

        const block = await log.getBlock()
        entries.push({
          type: isWinner ? 'jackpot_win' : 'jackpot_loss',
          timestamp: block?.timestamp ?? 0,
          blockNumber: log.blockNumber,
          txHash: log.transactionHash,
          amount: isWinner ? Number(ethers.formatUnits(log.args[3], MPUSDC_DECIMALS)) : undefined,
          winner,
        })
      }

      // Process withdrawal/claim events
      for (const event of withdrawalEvents) {
        const log = event as ethers.EventLog
        const block = await log.getBlock()
        entries.push({
          type: 'claim',
          timestamp: block?.timestamp ?? 0,
          blockNumber: log.blockNumber,
          txHash: log.transactionHash,
          amount: Number(ethers.formatUnits(log.args[1], MPUSDC_DECIMALS)),
        })
      }

      // Sort by block number descending (newest first)
      entries.sort((a, b) => b.blockNumber - a.blockNumber)

      setHistory(entries)
    } catch (err: any) {
      console.error('Error fetching lottery history:', err)
      setError(err.message || 'Failed to fetch history')
    } finally {
      setLoading(false)
    }
  }, [smartWalletAddress])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  return { history, loading, error, refresh: fetchHistory }
}
