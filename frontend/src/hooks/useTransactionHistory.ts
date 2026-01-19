'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { usePublicClient } from 'wagmi'

export type TransactionType = 'deposit' | 'withdraw' | 'place' | 'harvest' | 'demolish' | 'unknown'

export interface Transaction {
  hash: string
  type: TransactionType
  asset?: string
  amount?: string
  timestamp: number
  status: 'success' | 'pending' | 'failed'
  blockNumber?: number
}

export interface TransactionFilter {
  type: TransactionType | 'all'
  asset: string | 'all'
}

export interface PaginationState {
  page: number
  itemsPerPage: number
  totalItems: number
  totalPages: number
}

const DEFAULT_ITEMS_PER_PAGE = 10

// Simple in-memory transaction store (will be replaced with indexer later)
const transactionStore: Map<string, Transaction[]> = new Map()

export function useTransactionHistory(address: `0x${string}` | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [filter, setFilter] = useState<TransactionFilter>({ type: 'all', asset: 'all' })
  const [page, setPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(DEFAULT_ITEMS_PER_PAGE)
  const publicClient = usePublicClient()

  // Load from localStorage on mount
  useEffect(() => {
    if (!address) return

    const stored = localStorage.getItem(`tx-history-${address}`)
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Transaction[]
        setTransactions(parsed)
        transactionStore.set(address, parsed)
      } catch {
        // Ignore parse errors
      }
    }
  }, [address])

  // Apply filters to transactions
  const filteredTransactions = useMemo(() => {
    let result = [...transactions]

    // Filter by type
    if (filter.type !== 'all') {
      result = result.filter(tx => tx.type === filter.type)
    }

    // Filter by asset
    if (filter.asset !== 'all') {
      result = result.filter(tx => tx.asset?.toLowerCase() === filter.asset.toLowerCase())
    }

    return result
  }, [transactions, filter])

  // Calculate pagination
  const pagination: PaginationState = useMemo(() => {
    const totalItems = filteredTransactions.length
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage))
    return {
      page: Math.min(page, totalPages),
      itemsPerPage,
      totalItems,
      totalPages,
    }
  }, [filteredTransactions.length, page, itemsPerPage])

  // Get paginated transactions
  const paginatedTransactions = useMemo(() => {
    const start = (pagination.page - 1) * itemsPerPage
    const end = start + itemsPerPage
    return filteredTransactions.slice(start, end)
  }, [filteredTransactions, pagination.page, itemsPerPage])

  // Get unique assets from transactions
  const availableAssets = useMemo(() => {
    const assets = new Set<string>()
    transactions.forEach(tx => {
      if (tx.asset) {
        assets.add(tx.asset.toUpperCase())
      }
    })
    return Array.from(assets).sort()
  }, [transactions])

  // Add transaction
  const addTransaction = useCallback((tx: Omit<Transaction, 'timestamp' | 'status'>) => {
    if (!address) return

    const newTx: Transaction = {
      ...tx,
      timestamp: Date.now(),
      status: 'pending',
    }

    const current = transactionStore.get(address) || []
    const updated = [newTx, ...current].slice(0, 100) // Keep last 100

    transactionStore.set(address, updated)
    setTransactions(updated)
    localStorage.setItem(`tx-history-${address}`, JSON.stringify(updated))

    // Watch for confirmation
    watchTransaction(tx.hash)
  }, [address])

  // Watch transaction for confirmation
  const watchTransaction = async (hash: string) => {
    if (!publicClient || !address) return

    try {
      const receipt = await publicClient.waitForTransactionReceipt({
        hash: hash as `0x${string}`,
      })

      const current = transactionStore.get(address) || []
      const updated = current.map((tx) =>
        tx.hash === hash
          ? {
              ...tx,
              status: receipt.status === 'success' ? 'success' : 'failed',
              blockNumber: Number(receipt.blockNumber),
            } as Transaction
          : tx
      )

      transactionStore.set(address, updated)
      setTransactions(updated)
      localStorage.setItem(`tx-history-${address}`, JSON.stringify(updated))
    } catch {
      // Mark as failed if error
      const current = transactionStore.get(address) || []
      const updated = current.map((tx) =>
        tx.hash === hash ? { ...tx, status: 'failed' as const } : tx
      )
      transactionStore.set(address, updated)
      setTransactions(updated)
    }
  }

  // Update filter
  const updateFilter = useCallback((newFilter: Partial<TransactionFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }))
    setPage(1) // Reset to first page when filter changes
  }, [])

  // Reset filter
  const resetFilter = useCallback(() => {
    setFilter({ type: 'all', asset: 'all' })
    setPage(1)
  }, [])

  // Pagination controls
  const goToPage = useCallback((newPage: number) => {
    setPage(Math.max(1, Math.min(newPage, pagination.totalPages)))
  }, [pagination.totalPages])

  const nextPage = useCallback(() => {
    goToPage(page + 1)
  }, [page, goToPage])

  const prevPage = useCallback(() => {
    goToPage(page - 1)
  }, [page, goToPage])

  // Clear history
  const clearHistory = useCallback(() => {
    if (!address) return
    transactionStore.delete(address)
    setTransactions([])
    localStorage.removeItem(`tx-history-${address}`)
  }, [address])

  return {
    // All transactions
    transactions,
    // Filtered and paginated transactions
    filteredTransactions: paginatedTransactions,
    // Loading state
    isLoading,
    // Filter state and actions
    filter,
    updateFilter,
    resetFilter,
    availableAssets,
    // Pagination state and actions
    pagination,
    goToPage,
    nextPage,
    prevPage,
    setItemsPerPage,
    // Actions
    addTransaction,
    clearHistory,
  }
}
