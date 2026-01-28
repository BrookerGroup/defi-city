/**
 * useTokenBalance Hook
 * Get token balance for Smart Wallet (not EOA)
 * Tokens are stored in Smart Wallet, not in the user's EOA address
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
  WBTC: CONTRACTS.baseSepolia.WBTC,
}

// Asset decimals mapping
const ASSET_DECIMALS: Record<AaveAsset, number> = {
  USDC: 6,
  USDT: 6,
  ETH: 18,
  WBTC: 8,
}

export function useTokenBalance(smartWalletAddress: string | null | undefined, asset: AaveAsset) {
  const { wallets } = useWallets()
  const [balance, setBalance] = useState<string>('0')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBalance() {
      if (!smartWalletAddress || !wallets || wallets.length === 0) {
        setBalance('0')
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

        // Verify contract has code before calling
        const code = await provider.getCode(assetAddress)
        if (code === '0x') {
          console.warn(`Token contract not found at ${assetAddress} for ${asset}`)
          setBalance('0')
          setError(`Token contract not found for ${asset}`)
          setLoading(false)
          return
        }

        const token = new ethers.Contract(assetAddress, ABIS.ERC20, provider)
        
        // Check balance at Smart Wallet (not EOA)
        let balanceWei
        try {
          balanceWei = await token.balanceOf(smartWalletAddress)
        } catch (balanceError: any) {
          console.error(`Error calling balanceOf for ${asset} at ${assetAddress}:`, balanceError)
          setBalance('0')
          setError(`Failed to fetch ${asset} balance from Smart Wallet: ${balanceError.message || 'Unknown error'}`)
          setLoading(false)
          return
        }
        
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
  }, [smartWalletAddress, asset, wallets])

  return { balance, loading, error }
}
