/**
 * Aave Market Data Constants
 * Note: Most data is now fetched on-chain via useAaveReserveData hook
 * These values are used as fallbacks when RPC calls fail
 */

// Fallback asset prices (USD) - used when oracle is unavailable
export const ASSET_PRICES: Record<string, number> = {
  USDC: 1,
  USDT: 1,
  ETH: 3000,
  WBTC: 90000,
  LINK: 15,
  cbETH: 3100,
}

interface AssetMarketData {
  symbol: string
  name: string
  decimals: number
  icon: string
  color: string
  supplyAPY: number
  borrowAPY: number
  ltv: number
  liquidationThreshold: number
}

interface AaveMarketData {
  assets: Record<string, AssetMarketData>
  lastUpdated: number
}

// Mock Aave market data
export const AAVE_MARKET_DATA: AaveMarketData = {
  assets: {
    USDC: {
      symbol: 'USDC',
      name: 'USD Coin',
      decimals: 6,
      icon: '$',
      color: '#2775CA',
      supplyAPY: 3.2,
      borrowAPY: 5.2,
      ltv: 0.8,
      liquidationThreshold: 0.85,
    },
    USDT: {
      symbol: 'USDT',
      name: 'Tether USD',
      decimals: 6,
      icon: '$',
      color: '#26A17B',
      supplyAPY: 2.8,
      borrowAPY: 4.8,
      ltv: 0.75,
      liquidationThreshold: 0.8,
    },
    ETH: {
      symbol: 'ETH',
      name: 'Ethereum',
      decimals: 18,
      icon: 'E',
      color: '#627EEA',
      supplyAPY: 1.9,
      borrowAPY: 3.1,
      ltv: 0.8,
      liquidationThreshold: 0.825,
    },
  },
  lastUpdated: Date.now(),
}
