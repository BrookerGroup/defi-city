'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useSmartWallet } from '@/hooks'
import { useTransactionHistory, type Transaction } from '@/hooks/useTransactionHistory'
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
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const TX_TYPE_CONFIG: Record<Transaction['type'], { icon: React.ReactNode; label: string; color: string }> = {
  deposit: { icon: <ArrowDownToLine className="h-4 w-4" />, label: 'Deposit', color: 'text-green-500' },
  withdraw: { icon: <ArrowUpFromLine className="h-4 w-4" />, label: 'Withdraw', color: 'text-orange-500' },
  place: { icon: <Building2 className="h-4 w-4" />, label: 'Build', color: 'text-blue-500' },
  harvest: { icon: <Coins className="h-4 w-4" />, label: 'Harvest', color: 'text-emerald-500' },
  demolish: { icon: <Trash2 className="h-4 w-4" />, label: 'Demolish', color: 'text-red-500' },
  unknown: { icon: <History className="h-4 w-4" />, label: 'Transaction', color: 'text-muted-foreground' },
}

function TransactionRow({ tx }: { tx: Transaction }) {
  const config = TX_TYPE_CONFIG[tx.type]
  const shortHash = `${tx.hash.slice(0, 6)}...${tx.hash.slice(-4)}`

  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full bg-muted ${config.color}`}>
          {config.icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{config.label}</span>
            {tx.asset && (
              <Badge variant="outline" className="text-xs">
                {tx.asset}
              </Badge>
            )}
          </div>
          <div className="text-xs text-muted-foreground">
            {formatDistanceToNow(tx.timestamp, { addSuffix: true })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {tx.amount && (
          <span className="font-mono text-sm">
            {tx.type === 'withdraw' ? '-' : '+'}{tx.amount}
          </span>
        )}

        {tx.status === 'pending' && (
          <Loader2 className="h-4 w-4 animate-spin text-amber-500" />
        )}
        {tx.status === 'success' && (
          <Badge variant="outline" className="text-green-500 border-green-500/30">
            Success
          </Badge>
        )}
        {tx.status === 'failed' && (
          <Badge variant="outline" className="text-red-500 border-red-500/30">
            Failed
          </Badge>
        )}

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
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

  const { transactions, clearHistory } = useTransactionHistory(walletAddress ?? undefined)

  return (
    <Card>
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <History className="h-4 w-4" />
          Transaction History
        </CardTitle>
        {transactions.length > 0 && (
          <Button variant="ghost" size="sm" onClick={clearHistory}>
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No transactions yet</p>
            <p className="text-xs mt-1">Your transaction history will appear here</p>
          </div>
        ) : (
          <div className="divide-y">
            {transactions.slice(0, 10).map((tx) => (
              <TransactionRow key={tx.hash} tx={tx} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
