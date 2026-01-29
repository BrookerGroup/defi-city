/**
 * useMoveBuilding Hook
 * Moves a building to a new grid position via batch transaction:
 * recordDemolition (clear old) + recordBuildingPlacement (create at new position)
 *
 * Works for both supply and borrow buildings (both stored on-chain).
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'
import { Building } from './useCityBuildings'

export function useMoveBuilding() {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getContracts = async () => {
    if (!wallets || wallets.length === 0) {
      throw new Error('Wallet not connected')
    }

    const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
    const ethereumProvider = await wallet.getEthereumProvider()
    const provider = new ethers.BrowserProvider(ethereumProvider)
    const signer = await provider.getSigner()

    const network = 'baseSepolia'
    const addresses = CONTRACTS[network]

    return {
      signer,
      addresses,
    }
  }

  const moveBuilding = useCallback(
    async (
      smartWalletAddress: string,
      building: Building,
      newX: number,
      newY: number
    ) => {
      setLoading(true)
      setError(null)

      try {
        // Check if this is a virtual/legacy borrow building (ID >= 100000)
        const isVirtualBorrow = building.id >= 100000

        console.log(`[Move] Moving building ${building.id} (${building.type}/${building.asset}) from (${building.x},${building.y}) to (${newX},${newY}) [virtual: ${isVirtualBorrow}]`)

        const { signer, addresses } = await getContracts()
        const signerAddress = await signer.getAddress()

        const targets: string[] = []
        const values: bigint[] = []
        const datas: string[] = []

        const coreInterface = new ethers.Interface(ABIS.DEFICITY_CORE)

        // Resolve asset address (CORE assets use zero address)
        const ASSET_ADDRESSES: Record<string, string> = {
          USDC: addresses.USDC,
          USDT: addresses.USDT,
          ETH: addresses.ETH,
          WBTC: addresses.WBTC,
          LINK: addresses.LINK,
        }
        const assetAddress = ASSET_ADDRESSES[building.asset] || ethers.ZeroAddress

        // 1. Demolish old building (ONLY if it exists on-chain)
        if (!isVirtualBorrow) {
          const demolitionData = coreInterface.encodeFunctionData('recordDemolition', [
            signerAddress,
            building.id,
            0, // returnedAmount = 0 (no withdrawal, just relocating)
          ])

          targets.push(addresses.DEFICITY_CORE)
          values.push(0n)
          datas.push(demolitionData)
        } else {
          console.log('[Move] Skipping demolition for virtual borrow building')
        }

        // 2. Place building at new position (this creates/updates the on-chain record)
        const placementData = coreInterface.encodeFunctionData('recordBuildingPlacement', [
          signerAddress,
          building.type,
          assetAddress,
          0, // amount = 0 (funds remain in Aave, no new deposit)
          newX,
          newY,
          '0x', // empty metadata
        ])

        targets.push(addresses.DEFICITY_CORE)
        values.push(0n)
        datas.push(placementData)

        // 3. Execute batch via SmartWallet
        const smartWallet = new ethers.Contract(
          smartWalletAddress,
          ABIS.SMART_WALLET,
          signer
        )

        console.log('[Move] Executing batch move via SmartWallet...')
        const executeTx = await smartWallet.executeBatch(
          targets,
          values,
          datas,
          { gasLimit: 3000000 }
        )

        console.log('[Move] Transaction sent:', executeTx.hash)
        const receipt = await executeTx.wait()
        console.log('[Move] Transaction confirmed:', receipt.hash)

        setLoading(false)
        return {
          success: true,
          txHash: receipt.hash,
        }
      } catch (err: any) {
        console.error('[Move] Error moving building:', err)
        const errorMessage = err.reason || err.message || 'Failed to move building'
        setError(errorMessage)
        setLoading(false)
        return {
          success: false,
          error: errorMessage,
        }
      }
    },
    [wallets]
  )

  return {
    moveBuilding,
    loading,
    error,
  }
}
