/**
 * useCityBuildings Hook
 * Generates buildings based on Aave Supply positions
 */

import { useState, useCallback, useEffect, useMemo } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'
import { ASSET_PRICES } from '@/config/aave'

export interface Building {
  id: number
  owner: string
  smartWallet: string
  type: string
  asset: string
  amount: number
  amountUSD: number
  level: number  // 1-5 based on supply amount
  placedAt: number
  x: number
  y: number
  active: boolean
}

// Asset addresses and decimals
const ASSET_ADDRESSES: Record<string, string> = {
  USDC: CONTRACTS.baseSepolia.USDC,
  ETH: CONTRACTS.baseSepolia.WETH,
}

const ASSET_DECIMALS: Record<string, number> = {
  USDC: 6,
  ETH: 18,
}

// Calculate building level based on USD value
function calculateLevel(amountUSD: number): number {
  if (amountUSD >= 5000) return 5
  if (amountUSD >= 1000) return 4
  if (amountUSD >= 500) return 3
  if (amountUSD >= 100) return 2
  return 1
}

// Assign building positions in a pattern
function assignPosition(index: number): { x: number; y: number } {
  // Positions around center (7,7 is reserved for Town Hall)
  const positions = [
    { x: 6, y: 7 },  // Left of center
    { x: 8, y: 7 },  // Right of center
    { x: 7, y: 6 },  // Above center
    { x: 7, y: 8 },  // Below center
    { x: 6, y: 6 },  // Top-left
    { x: 8, y: 8 },  // Bottom-right
    { x: 6, y: 8 },  // Bottom-left
    { x: 8, y: 6 },  // Top-right
    { x: 5, y: 7 },  // Far left
    { x: 9, y: 7 },  // Far right
    { x: 7, y: 5 },  // Far top
    { x: 7, y: 9 },  // Far bottom
  ]
  return positions[index % positions.length]
}

export function useCityBuildings(userAddress?: string, smartWalletAddress?: string | null) {
  const { wallets } = useWallets()
  const [buildings, setBuildings] = useState<Building[]>([])
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
      
      const dataProvider = new ethers.Contract(addresses.AAVE_DATA_PROVIDER, ABIS.AAVE_DATA_PROVIDER, provider)
      
      console.log(`[City] Fetching Aave positions for ${smartWalletAddress}...`)
      
      const generatedBuildings: Building[] = []
      let buildingIndex = 0
      
      // Always add Town Hall at center when Smart Wallet exists
      generatedBuildings.push({
        id: buildingIndex,
        owner: userAddress || '',
        smartWallet: smartWalletAddress,
        type: 'townhall',
        asset: 'CORE',
        amount: 0,
        amountUSD: 0,
        level: 1,
        placedAt: Date.now(),
        x: 7,  // Center of 13x13 grid
        y: 7,
        active: true
      })
      buildingIndex++
      
      // Check USDC supply
      const usdcAddress = ASSET_ADDRESSES.USDC
      const usdcData = await dataProvider.getUserReserveData(usdcAddress, smartWalletAddress)
      const usdcSupply = usdcData.currentATokenBalance
      
      if (usdcSupply > 0n) {
        const amount = Number(ethers.formatUnits(usdcSupply, ASSET_DECIMALS.USDC))
        const amountUSD = amount * ASSET_PRICES.USDC
        const level = calculateLevel(amountUSD)
        const pos = assignPosition(buildingIndex)
        
        generatedBuildings.push({
          id: buildingIndex,
          owner: userAddress || '',
          smartWallet: smartWalletAddress,
          type: 'bank',
          asset: 'USDC',
          amount,
          amountUSD,
          level,
          placedAt: Date.now(),
          x: pos.x,
          y: pos.y,
          active: true
        })
        buildingIndex++
      }
      
      // Check ETH supply (future: can add more assets)
      const ethAddress = ASSET_ADDRESSES.ETH
      try {
        const ethData = await dataProvider.getUserReserveData(ethAddress, smartWalletAddress)
        const ethSupply = ethData.currentATokenBalance
        
        if (ethSupply > 0n) {
          const amount = Number(ethers.formatUnits(ethSupply, ASSET_DECIMALS.ETH))
          const amountUSD = amount * ASSET_PRICES.ETH
          const level = calculateLevel(amountUSD)
          const pos = assignPosition(buildingIndex)
          
          generatedBuildings.push({
            id: buildingIndex,
            owner: userAddress || '',
            smartWallet: smartWalletAddress,
            type: 'shop',  // Use shop type for ETH
            asset: 'ETH',
            amount,
            amountUSD,
            level,
            placedAt: Date.now(),
            x: pos.x,
            y: pos.y,
            active: true
          })
          buildingIndex++
        }
      } catch (err) {
        // ETH might not be available, skip
        console.log('[City] ETH reserve not available')
      }
      
      console.log(`[City] Generated ${generatedBuildings.length} buildings from Aave positions`)
      setBuildings(generatedBuildings)
      setError(null)
    } catch (err: any) {
      console.error('[City] Error fetching Aave positions:', err)
      setError(err.message || 'Failed to fetch positions')
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
    loading,
    error,
    refresh: fetchBuildings
  }
}
