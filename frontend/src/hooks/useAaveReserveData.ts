/**
 * useAaveReserveData Hook
 * Fetches complete Aave V3 reserve data including:
 * - Supply/Borrow APY
 * - Total Supplied/Borrowed
 * - Supply/Borrow Caps
 * - LTV, Liquidation Threshold, Liquidation Penalty
 * - Oracle Prices
 * - Utilization Rate
 * - Pool Status (full/available)
 */

import { useState, useCallback, useEffect } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'

export interface ReserveData {
  symbol: string
  address: string
  decimals: number
  // Supply Info
  totalSupplied: number
  totalSuppliedUSD: number
  supplyCap: number
  supplyCapUSD: number
  supplyAPY: number
  // Borrow Info
  totalBorrowed: number
  totalBorrowedUSD: number
  borrowCap: number
  borrowCapUSD: number
  borrowAPY: number
  // Risk Parameters (in percentage, e.g., 83.50)
  ltv: number
  liquidationThreshold: number
  liquidationPenalty: number
  // Oracle
  oraclePrice: number // USD price
  // Calculated
  utilizationRate: number // percentage, e.g., 8.36
  supplyUsagePercent: number // percentage of supply cap used
  isPoolFull: boolean
  availableLiquidity: number
  availableLiquidityUSD: number
  // Status
  isActive: boolean
  isFrozen: boolean
  canBeCollateral: boolean
  borrowingEnabled: boolean
}

const RAY = 10n ** 27n
const RAY_NUMBER = 1e27
const SECONDS_PER_YEAR = 31536000
const PERCENT_FACTOR = 10000 // Aave uses basis points (100% = 10000)

/**
 * Calculate APY from ray rate using compound interest formula
 * This matches how Aave displays APY in their UI
 * Formula: APY = ((1 + rate/RAY/SECONDS_PER_YEAR)^SECONDS_PER_YEAR - 1) * 100
 */
function calculateAPY(rayRate: bigint): number {
  const ratePerSecond = Number(rayRate) / RAY_NUMBER / SECONDS_PER_YEAR
  const apy = (Math.pow(1 + ratePerSecond, SECONDS_PER_YEAR) - 1) * 100
  return apy
}

// Asset metadata
const ASSET_METADATA: Record<string, { name: string; icon: string; color: string }> = {
  USDC: { name: 'USD Coin', icon: '$', color: '#2775CA' },
  USDT: { name: 'Tether USD', icon: '$', color: '#26A17B' },
  ETH: { name: 'Ethereum', icon: 'Ξ', color: '#627EEA' },
  WETH: { name: 'Wrapped ETH', icon: 'Ξ', color: '#627EEA' },
  WBTC: { name: 'Wrapped BTC', icon: '₿', color: '#F7931A' },
  LINK: { name: 'Chainlink', icon: '⬡', color: '#2A5ADA' },
  cbETH: { name: 'Coinbase ETH', icon: 'Ξ', color: '#0052FF' },
}

export function useAaveReserveData() {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [reserveData, setReserveData] = useState<Record<string, ReserveData>>({})
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<number>(0)

  const fetchReserveData = useCallback(async () => {
    if (!wallets || wallets.length === 0) return

    setLoading(true)
    setError(null)

    try {
      const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
      const ethereumProvider = await wallet.getEthereumProvider()
      const provider = new ethers.BrowserProvider(ethereumProvider)

      const network = 'baseSepolia'
      const addresses = CONTRACTS[network]

      // Initialize contracts
      const dataProvider = new ethers.Contract(
        addresses.AAVE_DATA_PROVIDER,
        ABIS.AAVE_DATA_PROVIDER,
        provider
      )

      const addressesProvider = new ethers.Contract(
        addresses.AAVE_POOL_ADDRESSES_PROVIDER,
        ABIS.AAVE_POOL_ADDRESSES_PROVIDER,
        provider
      )

      // Get Oracle address from PoolAddressesProvider
      const oracleAddress = await addressesProvider.getPriceOracle()
      const oracle = new ethers.Contract(oracleAddress, ABIS.AAVE_ORACLE, provider)

      // Get base currency unit (usually 1e8 for USD)
      let baseCurrencyUnit = 1e8
      try {
        baseCurrencyUnit = Number(await oracle.BASE_CURRENCY_UNIT())
      } catch {
        // Some oracles may not have this, default to 1e8
      }

      // Assets to fetch (add more as needed)
      const assets = [
        { symbol: 'USDC', address: addresses.USDC },
        { symbol: 'USDT', address: addresses.USDT },
        { symbol: 'ETH', address: addresses.ETH },
        { symbol: 'WBTC', address: addresses.WBTC },
        { symbol: 'LINK', address: addresses.LINK },
      ].filter((a) => a.address && a.address !== ethers.ZeroAddress)

      const newReserveData: Record<string, ReserveData> = {}

      for (const asset of assets) {
        try {
          // 1. Get reserve data (APY, total supplied/borrowed)
          const reserveInfo = await dataProvider.getReserveData(asset.address)

          // 2. Get reserve configuration (LTV, liquidation params)
          const configData = await dataProvider.getReserveConfigurationData(asset.address)

          // 3. Get reserve caps
          const caps = await dataProvider.getReserveCaps(asset.address)

          // 4. Get oracle price
          let oraclePrice = 0
          try {
            const priceRaw = await oracle.getAssetPrice(asset.address)
            oraclePrice = Number(priceRaw) / baseCurrencyUnit
          } catch (e) {
            console.warn(`Failed to get oracle price for ${asset.symbol}:`, e)
          }

          // Parse decimals
          const decimals = Number(configData.decimals)

          // Calculate APY using compound interest formula (matches Aave UI)
          const supplyAPY = calculateAPY(reserveInfo.liquidityRate)
          const borrowAPY = calculateAPY(reserveInfo.variableBorrowRate)

          // Parse total supplied/borrowed
          const totalSupplied = Number(ethers.formatUnits(reserveInfo.totalAToken, decimals))
          const totalStableDebt = Number(ethers.formatUnits(reserveInfo.totalStableDebt, decimals))
          const totalVariableDebt = Number(ethers.formatUnits(reserveInfo.totalVariableDebt, decimals))
          const totalBorrowed = totalStableDebt + totalVariableDebt

          // Parse caps (caps are in whole units, not decimals)
          const supplyCap = Number(caps.supplyCap)
          const borrowCap = Number(caps.borrowCap)

          // Parse LTV and liquidation params (basis points -> percentage)
          const ltv = Number(configData.ltv) / 100 // e.g., 8350 -> 83.50
          const liquidationThreshold = Number(configData.liquidationThreshold) / 100
          // Liquidation bonus is stored as 10000 + bonus, e.g., 10500 = 5% bonus
          const liquidationBonus = Number(configData.liquidationBonus)
          const liquidationPenalty = liquidationBonus > PERCENT_FACTOR 
            ? (liquidationBonus - PERCENT_FACTOR) / 100 
            : 0

          // Calculate utilization rate (capped at 100%)
          // Utilization = totalBorrowed / totalSupplied
          const utilizationRate = totalSupplied > 0 
            ? Math.min((totalBorrowed / totalSupplied) * 100, 100)
            : 0

          // Calculate supply usage percentage
          const supplyUsagePercent = supplyCap > 0 
            ? (totalSupplied / supplyCap) * 100 
            : 0

          // Check if pool is full (within 0.1% of cap)
          const isPoolFull = supplyCap > 0 && totalSupplied >= supplyCap * 0.999

          // Available liquidity
          const availableLiquidity = totalSupplied - totalBorrowed

          // Calculate USD values
          const totalSuppliedUSD = totalSupplied * oraclePrice
          const totalBorrowedUSD = totalBorrowed * oraclePrice
          const supplyCapUSD = supplyCap * oraclePrice
          const borrowCapUSD = borrowCap * oraclePrice
          const availableLiquidityUSD = availableLiquidity * oraclePrice

          newReserveData[asset.symbol] = {
            symbol: asset.symbol,
            address: asset.address,
            decimals,
            // Supply Info
            totalSupplied,
            totalSuppliedUSD,
            supplyCap,
            supplyCapUSD,
            supplyAPY: parseFloat(supplyAPY.toFixed(2)),
            // Borrow Info
            totalBorrowed,
            totalBorrowedUSD,
            borrowCap,
            borrowCapUSD,
            borrowAPY: parseFloat(borrowAPY.toFixed(2)),
            // Risk Parameters
            ltv: parseFloat(ltv.toFixed(2)),
            liquidationThreshold: parseFloat(liquidationThreshold.toFixed(2)),
            liquidationPenalty: parseFloat(liquidationPenalty.toFixed(2)),
            // Oracle
            oraclePrice: parseFloat(oraclePrice.toFixed(2)),
            // Calculated
            utilizationRate: parseFloat(utilizationRate.toFixed(2)),
            supplyUsagePercent: parseFloat(supplyUsagePercent.toFixed(2)),
            isPoolFull,
            availableLiquidity,
            availableLiquidityUSD,
            // Status
            isActive: configData.isActive,
            isFrozen: configData.isFrozen,
            canBeCollateral: configData.usageAsCollateralEnabled,
            borrowingEnabled: configData.borrowingEnabled,
          }
        } catch (assetError) {
          console.error(`Error fetching reserve data for ${asset.symbol}:`, assetError)
        }
      }

      setReserveData(newReserveData)
      setLastUpdated(Date.now())
    } catch (err: any) {
      console.error('Error fetching Aave reserve data:', err)
      setError(err.message || 'Failed to fetch reserve data')
    } finally {
      setLoading(false)
    }
  }, [wallets])

  // Fetch on mount and when wallets change
  useEffect(() => {
    fetchReserveData()
  }, [fetchReserveData])

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      fetchReserveData()
    }, 30000)

    return () => clearInterval(interval)
  }, [fetchReserveData])

  // Helper to get oracle price for an asset
  const getOraclePrice = useCallback((symbol: string): number => {
    return reserveData[symbol]?.oraclePrice || 0
  }, [reserveData])

  // Helper to check if pool is full
  const isPoolFull = useCallback((symbol: string): boolean => {
    return reserveData[symbol]?.isPoolFull || false
  }, [reserveData])

  return {
    reserveData,
    loading,
    error,
    lastUpdated,
    refresh: fetchReserveData,
    getOraclePrice,
    isPoolFull,
  }
}

// Export asset metadata for UI
export { ASSET_METADATA }
