/**
 * useCityBuildings Hook
 * Generates buildings based on Aave Supply positions
 */

import { useState, useCallback, useEffect } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'
import { ASSET_PRICES } from '@/config/aave'
import { GRID_SIZE } from '@/lib/constants'

export interface Building {
  id: number
  owner: string
  smartWallet: string
  type: string
  asset: string
  amount: number
  amountUSD: number
  level: number  // 1-5 based on supply amount
  apy: number    // Supply APY percentage
  placedAt: number
  x: number
  y: number
  active: boolean
}

// Asset addresses and decimals
const ASSET_ADDRESSES: Record<string, string> = {
  USDC: CONTRACTS.baseSepolia.USDC,
  USDT: CONTRACTS.baseSepolia.USDT,
  ETH: CONTRACTS.baseSepolia.ETH,
  WBTC: CONTRACTS.baseSepolia.WBTC,
  LINK: CONTRACTS.baseSepolia.LINK,
}

const ASSET_DECIMALS: Record<string, number> = {
  USDC: 6,
  USDT: 6,
  ETH: 18,
  WBTC: 8,
  LINK: 18,
}

// Calculate building level based on USD value
function calculateLevel(amountUSD: number): number {
  if (amountUSD >= 2000) return 5
  if (amountUSD >= 1000) return 4
  if (amountUSD >= 500) return 3
  if (amountUSD >= 100) return 2
  return 1
}

export function useCityBuildings(userAddress?: string, smartWalletAddress?: string | null) {
  const { wallets } = useWallets()
  const [buildings, setBuildings] = useState<Building[]>([])
  const [allBuildings, setAllBuildings] = useState<Building[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchBuildings = useCallback(async () => {
    if (!smartWalletAddress || !wallets || wallets.length === 0) {
      setBuildings([])
      return
    }

    setLoading(true)
    try {
      const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
      const ethereumProvider = await wallet.getEthereumProvider()
      const provider = new ethers.BrowserProvider(ethereumProvider)
      
      const network = 'baseSepolia'
      const addresses = CONTRACTS[network]
      
      const core = new ethers.Contract(addresses.DEFICITY_CORE, ABIS.DEFICITY_CORE, provider)
      const dataProvider = new ethers.Contract(addresses.AAVE_DATA_PROVIDER, ABIS.AAVE_DATA_PROVIDER, provider)
      
      console.log(`[City] Fetching real buildings for ${userAddress}...`)
      
      // 1. Fetch buildings from DefiCityCore
      const contractBuildings = await core.getUserBuildings(userAddress)
      console.log(`[City] Found ${contractBuildings.length} buildings in contract`)

      // 2. Fetch Aave positions and APY for amount updates
      const aavePositions: Record<string, bigint> = {}
      const aaveAPYs: Record<string, number> = {}
      const RAY_NUMBER = 1e27
      const SECONDS_PER_YEAR = 31536000
      
      for (const [symbol, address] of Object.entries(ASSET_ADDRESSES)) {
        try {
          const data = await dataProvider.getUserReserveData(address, smartWalletAddress)
          aavePositions[symbol] = data.currentATokenBalance
          
          // Fetch reserve data for APY
          const reserveData = await dataProvider.getReserveData(address)
          const ratePerSecond = Number(reserveData.liquidityRate) / RAY_NUMBER / SECONDS_PER_YEAR
          const apy = (Math.pow(1 + ratePerSecond, SECONDS_PER_YEAR) - 1) * 100
          aaveAPYs[symbol] = apy
        } catch (e) {
          aavePositions[symbol] = 0n
          aaveAPYs[symbol] = 0
        }
      }

      // 3. Map contract buildings to our UI structure
      const mappedBuildings = contractBuildings.map((b: any) => {
        // Find asset symbol by address
        const assetSymbol = Object.entries(ASSET_ADDRESSES).find(([_, addr]) => 
          addr.toLowerCase() === b.asset.toLowerCase()
        )?.[0] || 'CORE'

        // Determine if this is an Aave asset building
        const isAaveAsset = assetSymbol !== 'CORE'

        // Use live Aave amount if applicable. 
        // For Aave assets, if liveAmount is 0, we use 0 (don't fall back to b.amount)
        const liveAmountBigInt = aavePositions[assetSymbol]
        let amount: number
        
        if (isAaveAsset) {
          amount = Number(ethers.formatUnits(liveAmountBigInt || 0n, ASSET_DECIMALS[assetSymbol] || 18))
        } else {
          amount = Number(ethers.formatUnits(b.amount, ASSET_DECIMALS[assetSymbol] || 18))
        }

        const amountUSD = amount * (ASSET_PRICES[assetSymbol] || 1)
        
        const centerCoord = Math.ceil(GRID_SIZE / 2)
        const isTownHall = b.buildingType.toLowerCase() === 'townhall'
        const displayX = isTownHall ? centerCoord : Number(b.coordinateX)
        const displayY = isTownHall ? centerCoord : Number(b.coordinateY)

        const needsForceMsg = isTownHall && Number(b.coordinateX) !== centerCoord && Number(b.coordinateX) !== 0
        console.log(`[City] Building ${b.id}: type=${b.buildingType}, active=${b.active}, pos=(${displayX}, ${displayY})${needsForceMsg ? ' (MODIFIED FROM ' + b.coordinateX + ',' + b.coordinateY + ')' : ''}`)

        return {
          id: Number(b.id),
          owner: b.owner,
          smartWallet: b.smartWallet,
          type: b.buildingType,
          asset: assetSymbol,
          amount,
          amountUSD,
          level: calculateLevel(amountUSD),
          apy: aaveAPYs[assetSymbol] || 0,
          placedAt: Number(b.placedAt) * 1000,
          x: displayX,
          y: displayY,
          active: b.active
        }
      })

      // Filter: must be active AND (if it's an Aave building, amount must be > 0)
      let activeBuildings = mappedBuildings.filter((b: any) => {
        if (!b.active) return false
        if (b.asset !== 'CORE' && b.amount <= 0) return false
        return true
      })

      // Deduplication: Only show the LATEST building (highest ID) for each unique Aave asset
      // This prevents "ghost" buildings from legacy data showing up when funds are supplied
      const latestByAsset: Record<string, any> = {}
      
      activeBuildings.forEach((b: any) => {
        if (b.asset === 'CORE') return // Keep CORE (Town Hall)
        if (!latestByAsset[b.asset] || b.id > latestByAsset[b.asset].id) {
          latestByAsset[b.asset] = b
        }
      })

      const deduplicatedBuildings = activeBuildings.filter((b: any) => {
        if (b.asset === 'CORE') return true
        return latestByAsset[b.asset] && b.id === latestByAsset[b.asset].id
      })
      
      console.log(`[City] Total: ${contractBuildings.length}, Visible Active: ${deduplicatedBuildings.length} (Deduplicated ${activeBuildings.length - deduplicatedBuildings.length})`)
      
      setBuildings(deduplicatedBuildings)
      setAllBuildings(mappedBuildings)
      setError(null)
    } catch (err: any) {
      console.error('[City] Error fetching buildings:', err)
      setError(err.message || 'Failed to fetch buildings')
      setBuildings([])
    } finally {
      setLoading(false)
    }
  }, [userAddress, smartWalletAddress, wallets])

  useEffect(() => {
    fetchBuildings()
  }, [fetchBuildings])

  return {
    buildings,
    allBuildings,
    loading,
    error,
    refresh: fetchBuildings
  }
}
