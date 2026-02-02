'use client'

/**
 * TransactionHistoryPanel - Right side panel showing transaction history
 * Follows VaultPanel pattern for consistency
 */

import { useMemo } from 'react'
import { useTransactionHistory, TxType, TxFilters } from '@/hooks/useTransactionHistory'
import { CONTRACTS } from '@/config/contracts'

interface TransactionHistoryPanelProps {
  visible: boolean
  userAddress?: `0x${string}`
  smartWalletAddress?: `0x${string}` | null
  onClose: () => void
}

const pixelFont = { fontFamily: '"Press Start 2P", monospace' } as const

// Type color mapping
const TYPE_COLORS: Record<TxType, string> = {
  deposit: 'text-blue-400',
  withdraw: 'text-purple-400',
  place: 'text-green-400',
  harvest: 'text-amber-400',
  demolish: 'text-red-400',
}

const TYPE_LABELS: Record<TxType, string> = {
  deposit: 'DEPOSIT',
  withdraw: 'WITHDRAW',
  place: 'PLACE',
  harvest: 'HARVEST',
  demolish: 'DEMOLISH',
}

// Asset options for filter
const ASSET_OPTIONS = [
  { value: 'all', label: 'ALL ASSETS' },
  { value: CONTRACTS.baseSepolia.USDC, label: 'USDC' },
  { value: CONTRACTS.baseSepolia.USDT, label: 'USDT' },
  { value: CONTRACTS.baseSepolia.ETH, label: 'ETH' },
  { value: CONTRACTS.baseSepolia.WBTC, label: 'WBTC' },
  { value: CONTRACTS.baseSepolia.LINK, label: 'LINK' },
]

const TYPE_OPTIONS: { value: TxType | 'all'; label: string }[] = [
  { value: 'all', label: 'ALL TYPES' },
  { value: 'deposit', label: 'DEPOSIT' },
  { value: 'withdraw', label: 'WITHDRAW' },
  { value: 'place', label: 'PLACE' },
  { value: 'harvest', label: 'HARVEST' },
  { value: 'demolish', label: 'DEMOLISH' },
]

// Format relative timestamp
function formatRelativeTime(timestamp: number): string {
  if (!timestamp) return 'Unknown'
  
  const now = Math.floor(Date.now() / 1000)
  const diff = now - timestamp

  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return new Date(timestamp * 1000).toLocaleDateString()
}

// Truncate tx hash
function truncateHash(hash: string): string {
  if (!hash) return ''
  return `${hash.slice(0, 6)}...${hash.slice(-4)}`
}

export function TransactionHistoryPanel({
  visible,
  userAddress,
  smartWalletAddress,
  onClose,
}: TransactionHistoryPanelProps) {
  const {
    transactions,
    loading,
    error,
    filters,
    setFilters,
    page,
    setPage,
    totalPages,
    totalCount,
    refetch,
  } = useTransactionHistory(userAddress, smartWalletAddress)

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev: TxFilters) => ({ ...prev, type: e.target.value as TxType | 'all' }))
  }

  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters((prev: TxFilters) => ({ ...prev, asset: e.target.value }))
  }

  if (!visible) return null

  return (
    <div className="pointer-events-auto absolute right-0 top-0 bottom-0 w-[360px] max-w-[90vw] bg-slate-900/92 backdrop-blur-sm border-l-2 border-slate-700 overflow-y-auto z-20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-slate-700 bg-slate-800/60">
        <div>
          <h3
            className="text-[10px] text-green-400"
            style={pixelFont}
          >
            TX HISTORY
          </h3>
          {totalCount > 0 && (
            <p className="text-slate-500 text-[5px] mt-0.5" style={pixelFont}>
              {totalCount} total transactions
            </p>
          )}
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 bg-red-600 border-2 border-red-400 text-white flex items-center justify-center hover:bg-red-500 text-[8px]"
          style={pixelFont}
        >
          X
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* Filters */}
        <div className="flex gap-2">
          <select
            value={filters.type}
            onChange={handleTypeChange}
            className="flex-1 bg-slate-900 border-2 border-slate-700 text-green-400 text-[7px] px-2 py-1.5 appearance-none cursor-pointer"
            style={pixelFont}
          >
            {TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <select
            value={filters.asset}
            onChange={handleAssetChange}
            className="flex-1 bg-slate-900 border-2 border-slate-700 text-green-400 text-[7px] px-2 py-1.5 appearance-none cursor-pointer"
            style={pixelFont}
          >
            {ASSET_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-8">
            <div className="flex gap-1.5">
              {[0, 1, 2].map(i => (
                <div
                  key={i}
                  className="w-2 h-2 bg-green-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <p className="text-green-400 text-[7px] mt-2" style={pixelFont}>
              LOADING...
            </p>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="flex flex-col items-center justify-center py-8 space-y-3">
            <p className="text-red-400 text-[7px] text-center" style={pixelFont}>
              {error}
            </p>
            <button
              onClick={refetch}
              className="px-3 py-1.5 bg-green-600 border-2 border-green-400 text-white text-[7px] hover:bg-green-500"
              style={pixelFont}
            >
              RETRY
            </button>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && transactions.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8">
            <p className="text-slate-500 text-[7px] text-center" style={pixelFont}>
              NO TRANSACTIONS FOUND
            </p>
            <p className="text-slate-600 text-[6px] text-center mt-2" style={pixelFont}>
              Deposit or build to see history
            </p>
          </div>
        )}

        {/* Transaction List */}
        {!loading && !error && transactions.length > 0 && (
          <div className="space-y-2">
            {transactions.map((tx, idx) => (
              <div
                key={`${tx.hash}-${idx}`}
                className="bg-slate-800/60 border border-slate-700 p-2.5 space-y-1"
              >
                {/* Top row: Type + Time */}
                <div className="flex items-center justify-between">
                  <span
                    className={`text-[7px] ${TYPE_COLORS[tx.type]}`}
                    style={pixelFont}
                  >
                    {TYPE_LABELS[tx.type]}
                  </span>
                  <span className="text-slate-500 text-[6px]" style={pixelFont}>
                    {formatRelativeTime(tx.timestamp)}
                  </span>
                </div>
                
                {/* Middle row: Asset + Amount */}
                <div className="flex items-center gap-2">
                  {tx.assetSymbol ? (
                    <>
                      <span className="text-white text-[8px]" style={pixelFont}>
                        {tx.assetSymbol}
                      </span>
                      <span className="text-green-400 text-[8px]" style={pixelFont}>
                        {parseFloat(tx.amount).toFixed(tx.assetSymbol === 'WBTC' ? 6 : tx.assetSymbol === 'USDC' || tx.assetSymbol === 'USDT' ? 2 : 4)}
                      </span>
                    </>
                  ) : (
                    <span className="text-slate-400 text-[7px]" style={pixelFont}>
                      {parseFloat(tx.amount).toFixed(4)} (raw)
                    </span>
                  )}
                </div>
                
                {/* Bottom row: Tx hash link */}
                <div>
                  <a
                    href={`https://sepolia.basescan.org/tx/${tx.hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 text-[6px] hover:text-cyan-300 hover:underline"
                    style={pixelFont}
                  >
                    {truncateHash(tx.hash)} ↗
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between pt-2 border-t border-slate-700">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-2 py-1 bg-slate-800 border border-slate-700 text-green-400 text-[6px] hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              style={pixelFont}
            >
              PREV
            </button>
            <span className="text-slate-400 text-[6px]" style={pixelFont}>
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="px-2 py-1 bg-slate-800 border border-slate-700 text-green-400 text-[6px] hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
              style={pixelFont}
            >
              NEXT
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
