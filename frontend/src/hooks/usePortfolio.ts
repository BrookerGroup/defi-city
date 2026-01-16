'use client'

import { useMemo } from 'react'
import { useMultiTokenBalance, useWalletBalance } from './index'
import { useTokenPrices, type PriceToken } from './useTokenPrices'

export interface AssetBalance {
  symbol: PriceToken
  name: string
  icon: string
  balance: string
  balanceRaw: bigint | undefined
  usdValue: number
  price: number
  percentage: number
  color: string
  available: number // Available (not invested)
  invested: number // Invested in buildings (TODO: implement when buildings are ready)
  earned: number // Total earned (TODO: implement when tracking is ready)
}

export interface PortfolioSummary {
  totalValueUSD: number
  totalAvailable: number
  totalInvested: number
  totalEarned: number
  assets: AssetBalance[]
  isLoading: boolean
}

// Token configuration
const TOKEN_CONFIG: Record<PriceToken, { name: string; icon: string; color: string }> = {
  ETH: { name: 'Ethereum', icon: '◇', color: '#627EEA' },
  USDC: { name: 'USD Coin', icon: '💵', color: '#2775CA' },
  USDT: { name: 'Tether USD', icon: '💲', color: '#26A17B' },
  WBTC: { name: 'Wrapped Bitcoin', icon: '₿', color: '#F7931A' },
  WETH: { name: 'Wrapped ETH', icon: '◆', color: '#EC6E6E' },
}

export function usePortfolio(smartWalletAddress: `0x${string}` | undefined) {
  // Get native ETH balance
  const { balance: ethBalanceRaw, formatted: ethBalance, isLoading: ethLoading } = useWalletBalance(smartWalletAddress)

  // Get ERC-20 token balances
  const tokenBalances = useMultiTokenBalance(smartWalletAddress)

  // Get token prices
  const { prices, calculateUSDValue, isLoading: pricesLoading } = useTokenPrices()

  const portfolio = useMemo<PortfolioSummary>(() => {
    const assets: AssetBalance[] = []

    // ETH
    const ethUsdValue = calculateUSDValue('ETH', ethBalance)
    assets.push({
      symbol: 'ETH',
      ...TOKEN_CONFIG.ETH,
      balance: ethBalance,
      balanceRaw: ethBalanceRaw,
      usdValue: ethUsdValue,
      price: prices.ETH,
      percentage: 0, // Will be calculated after
      available: ethUsdValue,
      invested: 0,
      earned: 0,
    })

    // USDC
    const usdcUsdValue = calculateUSDValue('USDC', tokenBalances.USDC.formatted)
    assets.push({
      symbol: 'USDC',
      ...TOKEN_CONFIG.USDC,
      balance: tokenBalances.USDC.formatted,
      balanceRaw: tokenBalances.USDC.balance,
      usdValue: usdcUsdValue,
      price: prices.USDC,
      percentage: 0,
      available: usdcUsdValue,
      invested: 0,
      earned: 0,
    })

    // USDT
    const usdtUsdValue = calculateUSDValue('USDT', tokenBalances.USDT.formatted)
    assets.push({
      symbol: 'USDT',
      ...TOKEN_CONFIG.USDT,
      balance: tokenBalances.USDT.formatted,
      balanceRaw: tokenBalances.USDT.balance,
      usdValue: usdtUsdValue,
      price: prices.USDT,
      percentage: 0,
      available: usdtUsdValue,
      invested: 0,
      earned: 0,
    })

    // WBTC
    const wbtcUsdValue = calculateUSDValue('WBTC', tokenBalances.WBTC.formatted)
    assets.push({
      symbol: 'WBTC',
      ...TOKEN_CONFIG.WBTC,
      balance: tokenBalances.WBTC.formatted,
      balanceRaw: tokenBalances.WBTC.balance,
      usdValue: wbtcUsdValue,
      price: prices.WBTC,
      percentage: 0,
      available: wbtcUsdValue,
      invested: 0,
      earned: 0,
    })

    // WETH
    const wethUsdValue = calculateUSDValue('WETH', tokenBalances.WETH.formatted)
    assets.push({
      symbol: 'WETH',
      ...TOKEN_CONFIG.WETH,
      balance: tokenBalances.WETH.formatted,
      balanceRaw: tokenBalances.WETH.balance,
      usdValue: wethUsdValue,
      price: prices.WETH,
      percentage: 0,
      available: wethUsdValue,
      invested: 0,
      earned: 0,
    })

    // Calculate total and percentages
    const totalValueUSD = assets.reduce((sum, asset) => sum + asset.usdValue, 0)
    const totalAvailable = assets.reduce((sum, asset) => sum + asset.available, 0)
    const totalInvested = assets.reduce((sum, asset) => sum + asset.invested, 0)
    const totalEarned = assets.reduce((sum, asset) => sum + asset.earned, 0)

    // Update percentages
    assets.forEach(asset => {
      asset.percentage = totalValueUSD > 0 ? (asset.usdValue / totalValueUSD) * 100 : 0
    })

    return {
      totalValueUSD,
      totalAvailable,
      totalInvested,
      totalEarned,
      assets,
      isLoading: ethLoading || tokenBalances.isLoading || pricesLoading,
    }
  }, [ethBalance, ethBalanceRaw, tokenBalances, prices, calculateUSDValue, ethLoading, pricesLoading])

  return portfolio
}
