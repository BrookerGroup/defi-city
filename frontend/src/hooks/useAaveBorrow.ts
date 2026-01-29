/**
 * useAaveBorrow Hook
 * Borrow from Aave via Smart Wallet (Pool.borrow) + record building on-chain
 * Uses executeBatch on Smart Wallet for borrow + recordBuildingPlacement
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'
import { GRID_SIZE } from '@/lib/constants'

const INTEREST_RATE_MODE_VARIABLE = 2

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

export function useAaveBorrow() {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Helper to find an empty position by checking contract
  const findEmptyPosition = useCallback(async (userAddress: string, core: any): Promise<[number, number]> => {
    const occupied = new Set<string>()

    try {
      const buildings = await core.getUserBuildings(userAddress)
      if (buildings && buildings.length > 0) {
        for (const building of buildings) {
          if (building.active) {
            const x = Number(building.coordinateX)
            const y = Number(building.coordinateY)
            occupied.add(`${x},${y}`)
          }
        }
      }
    } catch (error) {
      console.error('Error fetching buildings for position check:', error)
    }

    const center = Math.ceil(GRID_SIZE / 2)

    // Find empty position (prefer positions around center)
    const priorityPositions = [
      { x: center - 1, y: center }, { x: center + 1, y: center }, { x: center, y: center - 1 }, { x: center, y: center + 1 },
      { x: center - 1, y: center - 1 }, { x: center + 1, y: center + 1 }, { x: center - 1, y: center + 1 }, { x: center + 1, y: center - 1 },
      { x: center - 2, y: center }, { x: center + 2, y: center }, { x: center, y: center - 2 }, { x: center, y: center + 2 },
    ]

    for (const pos of priorityPositions) {
      if (!occupied.has(`${pos.x},${pos.y}`)) {
        try {
          const buildingId = await core.userGridBuildings(userAddress, pos.x, pos.y)
          if (buildingId.toString() === '0') {
            return [pos.x, pos.y]
          }
        } catch (e) {
          return [pos.x, pos.y]
        }
      }
    }

    // Fallback: search within grid area
    for (let x = 1; x <= GRID_SIZE; x++) {
      for (let y = 1; y <= GRID_SIZE; y++) {
        if (x === center && y === center) continue
        if (!occupied.has(`${x},${y}`)) {
          try {
            const buildingId = await core.userGridBuildings(userAddress, x, y)
            if (buildingId.toString() === '0') return [x, y]
          } catch (e) {
            return [x, y]
          }
        }
      }
    }

    return [10, 10] // Deep fallback
  }, [])

  const getContracts = async () => {
    if (!wallets || wallets.length === 0) throw new Error('Wallet not connected')

    const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
    const ethereumProvider = await wallet.getEthereumProvider()
    const provider = new ethers.BrowserProvider(ethereumProvider)
    const signer = await provider.getSigner()

    const network = 'baseSepolia'
    const addresses = CONTRACTS[network]

    const core = new ethers.Contract(
      addresses.DEFICITY_CORE,
      ABIS.DEFICITY_CORE,
      signer
    )

    return {
      signer,
      provider,
      addresses,
      core,
      smartWalletAbi: ABIS.SMART_WALLET,
      aavePoolAbi: ABIS.AAVE_POOL,
      coreAbi: ABIS.DEFICITY_CORE,
    }
  }

  const borrow = useCallback(
    async (
      userAddress: string,
      smartWalletAddress: string,
      asset: string,
      amount: number,
      x?: number,
      y?: number,
      isUpgrade?: boolean
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      setLoading(true)
      setError(null)

      console.log(`[Borrow] Starting borrow: ${amount} ${asset} (isUpgrade: ${isUpgrade})`)

      try {
        const { signer, addresses, smartWalletAbi, aavePoolAbi, core, coreAbi } = await getContracts()

        const assetAddress = ASSET_ADDRESSES[asset]
        const decimals = ASSET_DECIMALS[asset]
        console.log(`[Borrow] Asset address: ${assetAddress}, decimals: ${decimals}`)
        if (!assetAddress || !decimals) {
          setLoading(false)
          return { success: false, error: `Unsupported asset: ${asset}` }
        }

        // Auto-find empty position if not provided
        if (x === undefined || y === undefined) {
          const [foundX, foundY] = await findEmptyPosition(userAddress, core)
          x = foundX
          y = foundY
          console.log(`[Borrow] Using auto-found position: (${x}, ${y})`)
        }

        const amountWei = ethers.parseUnits(amount.toString(), decimals)

        // 1. Build borrow calldata
        const poolInterface = new ethers.Interface(aavePoolAbi)
        const borrowData = poolInterface.encodeFunctionData('borrow', [
          assetAddress,
          amountWei,
          INTEREST_RATE_MODE_VARIABLE,
          0,
          smartWalletAddress,
        ])

        const targets: string[] = [addresses.AAVE_POOL]
        const values: bigint[] = [0n]
        const datas: string[] = [borrowData]

        // 2. Add recordBuildingPlacement for new borrow (not upgrade)
        if (!isUpgrade) {
          const coreInterface = new ethers.Interface(coreAbi)
          const placementData = coreInterface.encodeFunctionData('recordBuildingPlacement', [
            userAddress,       // owner
            'borrow',          // buildingType
            assetAddress,      // asset
            amountWei,         // amount
            x,                 // coordinateX
            y,                 // coordinateY
            '0x',              // metadata
          ])

          targets.push(addresses.DEFICITY_CORE)
          values.push(0n)
          datas.push(placementData)

          console.log(`[Borrow] Adding building placement at (${x}, ${y})`)
        }

        const smartWallet = new ethers.Contract(
          smartWalletAddress,
          smartWalletAbi,
          signer
        )

        const gasEstimate = await smartWallet.executeBatch.estimateGas(
          targets,
          values,
          datas
        )
        console.log('[Borrow] Gas estimate:', gasEstimate.toString())

        const tx = await smartWallet.executeBatch(targets, values, datas, {
          gasLimit: gasEstimate + 100_000n,
        })

        console.log('[Borrow] Tx sent:', tx.hash)
        const receipt = await tx.wait()
        console.log('[Borrow] Confirmed:', receipt?.hash)

        setLoading(false)
        return { success: true, txHash: receipt?.hash }
      } catch (err: any) {
        console.error('Error in borrow:', err)
        const errorMessage = err.reason || err.message || 'Borrow failed'
        setError(errorMessage)
        setLoading(false)
        return { success: false, error: errorMessage }
      }
    },
    [wallets, findEmptyPosition]
  )

  return {
    borrow,
    loading,
    error,
  }
}
