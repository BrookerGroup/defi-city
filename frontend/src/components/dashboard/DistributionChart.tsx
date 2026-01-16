'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { AssetBalance } from '@/hooks/usePortfolio'

interface DistributionChartProps {
  assets: AssetBalance[]
  formatUSD: (value: number) => string
}

export function DistributionChart({ assets, formatUSD }: DistributionChartProps) {
  // Filter assets with non-zero balance
  const activeAssets = assets.filter(a => a.usdValue > 0)

  if (activeAssets.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Asset Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <p>No assets yet</p>
            <p className="text-sm mt-1">Deposit funds to see distribution</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate total for percentage
  const total = activeAssets.reduce((sum, a) => sum + a.usdValue, 0)

  // Create pie chart segments
  let cumulativePercent = 0
  const segments = activeAssets.map(asset => {
    const percent = (asset.usdValue / total) * 100
    const startPercent = cumulativePercent
    cumulativePercent += percent
    return {
      ...asset,
      percent,
      startPercent,
    }
  })

  // Generate conic gradient for pie chart
  const conicGradient = segments
    .map(
      (seg, i) =>
        `${seg.color} ${seg.startPercent}% ${seg.startPercent + seg.percent}%`
    )
    .join(', ')

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Asset Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row items-center gap-6">
          {/* Pie Chart */}
          <div className="relative">
            <div
              className="w-32 h-32 rounded-full"
              style={{
                background: `conic-gradient(${conicGradient})`,
              }}
            />
            {/* Center hole for donut effect */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-20 h-20 rounded-full bg-background flex items-center justify-center">
                <span className="text-xs text-muted-foreground text-center">
                  {activeAssets.length} assets
                </span>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex-1 space-y-2">
            {segments.map(asset => (
              <div key={asset.symbol} className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: asset.color }}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium text-sm truncate">{asset.symbol}</span>
                    <span className="text-sm font-mono">{asset.percent.toFixed(1)}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {formatUSD(asset.usdValue)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Horizontal bar chart */}
        <div className="mt-6 space-y-2">
          {segments.map(asset => (
            <div key={asset.symbol} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="flex items-center gap-1">
                  <span>{asset.icon}</span>
                  <span>{asset.symbol}</span>
                </span>
                <span className="font-mono">{formatUSD(asset.usdValue)}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${asset.percent}%`,
                    backgroundColor: asset.color,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
