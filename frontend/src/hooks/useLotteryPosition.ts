/**
 * useLotteryPosition Hook
 * Fetches user's Megapot lottery position (tickets, winnings, MPUSDC balance)
 */

import { useState, useCallback, useEffect } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'
import { MPUSDC_DECIMALS } from '@/lib/constants'

export interface LotteryPosition {
  ticketsPurchased: number
  winningsClaimable: number
  mpusdcBalance: number
}

export function useLotteryPosition(smartWalletAddress: string | null) {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [position, setPosition] = useState<LotteryPosition | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchPosition = useCallback(async () => {
    if (!smartWalletAddress || !wallets || wallets.length === 0) return

    setLoading(true)
    try {
      const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
      const ethereumProvider = await wallet.getEthereumProvider()
      const provider = new ethers.BrowserProvider(ethereumProvider)

      const addresses = CONTRACTS.baseSepolia
      const megapot = new ethers.Contract(addresses.MEGAPOT, ABIS.MEGAPOT, provider)
      const mpusdc = new ethers.Contract(addresses.MPUSDC, ABIS.MPUSDC, provider)

      const [userInfo, balance] = await Promise.all([
        megapot.usersInfo(smartWalletAddress),
        mpusdc.balanceOf(smartWalletAddress),
      ])

      setPosition({
        ticketsPurchased: Number(userInfo.ticketsPurchased),
        winningsClaimable: Number(ethers.formatUnits(userInfo.winningsClaimable, MPUSDC_DECIMALS)),
        mpusdcBalance: Number(ethers.formatUnits(balance, MPUSDC_DECIMALS)),
      })
      setError(null)
    } catch (err: any) {
      console.error('Error fetching lottery position:', err)
      setError(err.message || 'Failed to fetch lottery position')
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
    refresh: fetchPosition,
  }
}
