'use client'

/**
 * useTransactionHistory - Hook for fetching transaction history via BaseScan API
 * Uses Etherscan API V2 to get all historical token transfers
 */

import { useState, useEffect, useCallback, useMemo } from 'react'
import { formatUnits } from 'viem'
import { CONTRACTS } from '@/config/contracts'

// Types
export type TxType = 'deposit' | 'withdraw' | 'place' | 'harvest' | 'demolish'

export interface Transaction {
  hash: string
  type: TxType
  asset: string        // address
  assetSymbol: string  // 'USDC' etc.
  amount: string       // formatted
  timestamp: number
  blockNumber: number
  status: 'success'
}

export interface TxFilters {
  type: TxType | 'all'
  asset: string // address or 'all'
}

const PAGE_SIZE = 20

// Asset address to symbol mapping (lowercase)
const ASSET_MAP: Record<string, { symbol: string; decimals: number }> = {
  [CONTRACTS.baseSepolia.USDC.toLowerCase()]: { symbol: 'USDC', decimals: 6 },
  [CONTRACTS.baseSepolia.USDT.toLowerCase()]: { symbol: 'USDT', decimals: 6 },
  [CONTRACTS.baseSepolia.ETH.toLowerCase()]: { symbol: 'ETH', decimals: 18 },
  [CONTRACTS.baseSepolia.WBTC.toLowerCase()]: { symbol: 'WBTC', decimals: 8 },
  [CONTRACTS.baseSepolia.LINK.toLowerCase()]: { symbol: 'LINK', decimals: 18 },
}

// Etherscan API V2 unified endpoint (works for Base Sepolia with chainId)
const ETHERSCAN_API = 'https://api.etherscan.io/v2/api'
const BASESCAN_API_KEY = process.env.NEXT_PUBLIC_BASESCAN_API_KEY || ''
const BASE_SEPOLIA_CHAIN_ID = 84532

interface BaseScanTokenTx {
  hash: string
  from: string
  to: string
  value: string
  tokenSymbol: string
  tokenDecimal: string
  contractAddress: string
  timeStamp: string
  blockNumber: string
}

export function useTransactionHistory(
  userAddress?: `0x${string}`,
  smartWalletAddress?: `0x${string}` | null
) {
  const [allTransactions, setAllTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<TxFilters>({ type: 'all', asset: 'all' })
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)

  const fetchTransactions = useCallback(async () => {
    if (!smartWalletAddress) return

    setLoading(true)
    setError(null)

    try {
      const url = `${ETHERSCAN_API}?chainid=${BASE_SEPOLIA_CHAIN_ID}&module=account&action=tokentx&address=${smartWalletAddress}&sort=desc&apikey=${BASESCAN_API_KEY}`
      const response = await fetch(url)
      const data = await response.json()

      // Check API response
      if (data.status !== '1') {
        if (data.message === 'No transactions found') {
          setAllTransactions([])
          setTotalCount(0)
          return
        }
        throw new Error(data.message || 'BaseScan API error')
      }

      const tokenTxs: BaseScanTokenTx[] = data.result || []
      const walletLower = smartWalletAddress.toLowerCase()
      const transactions: Transaction[] = []

      for (const tx of tokenTxs) {
        const isDeposit = tx.to.toLowerCase() === walletLower
        const isWithdraw = tx.from.toLowerCase() === walletLower

        if (!isDeposit && !isWithdraw) continue
        if (tx.from === '0x0000000000000000000000000000000000000000' ||
            tx.to === '0x0000000000000000000000000000000000000000') continue

        const assetInfo = ASSET_MAP[tx.contractAddress.toLowerCase()]
        const decimals = assetInfo?.decimals || parseInt(tx.tokenDecimal) || 18
        const symbol = assetInfo?.symbol || tx.tokenSymbol || 'UNKNOWN'

        transactions.push({
          hash: tx.hash,
          type: isDeposit ? 'deposit' : 'withdraw',
          asset: tx.contractAddress,
          assetSymbol: symbol,
          amount: formatUnits(BigInt(tx.value), decimals),
          timestamp: parseInt(tx.timeStamp),
          blockNumber: parseInt(tx.blockNumber),
          status: 'success',
        })
      }

      // Deduplicate
      const seen = new Set<string>()
      const dedupedTransactions = transactions.filter(tx => {
        const key = `${tx.hash}-${tx.type}-${tx.asset}`
        if (seen.has(key)) return false
        seen.add(key)
        return true
      })

      setTotalCount(dedupedTransactions.length)
      setAllTransactions(dedupedTransactions)
    } catch (err) {
      console.error('[useTransactionHistory] Error:', err)
      setError('Failed to fetch transaction history')
    } finally {
      setLoading(false)
    }
  }, [smartWalletAddress])

  // Fetch on mount and when smartWallet changes
  useEffect(() => {
    if (smartWalletAddress) {
      fetchTransactions()
    }
  }, [smartWalletAddress]) // eslint-disable-line react-hooks/exhaustive-deps

  // Apply filters
  const filteredTransactions = useMemo(() => {
    return allTransactions.filter(tx => {
      if (filters.type !== 'all' && tx.type !== filters.type) return false
      if (filters.asset !== 'all' && tx.asset.toLowerCase() !== filters.asset.toLowerCase()) return false
      return true
    })
  }, [allTransactions, filters])

  // Paginate
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / PAGE_SIZE))
  const paginatedTransactions = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE
    return filteredTransactions.slice(start, start + PAGE_SIZE)
  }, [filteredTransactions, page])

  // Reset page when filters change
  useEffect(() => {
    setPage(1)
  }, [filters])

  return {
    transactions: paginatedTransactions,
    allTransactions: filteredTransactions,
    loading,
    error,
    filters,
    setFilters,
    page,
    setPage,
    totalPages,
    totalCount,
    refetch: fetchTransactions,
  }
}
