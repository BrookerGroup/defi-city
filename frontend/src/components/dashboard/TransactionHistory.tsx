'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useSmartWallet } from '@/hooks'
import { useTransactionHistory, type Transaction, type TransactionType } from '@/hooks/useTransactionHistory'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Building2,
  Coins,
  Trash2,
  ExternalLink,
  Loader2,
  History,
  ChevronLeft,
  ChevronRight,
  Filter,
  X,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const TX_TYPE_CONFIG: Record<TransactionType, { icon: React.ReactNode; label: string; color: string }> = {
  deposit: { icon: <ArrowDownToLine className="h-4 w-4" />, label: 'Deposit', color: 'text-green-500' },
  withdraw: { icon: <ArrowUpFromLine className="h-4 w-4" />, label: 'Withdraw', color: 'text-orange-500' },
  place: { icon: <Building2 className="h-4 w-4" />, label: 'Build', color: 'text-blue-500' },
  harvest: { icon: <Coins className="h-4 w-4" />, label: 'Harvest', color: 'text-emerald-500' },
  demolish: { icon: <Trash2 className="h-4 w-4" />, label: 'Demolish', color: 'text-red-500' },
  unknown: { icon: <History className="h-4 w-4" />, label: 'Transaction', color: 'text-muted-foreground' },
}

const TX_TYPES: { value: TransactionType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'deposit', label: 'Deposits' },
  { value: 'withdraw', label: 'Withdrawals' },
  { value: 'place', label: 'Building' },
  { value: 'harvest', label: 'Harvests' },
  { value: 'demolish', label: 'Demolitions' },
]

const ASSET_OPTIONS = ['ETH', 'USDC', 'USDT', 'WBTC', 'WETH']

function TransactionRow({ tx }: { tx: Transaction }) {
  const config = TX_TYPE_CONFIG[tx.type]
  const shortHash = `${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`

  return (
    <div className="flex items-center justify-between py-3 border-b border-slate-700/50 last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full bg-slate-800 ${config.color}`}>
          {config.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm text-slate-200">{config.label}</span>
            {tx.asset && (
              <Badge variant="outline" className="text-xs bg-slate-800/50 border-slate-600">
                {tx.asset}
              </Badge>
            )}
          </div>
          <div className="text-xs text-slate-500">
            {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {tx.amount && (
          <span className={`font-mono text-sm ${tx.type === 'withdraw' ? 'text-orange-400' : 'text-green-400'}`}>
            {tx.type === 'withdraw' ? '-' : '+'}{tx.amount}
          </span>
        )}

        {tx.status === 'pending' && (
          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
        )}
        {tx.status === 'success' && (
          <Badge variant="outline" className="text-green-400 border-green-500/30 bg-green-500/10 text-xs">
            ✓
          </Badge>
        )}
        {tx.status === 'failed' && (
          <Badge variant="outline" className="text-red-400 border-red-500/30 bg-red-500/10 text-xs">
            ✗
          </Badge>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-slate-400 hover:text-white hover:bg-slate-700"
          onClick={() => window.open(`https://sepolia.basescan.org/tx/${tx.hash}`, '_blank')}
        >
          <ExternalLink className="h-3 w-3" />
        </Button>
      </div>
    </div>
  )
}

export function TransactionHistory() {
  const { user } = usePrivy()
  const eoaAddress = user?.wallet?.address as `0x${string}` | undefined
  const { walletAddress } = useSmartWallet(eoaAddress)

  const {
    filteredTransactions,
    transactions,
    filter,
    updateFilter,
    resetFilter,
    availableAssets,
    pagination,
    nextPage,
    prevPage,
    clearHistory,
  } = useTransactionHistory(walletAddress ?? undefined)

  const hasActiveFilters = filter.type !== 'all' || filter.asset !== 'all'

  return (
    <Card className="bg-slate-900/50 border-slate-700">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2 text-slate-200">
            <History className="h-4 w-4 text-amber-400" />
            Transaction History
          </CardTitle>
          {transactions.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearHistory}
              className="text-slate-400 hover:text-white text-xs h-7"
            >
              Clear
            </Button>
          )}
        </div>

        {/* Filters */}
        {transactions.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {/* Type Filter */}
            <select
              value={filter.type}
              onChange={(e) => updateFilter({ type: e.target.value as TransactionType | 'all' })}
              className="text-xs bg-slate-800 border border-slate-600 rounded-md px-2 py-1 text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              {TX_TYPES.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {/* Asset Filter */}
            <select
              value={filter.asset}
              onChange={(e) => updateFilter({ asset: e.target.value })}
              className="text-xs bg-slate-800 border border-slate-600 rounded-md px-2 py-1 text-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
            >
              <option value="all">All Assets</option>
              {(availableAssets.length > 0 ? availableAssets : ASSET_OPTIONS).map((asset) => (
                <option key={asset} value={asset}>{asset}</option>
              ))}
            </select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilter}
                className="h-7 px-2 text-xs text-slate-400 hover:text-white"
              >
                <X className="h-3 w-3 mr-1" />
                Clear
              </Button>
            )}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs mt-1">Your transaction history will appear here</p>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Filter className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No matching transactions</p>
            <Button
              variant="link"
              size="sm"
              onClick={resetFilter}
              className="text-amber-400 hover:text-amber-300 text-xs mt-2"
            >
              Clear filters
            </Button>
          </div>
        ) : (
          <>
            {/* Transaction List */}
            <div className="divide-y divide-slate-700/50">
              {filteredTransactions.map((tx) => (
                <TransactionRow key={tx.hash} tx={tx} />
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 mt-2 border-t border-slate-700/50">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={prevPage}
                  disabled={pagination.page === 1}
                  className="h-7 px-2 text-slate-400 hover:text-white disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                <span className="text-xs text-slate-500">
                  Page {pagination.page} of {pagination.totalPages}
                  <span className="text-slate-600 ml-2">
                    ({pagination.totalItems} total)
                  </span>
                </span>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextPage}
                  disabled={pagination.page === pagination.totalPages}
                  className="h-7 px-2 text-slate-400 hover:text-white disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}
