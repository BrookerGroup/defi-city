'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useSmartWallet } from '@/hooks'
import { usePortfolio } from '@/hooks/usePortfolio'
import { useTokenPrices } from '@/hooks/useTokenPrices'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { AssetCard } from './AssetCard'
import { DistributionChart } from './DistributionChart'
import { Loader2, RefreshCw, TrendingUp, Wallet, PiggyBank, Coins } from 'lucide-react'

export function PortfolioDashboard() {
  const { user } = usePrivy()
  const eoaAddress = user?.wallet?.address as `0x${string}` | undefined
  const { walletAddress } = useSmartWallet(eoaAddress)

  const portfolio = usePortfolio(walletAddress ?? undefined)
  const { formatUSD, refetch, isLoading: pricesLoading } = useTokenPrices()

  const handleRefresh = () => {
    refetch()
  }

  if (portfolio.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Portfolio</h2>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={pricesLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${pricesLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Wallet className="h-4 w-4" />
              <span className="text-xs">Total Value</span>
            </div>
            <div className="text-2xl font-bold font-mono">
              {formatUSD(portfolio.totalValueUSD)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Coins className="h-4 w-4" />
              <span className="text-xs">Available</span>
            </div>
            <div className="text-2xl font-bold font-mono text-green-500">
              {formatUSD(portfolio.totalAvailable)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <PiggyBank className="h-4 w-4" />
              <span className="text-xs">Invested</span>
            </div>
            <div className="text-2xl font-bold font-mono text-blue-500">
              {formatUSD(portfolio.totalInvested)}
            </div>
            {portfolio.totalInvested === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Build to invest
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" />
              <span className="text-xs">Total Earned</span>
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-500">
              {portfolio.totalEarned > 0 ? '+' : ''}{formatUSD(portfolio.totalEarned)}
            </div>
            {portfolio.totalEarned === 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Harvest to earn
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Distribution Chart */}
      <DistributionChart assets={portfolio.assets} formatUSD={formatUSD} />

      {/* Asset Cards */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Assets</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {portfolio.assets.map(asset => (
            <AssetCard key={asset.symbol} asset={asset} formatUSD={formatUSD} />
          ))}
        </div>
      </div>

      {/* Empty state hint */}
      {portfolio.totalValueUSD === 0 && (
        <Card className="bg-muted/50">
          <CardContent className="py-8 text-center">
            <div className="text-4xl mb-4">🏦</div>
            <h3 className="font-semibold mb-2">No assets yet</h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto">
              Deposit USDC, USDT, ETH, or WBTC to your Smart Wallet to start building your DeFi city and earn yield.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
