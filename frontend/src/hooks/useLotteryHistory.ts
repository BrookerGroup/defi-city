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

      // Query in chunks of 10k blocks (RPC limit) — scan last 50k blocks
      const currentBlock = await provider.getBlockNumber()
      const maxRange = 10000
      const totalRange = 50000
      const startBlock = Math.max(0, currentBlock - totalRange)

      const purchaseEvents: ethers.EventLog[] = []
      const jackpotEvents: ethers.EventLog[] = []
      const withdrawalEvents: ethers.EventLog[] = []

      for (let from = startBlock; from <= currentBlock; from += maxRange) {
        const to = Math.min(from + maxRange - 1, currentBlock)
        const [purchases, jackpots, withdrawals] = await Promise.all([
          megapot.queryFilter(megapot.filters.UserTicketPurchase(smartWalletAddress), from, to),
          megapot.queryFilter(megapot.filters.JackpotRun(), from, to),
          megapot.queryFilter(megapot.filters.UserWinWithdrawal(smartWalletAddress), from, to),
        ])
        purchaseEvents.push(...purchases as ethers.EventLog[])
        jackpotEvents.push(...jackpots as ethers.EventLog[])
        withdrawalEvents.push(...withdrawals as ethers.EventLog[])
      }

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
