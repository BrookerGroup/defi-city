/**
 * useAaveMarketData Hook
 * Fetches real-time Aave market data (APYs)
 */

import { useState, useCallback, useEffect } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'

export interface AssetMarketData {
  symbol: string
  supplyAPY: number
  borrowAPY: number
}

const RAY = 10n ** 27n
const SECONDS_PER_YEAR = 31536000n

export function useAaveMarketData() {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [marketData, setMarketData] = useState<Record<string, AssetMarketData>>({})
  const [error, setError] = useState<string | null>(null)

  const fetchMarketData = useCallback(async () => {
    if (!wallets || wallets.length === 0) return

    setLoading(true)
    try {
      const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
      const ethereumProvider = await wallet.getEthereumProvider()
      const provider = new ethers.BrowserProvider(ethereumProvider)
      
      const network = 'baseSepolia'
      const addresses = CONTRACTS[network]
      const dataProvider = new ethers.Contract(addresses.AAVE_DATA_PROVIDER, ABIS.AAVE_DATA_PROVIDER, provider)
      
      const assets = [
        { symbol: 'USDC', address: addresses.USDC },
        { symbol: 'USDT', address: addresses.USDT },
        { symbol: 'ETH', address: addresses.ETH },
      ]
      
      const newMarketData: Record<string, AssetMarketData> = {}
      
      for (const asset of assets) {
        if (!asset.address || asset.address === ethers.ZeroAddress) continue
        
        const reserveData = await dataProvider.getReserveData(asset.address)
        
        // Calculate APY using compound interest formula (matches Aave UI)
        // APY = ((1 + rate/RAY/SECONDS_PER_YEAR)^SECONDS_PER_YEAR - 1) * 100
        const RAY_NUMBER = 1e27
        const ratePerSecondSupply = Number(reserveData.liquidityRate) / RAY_NUMBER / Number(SECONDS_PER_YEAR)
        const ratePerSecondBorrow = Number(reserveData.variableBorrowRate) / RAY_NUMBER / Number(SECONDS_PER_YEAR)
        
        const supplyAPY = (Math.pow(1 + ratePerSecondSupply, Number(SECONDS_PER_YEAR)) - 1) * 100
        const borrowAPY = (Math.pow(1 + ratePerSecondBorrow, Number(SECONDS_PER_YEAR)) - 1) * 100
        
        newMarketData[asset.symbol] = {
          symbol: asset.symbol,
          supplyAPY: parseFloat(supplyAPY.toFixed(2)),
          borrowAPY: parseFloat(borrowAPY.toFixed(2)),
        }
      }
      
      setMarketData(newMarketData)
      setError(null)
    } catch (err: any) {
      console.error('Error fetching Aave market data:', err)
      setError(err.message || 'Failed to fetch market data')
    } finally {
      setLoading(false)
    }
  }, [wallets])

  useEffect(() => {
    fetchMarketData()
  }, [fetchMarketData])

  return {
    marketData,
    loading,
    error,
    refresh: fetchMarketData
  }
}
