'use client'

import { Card, CardContent } from '@/components/ui/card'
import type { AssetBalance } from '@/hooks/usePortfolio'

interface AssetCardProps {
  asset: AssetBalance
  formatUSD: (value: number) => string
}

export function AssetCard({ asset, formatUSD }: AssetCardProps) {
  const formatBalance = (balance: string, symbol: string): string => {
    const num = parseFloat(balance)
    if (isNaN(num) || num === 0) return '0'

    if (symbol === 'WBTC') {
      return num.toFixed(8)
    }
    if (symbol === 'USDC' || symbol === 'USDT') {
      return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    }
    return num.toFixed(4)
  }

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl"
              style={{ backgroundColor: `${asset.color}20` }}
            >
              {asset.icon}
            </div>
            <div>
              <div className="font-medium">{asset.symbol}</div>
              <div className="text-xs text-muted-foreground">{asset.name}</div>
            </div>
          </div>
          <div className="text-right">
            <div className="font-mono font-medium">{formatUSD(asset.usdValue)}</div>
            <div className="text-xs text-muted-foreground">
              {asset.percentage.toFixed(1)}%
            </div>
          </div>
        </div>

        {/* Balance breakdown */}
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Balance</span>
            <span className="font-mono">
              {formatBalance(asset.balance, asset.symbol)} {asset.symbol}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Price</span>
            <span className="font-mono">{formatUSD(asset.price)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Available</span>
            <span className="font-mono text-green-500">{formatUSD(asset.available)}</span>
          </div>
          {asset.invested > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Invested</span>
              <span className="font-mono text-blue-500">{formatUSD(asset.invested)}</span>
            </div>
          )}
          {asset.earned > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Earned</span>
              <span className="font-mono text-emerald-500">+{formatUSD(asset.earned)}</span>
            </div>
          )}
        </div>

        {/* Distribution bar */}
        {asset.percentage > 0 && (
          <div className="mt-3">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${asset.percentage}%`,
                  backgroundColor: asset.color,
                }}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
