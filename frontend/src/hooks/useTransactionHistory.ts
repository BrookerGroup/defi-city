'use client'

import { useEffect, useState } from 'react'
import { usePublicClient } from 'wagmi'

export interface Transaction {
  hash: string
  type: 'deposit' | 'withdraw' | 'place' | 'harvest' | 'demolish' | 'unknown'
  asset?: string
  amount?: string
  timestamp: number
  status: 'success' | 'pending' | 'failed'
  blockNumber?: number
}

// Simple in-memory transaction store (will be replaced with indexer later)
const transactionStore: Map<string, Transaction[]> = new Map()

export function useTransactionHistory(address: `0x${string}` | undefined) {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isLoading, setIsLoading] = useState(false)
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

  // Add transaction
  const addTransaction = (tx: Omit<Transaction, 'timestamp' | 'status'>) => {
    if (!address) return

    const newTx: Transaction = {
      ...tx,
      timestamp: Date.now(),
      status: 'pending',
    }

    const current = transactionStore.get(address) || []
    const updated = [newTx, ...current].slice(0, 50) // Keep last 50

    transactionStore.set(address, updated)
    setTransactions(updated)
    localStorage.setItem(`tx-history-${address}`, JSON.stringify(updated))

    // Watch for confirmation
    watchTransaction(tx.hash)
  }

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

  // Clear history
  const clearHistory = () => {
    if (!address) return
    transactionStore.delete(address)
    setTransactions([])
    localStorage.removeItem(`tx-history-${address}`)
  }

  return {
    transactions,
    isLoading,
    addTransaction,
    clearHistory,
  }
}
