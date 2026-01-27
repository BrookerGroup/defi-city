/**
 * useMoveBuilding Hook
 * Moves a building to a new grid position via batch transaction:
 * recordDemolition (clear old) + recordBuildingPlacement (create at new position)
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
        const { signer, addresses } = await getContracts()
        const signerAddress = await signer.getAddress()

        console.log(`[Move] Moving building ${building.id} (${building.type}/${building.asset}) from (${building.x},${building.y}) to (${newX},${newY})`)

        const targets: string[] = []
        const values: bigint[] = []
        const datas: string[] = []

        const coreInterface = new ethers.Interface(ABIS.DEFICITY_CORE)

        // 1. Demolish old building
        const demolitionData = coreInterface.encodeFunctionData('recordDemolition', [
          signerAddress,
          building.id,
          0, // returnedAmount = 0 (no withdrawal, just relocating)
        ])

        targets.push(addresses.DEFICITY_CORE)
        values.push(0n)
        datas.push(demolitionData)

        // 2. Place building at new position
        // Resolve asset address (CORE assets use zero address)
        const ASSET_ADDRESSES: Record<string, string> = {
          USDC: addresses.USDC,
          USDT: addresses.USDT,
          ETH: addresses.ETH,
        }
        const assetAddress = ASSET_ADDRESSES[building.asset] || ethers.ZeroAddress

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
