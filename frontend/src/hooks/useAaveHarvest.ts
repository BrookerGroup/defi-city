/**
 * useAaveHarvest Hook
 * Harvest Bank rewards via BuildingRegistry.prepareHarvest (withdraw + recordHarvest).
 * Building remains active; no demolition.
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'

const BUILDING_TYPE_BANK = 'bank'

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

export function useAaveHarvest() {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const getContracts = async () => {
    if (!wallets || wallets.length === 0) throw new Error('Wallet not connected')

    const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
    const ethereumProvider = await wallet.getEthereumProvider()
    const provider = new ethers.BrowserProvider(ethereumProvider)
    const signer = await provider.getSigner()

    const network = 'baseSepolia'
    const addresses = CONTRACTS[network]

    return {
      signer,
      provider,
      addresses,
      smartWalletAbi: ABIS.SMART_WALLET,
      buildingRegistryAbi: ABIS.BUILDING_REGISTRY,
    }
  }

  const harvest = useCallback(
    async (
      userAddress: string,
      smartWalletAddress: string,
      buildingId: number,
      asset: string,
      amount: number
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      setLoading(true)
      setError(null)

      try {
        const { signer, addresses, smartWalletAbi, buildingRegistryAbi } =
          await getContracts()

        const assetAddress = ASSET_ADDRESSES[asset]
        const decimals = ASSET_DECIMALS[asset]
        if (!assetAddress || decimals == null) {
          setLoading(false)
          return { success: false, error: `Unsupported asset: ${asset}` }
        }

        const amountWei = ethers.parseUnits(amount.toString(), decimals)

        // HarvestParams(asset, amount) - abi.encode for BankAdapter
        const paramsEncoded = ethers.AbiCoder.defaultAbiCoder().encode(
          ['tuple(address asset, uint256 amount)'],
          [[assetAddress, amountWei]]
        )

        const registry = new ethers.Contract(
          addresses.BUILDING_REGISTRY,
          buildingRegistryAbi,
          signer
        )

        let [targets, values, datas] = await registry.prepareHarvest(
          BUILDING_TYPE_BANK,
          userAddress,
          smartWalletAddress,
          buildingId,
          paramsEncoded
        )

        targets = Array.from(targets) as string[]
        values = Array.from(values) as bigint[]
        datas = Array.from(datas) as string[]

        // For ETH: insert WETH unwrap after Pool.withdraw (first call)
        if (asset === 'ETH') {
          const wethInterface = new ethers.Interface([
            'function withdraw(uint256)',
          ])
          const unwrapData = wethInterface.encodeFunctionData('withdraw', [
            amountWei,
          ])
          targets.splice(1, 0, assetAddress)
          values.splice(1, 0, 0n)
          datas.splice(1, 0, unwrapData)
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
        console.log('[Harvest] Gas estimate:', gasEstimate.toString())

        const tx = await smartWallet.executeBatch(targets, values, datas, {
          gasLimit: gasEstimate + 50_000n,
        })

        console.log('[Harvest] Tx sent:', tx.hash)
        const receipt = await tx.wait()
        console.log('[Harvest] Confirmed:', receipt?.hash)

        setLoading(false)
        return { success: true, txHash: receipt?.hash }
      } catch (err: any) {
        console.error('Error in harvest:', err)
        const errorMessage = err.reason || err.message || 'Harvest failed'
        setError(errorMessage)
        setLoading(false)
        return { success: false, error: errorMessage }
      }
    },
    [wallets]
  )

  return {
    harvest,
    loading,
    error,
  }
}
