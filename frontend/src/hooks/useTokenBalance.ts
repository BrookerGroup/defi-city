/**
 * useTokenBalance Hook
 * Get token balance for user
 */

import { useState, useEffect } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'
import { AaveAsset } from '@/types/aave'

// Asset addresses mapping
const ASSET_ADDRESSES: Record<AaveAsset, string> = {
  USDC: CONTRACTS.baseSepolia.USDC,
  USDT: CONTRACTS.baseSepolia.USDT,
  ETH: CONTRACTS.baseSepolia.WETH,
  WBTC: '0x0000000000000000000000000000000000000000',
}

// Asset decimals mapping
const ASSET_DECIMALS: Record<AaveAsset, number> = {
  USDC: 6,
  USDT: 6,
  ETH: 18,
  WBTC: 8,
}

export function useTokenBalance(userAddress: string | undefined, asset: AaveAsset) {
  const { wallets } = useWallets()
  const [balance, setBalance] = useState<string>('0')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBalance() {
      if (!userAddress || !wallets || wallets.length === 0) {
        setLoading(false)
        return
      }

      try {
        const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
        const ethereumProvider = await wallet.getEthereumProvider()
        const provider = new ethers.BrowserProvider(ethereumProvider)

        const assetAddress = ASSET_ADDRESSES[asset]
        const decimals = ASSET_DECIMALS[asset]

        if (assetAddress === '0x0000000000000000000000000000000000000000') {
          setBalance('0')
          setLoading(false)
          return
        }

        const token = new ethers.Contract(assetAddress, ABIS.ERC20, provider)
        const balanceWei = await token.balanceOf(userAddress)
        const balanceFormatted = ethers.formatUnits(balanceWei, decimals)
        
        setBalance(balanceFormatted)
        setError(null)
      } catch (err: any) {
        console.error('Error fetching token balance:', err)
        setError(err.message)
        setBalance('0')
      } finally {
        setLoading(false)
      }
    }

    fetchBalance()

    // Refresh every 10 seconds
    const interval = setInterval(fetchBalance, 10000)
    return () => clearInterval(interval)
  }, [userAddress, asset, wallets])

  return { balance, loading, error }
}
