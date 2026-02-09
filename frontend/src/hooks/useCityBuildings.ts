/**
 * useCityBuildings Hook
 * Fetches buildings (supply + borrow) from DefiCityCore contract
 * and updates amounts from live Aave data
 */

import { useState, useCallback, useEffect } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { ADDRESSES, ABIS } from '@/config/contracts'
import { ASSET_PRICES } from '@/config/aave'
import { GRID_SIZE } from '@/lib/constants'

export interface Building {
  id: number
  owner: string
  smartWallet: string
  type: string  // 'townhall' | 'bank' | 'borrow' | 'lp' | 'lottery' | 'megapot-lp'
  asset: string
  amount: number
  amountUSD: number
  level: number  // 1-5 based on supply/borrow amount
  apy: number    // Supply/Borrow APY percentage
  placedAt: number
  x: number
  y: number
  active: boolean
  isBorrow?: boolean  // true if this is a borrow position
  metadata?: string   // raw bytes for LP (token0, token1, fee, ticks)
}

// Asset addresses and decimals
const ASSET_ADDRESSES: Record<string, string> = {
  USDC: ADDRESSES.USDC,
  USDT: ADDRESSES.USDT,
  ETH: ADDRESSES.ETH,
  WBTC: ADDRESSES.WBTC,
  LINK: ADDRESSES.LINK,
  MPUSDC: ADDRESSES.MPUSDC,
}

const ASSET_DECIMALS: Record<string, number> = {
  USDC: 6,
  USDT: 6,
  ETH: 18,
  WBTC: 8,
  LINK: 18,
  MPUSDC: 6,
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
    if (!userAddress || !smartWalletAddress || !wallets || wallets.length === 0) {
      setBuildings([])
      return
    }

    setLoading(true)
    try {
      const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
      
      // Ensure we are on the correct chain before fetching
      const validChains = ['eip155:84532', '84532']
      if (process.env.NEXT_PUBLIC_USE_LOCALHOST === 'true') {
        validChains.push('eip155:31337', '31337')
      }
      if (!validChains.includes(wallet.chainId)) {
        console.warn(`[City] Wallet is on wrong chain (${wallet.chainId}). Skipping fetch.`)
        setLoading(false)
        return
      }

      const ethereumProvider = await wallet.getEthereumProvider()
      const provider = new ethers.BrowserProvider(ethereumProvider)
      
      const network = 'baseSepolia'
      const addresses = ADDRESSES
      
      const core = new ethers.Contract(addresses.DEFICITY_CORE, ABIS.DEFICITY_CORE, provider)
      const dataProvider = new ethers.Contract(addresses.AAVE_DATA_PROVIDER, ABIS.AAVE_DATA_PROVIDER, provider)
      
      console.log(`[City] Fetching real buildings for ${userAddress}...`)
      
      // 1. Fetch buildings from DefiCityCore
      const contractBuildings = await core.getUserBuildings(userAddress)
      console.log(`[City] Found ${contractBuildings.length} buildings in contract`)

      // 2. Fetch Aave positions (Supply & Borrow) and APY for amount updates
      const aaveSupplyPositions: Record<string, bigint> = {}
      const aaveBorrowPositions: Record<string, bigint> = {}
      const aaveSupplyAPYs: Record<string, number> = {}
      const aaveBorrowAPYs: Record<string, number> = {}
      const RAY_NUMBER = 1e27
      const SECONDS_PER_YEAR = 31536000

      for (const [symbol, address] of Object.entries(ASSET_ADDRESSES)) {
        try {
          const data = await dataProvider.getUserReserveData(address, smartWalletAddress)
          aaveSupplyPositions[symbol] = data.currentATokenBalance
          // Borrow = stable debt + variable debt
          aaveBorrowPositions[symbol] = data.currentStableDebt + data.currentVariableDebt

          // Fetch reserve data for APY
          const reserveData = await dataProvider.getReserveData(address)
          const supplyRatePerSecond = Number(reserveData.liquidityRate) / RAY_NUMBER / SECONDS_PER_YEAR
          const borrowRatePerSecond = Number(reserveData.variableBorrowRate) / RAY_NUMBER / SECONDS_PER_YEAR
          aaveSupplyAPYs[symbol] = (Math.pow(1 + supplyRatePerSecond, SECONDS_PER_YEAR) - 1) * 100
          aaveBorrowAPYs[symbol] = (Math.pow(1 + borrowRatePerSecond, SECONDS_PER_YEAR) - 1) * 100
        } catch (e) {
          aaveSupplyPositions[symbol] = 0n
          aaveBorrowPositions[symbol] = 0n
          aaveSupplyAPYs[symbol] = 0
          aaveBorrowAPYs[symbol] = 0
        }
      }


      // Center coordinate for grid placement
      const centerCoord = Math.ceil(GRID_SIZE / 2)

      // 3. Map contract buildings to our UI structure
      const mappedBuildings = contractBuildings.map((b: any) => {
        // Find asset symbol by address
        const assetSymbol = Object.entries(ASSET_ADDRESSES).find(([_, addr]) =>
          addr.toLowerCase() === b.asset.toLowerCase()
        )?.[0] || 'CORE'

        const isLotteryBuilding = b.buildingType.toLowerCase() === 'lottery'
        const isMegapotLPBuilding = b.buildingType.toLowerCase() === 'megapot-lp'
        const isLPBuilding = b.buildingType.toLowerCase() === 'lp'
        const isBorrowBuilding = b.buildingType.toLowerCase() === 'borrow'
        const isAaveAsset = assetSymbol !== 'CORE' && !isLotteryBuilding && !isMegapotLPBuilding

        let amount: number
        if (isLotteryBuilding || isMegapotLPBuilding) {
          amount = Number(ethers.formatUnits(b.amount, ASSET_DECIMALS[assetSymbol] || 6))
        } else if (isLPBuilding) {
          amount = Number(ethers.formatUnits(b.amount, 18))
        } else if (isAaveAsset) {
          const liveAmountBigInt = isBorrowBuilding
            ? aaveBorrowPositions[assetSymbol]
            : aaveSupplyPositions[assetSymbol]
          amount = Number(ethers.formatUnits(liveAmountBigInt || 0n, ASSET_DECIMALS[assetSymbol] || 18))
        } else {
          amount = Number(ethers.formatUnits(b.amount, ASSET_DECIMALS[assetSymbol] || 18))
        }

        const amountUSD = amount * (ASSET_PRICES[assetSymbol] || 1)

        const isTownHall = b.buildingType.toLowerCase() === 'townhall'
        const displayX = isTownHall ? centerCoord : Number(b.coordinateX)
        const displayY = isTownHall ? centerCoord : Number(b.coordinateY)

        const buildingAPY = isLotteryBuilding || isMegapotLPBuilding || isLPBuilding
          ? 0
          : isBorrowBuilding
            ? aaveBorrowAPYs[assetSymbol] || 0
            : aaveSupplyAPYs[assetSymbol] || 0

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
          apy: buildingAPY,
          placedAt: Number(b.placedAt) * 1000,
          x: displayX,
          y: displayY,
          active: b.active,
          isBorrow: isBorrowBuilding,
          metadata: b.metadata,
        }
      })

      // Filter: must be active AND (if it's an Aave building, amount must be > 0)
      // Lottery buildings always show (tickets are non-recoverable)
      // Filter: must be active AND (if Aave building, amount > 0; LP always show)
      let activeBuildings = mappedBuildings.filter((b: any) => {
        if (!b.active) return false
        if (b.type === 'lottery') return true
        if (b.type === 'megapot-lp') return true
        if (b.type?.toLowerCase() === 'lp') return true
        if (b.asset !== 'CORE' && b.amount <= 0) return false
        return true
      })

      // Deduplication: Only show the LATEST building (highest ID) for each unique (asset + type) combo
      // This prevents "ghost" buildings from legacy data showing up
      // Note: Same asset can have both supply (bank) and borrow buildings
      // Lottery buildings each get their own tile — no dedup needed
      const latestByAssetAndType: Record<string, any> = {}

      activeBuildings.forEach((b: any) => {
        if (b.asset === 'CORE' || b.type === 'lottery' || b.type === 'megapot-lp') return
        if (b.asset === 'CORE') return // Keep Town Hall
        if (b.type?.toLowerCase() === 'lp') return // Keep each LP (unique by id)
        const key = `${b.asset}-${b.isBorrow ? 'borrow' : 'supply'}`
        if (!latestByAssetAndType[key] || b.id > latestByAssetAndType[key].id) {
          latestByAssetAndType[key] = b
        }
      })

      const deduplicatedBuildings = activeBuildings.filter((b: any) => {
        if (b.asset === 'CORE' || b.type === 'lottery' || b.type === 'megapot-lp') return true
        if (b.asset === 'CORE') return true
        if (b.type?.toLowerCase() === 'lp') return true
        const key = `${b.asset}-${b.isBorrow ? 'borrow' : 'supply'}`
        return latestByAssetAndType[key] && b.id === latestByAssetAndType[key].id
      })

      // Count supply vs borrow buildings
      const supplyCount = deduplicatedBuildings.filter((b: any) => !b.isBorrow && b.asset !== 'CORE').length
      const borrowCount = deduplicatedBuildings.filter((b: any) => b.isBorrow).length

      console.log(`[City] Total: ${contractBuildings.length}, Supply: ${supplyCount}, Borrow: ${borrowCount}`)

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

  /** Optimistically update a building's position in local state (before chain confirms) */
  const optimisticMove = useCallback((buildingId: number, newX: number, newY: number) => {
    const update = (b: Building) =>
      b.id === buildingId ? { ...b, x: newX, y: newY } : b
    setBuildings(prev => prev.map(update))
    setAllBuildings(prev => prev.map(update))
  }, [])

  return {
    buildings,
    allBuildings,
    loading,
    error,
    refresh: fetchBuildings,
    optimisticMove,
  }
}
