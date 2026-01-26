/**
 * useAavePosition Hook
 * Fetches real-time Aave positions (supply, borrow, health factor)
 */

import { useState, useCallback, useEffect } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'
import { ASSET_PRICES, AAVE_MARKET_DATA } from '@/config/aave'

// Asset addresses mapping
const ASSET_ADDRESSES: Record<string, string> = {
  USDC: CONTRACTS.baseSepolia.USDC,
  USDT: CONTRACTS.baseSepolia.USDT,
  ETH: CONTRACTS.baseSepolia.WETH,
  WBTC: '0x0000000000000000000000000000000000000000',
}

const ASSET_DECIMALS: Record<string, number> = {
  USDC: 6,
  USDT: 6,
  ETH: 18,
  WBTC: 8,
}

export function useAavePosition(smartWalletAddress: string | null) {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState<any | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchPosition = useCallback(async () => {
    if (!smartWalletAddress || !wallets || wallets.length === 0) return

    setLoading(true)
    try {
      const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
      const ethereumProvider = await wallet.getEthereumProvider()
      const provider = new ethers.BrowserProvider(ethereumProvider)
      
      const network = 'baseSepolia'
      const addresses = CONTRACTS[network]
      
      const pool = new ethers.Contract(addresses.AAVE_POOL, ABIS.AAVE_POOL, provider)
      const dataProvider = new ethers.Contract(addresses.AAVE_DATA_PROVIDER, ABIS.AAVE_DATA_PROVIDER, provider)
      
      // 1. Get global account data
      const accountData = await pool.getUserAccountData(smartWalletAddress)
      
      // Aave V3 Base currency is typically USD with 8 decimals (for totalCollateralBase, totalDebtBase)
      const totalSuppliedUSD = Number(ethers.formatUnits(accountData.totalCollateralBase, 8))
      const totalBorrowedUSD = Number(ethers.formatUnits(accountData.totalDebtBase, 8))
      const healthFactor = accountData.healthFactor === ethers.MaxUint256 
        ? Infinity 
        : Number(ethers.formatUnits(accountData.healthFactor, 18))
      
      // 2. Get specific asset data (USDC and ETH for now)
      const supplies: any[] = []
      const borrows: any[] = []
      
      const assets: string[] = ['USDC']
      
      for (const asset of assets) {
        const assetAddress = ASSET_ADDRESSES[asset]
        if (assetAddress === ethers.ZeroAddress) continue
        
        const userData = await dataProvider.getUserReserveData(assetAddress, smartWalletAddress)
        
        const supplyAmount = userData.currentATokenBalance
        const borrowAmount = userData.currentStableDebt + userData.currentVariableDebt
        
        if (supplyAmount > 0n) {
          const amount = Number(ethers.formatUnits(supplyAmount, ASSET_DECIMALS[asset]))
          supplies.push({
            asset,
            amount,
            amountUSD: amount * ASSET_PRICES[asset],
            apy: AAVE_MARKET_DATA.assets[asset].supplyAPY // Ideally fetch this too
          })
        }
        
        if (borrowAmount > 0n) {
          const amount = Number(ethers.formatUnits(borrowAmount, ASSET_DECIMALS[asset]))
          borrows.push({
            asset,
            amount,
            amountUSD: amount * ASSET_PRICES[asset],
            apy: AAVE_MARKET_DATA.assets[asset].borrowAPY
          })
        }
      }
      
      setPosition({
        supplies,
        borrows,
        totalSuppliedUSD,
        totalBorrowedUSD,
        netWorthUSD: totalSuppliedUSD - totalBorrowedUSD,
        healthFactor,
        netAPY: 0, // Simplified
      })
      
      setError(null)
    } catch (err: any) {
      console.error('Error fetching Aave position:', err)
      setError(err.message || 'Failed to fetch Aave position')
    } finally {
      setLoading(false)
    }
  }, [smartWalletAddress, wallets])

  useEffect(() => {
    fetchPosition()
  }, [fetchPosition])

  return {
    position,
    loading,
    error,
    refresh: fetchPosition
  }
}
