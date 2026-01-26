/**
 * Aave Market Data Constants
 */

// Mock asset prices (USD)
export const ASSET_PRICES: Record<string, number> = {
  USDC: 1,
  USDT: 1,
  ETH: 2000,
  WBTC: 40000,
}

// Mock Aave market data
export const AAVE_MARKET_DATA: any = {
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
    WBTC: {
      symbol: 'WBTC',
      name: 'Wrapped Bitcoin',
      decimals: 8,
      icon: 'B',
      color: '#F7931A',
      supplyAPY: 0.5,
      borrowAPY: 2.2,
      ltv: 0.7,
      liquidationThreshold: 0.75,
    },
  },
  lastUpdated: Date.now(),
}
