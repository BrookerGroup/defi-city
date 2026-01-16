'use client'

import { useQuery } from '@tanstack/react-query'

export type PriceToken = 'ETH' | 'USDC' | 'USDT' | 'WBTC' | 'WETH'

interface TokenPrices {
  ETH: number
  USDC: number
  USDT: number
  WBTC: number
  WETH: number
}

// CoinGecko API IDs mapping
const COINGECKO_IDS: Record<PriceToken, string> = {
  ETH: 'ethereum',
  USDC: 'usd-coin',
  USDT: 'tether',
  WBTC: 'wrapped-bitcoin',
  WETH: 'weth',
}

// Fallback prices (used when API fails or for development)
const FALLBACK_PRICES: TokenPrices = {
  ETH: 3500,
  USDC: 1,
  USDT: 1,
  WBTC: 95000,
  WETH: 3500,
}

async function fetchPrices(): Promise<TokenPrices> {
  try {
    const ids = Object.values(COINGECKO_IDS).join(',')
    const response = await fetch(
      `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd`,
      {
        headers: {
          'Accept': 'application/json',
        },
        next: { revalidate: 60 }, // Cache for 60 seconds
      }
    )

    if (!response.ok) {
      throw new Error('Failed to fetch prices')
    }

    const data = await response.json()

    return {
      ETH: data[COINGECKO_IDS.ETH]?.usd ?? FALLBACK_PRICES.ETH,
      USDC: data[COINGECKO_IDS.USDC]?.usd ?? FALLBACK_PRICES.USDC,
      USDT: data[COINGECKO_IDS.USDT]?.usd ?? FALLBACK_PRICES.USDT,
      WBTC: data[COINGECKO_IDS.WBTC]?.usd ?? FALLBACK_PRICES.WBTC,
      WETH: data[COINGECKO_IDS.WETH]?.usd ?? FALLBACK_PRICES.WETH,
    }
  } catch (error) {
    console.warn('Failed to fetch prices, using fallback:', error)
    return FALLBACK_PRICES
  }
}

export function useTokenPrices() {
  const { data: prices, isLoading, error, refetch } = useQuery({
    queryKey: ['tokenPrices'],
    queryFn: fetchPrices,
    staleTime: 60 * 1000, // 1 minute
    refetchInterval: 60 * 1000, // Refetch every minute
    refetchOnWindowFocus: false,
  })

  const getPrice = (token: PriceToken): number => {
    return prices?.[token] ?? FALLBACK_PRICES[token]
  }

  const formatUSD = (value: number): string => {
    return value.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  }

  const calculateUSDValue = (token: PriceToken, amount: string | number): number => {
    const price = getPrice(token)
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount
    if (isNaN(numAmount)) return 0
    return price * numAmount
  }

  return {
    prices: prices ?? FALLBACK_PRICES,
    isLoading,
    error,
    refetch,
    getPrice,
    formatUSD,
    calculateUSDValue,
  }
}
