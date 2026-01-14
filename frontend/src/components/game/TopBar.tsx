'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useSmartWallet } from '@/hooks'
import { formatEther } from 'viem'
import { ConnectButton } from '@/components/wallet'
import { Badge } from '@/components/ui/badge'
import { Coins, Diamond } from 'lucide-react'

export function TopBar() {
  const { user, authenticated } = usePrivy()
  const eoaAddress = user?.wallet?.address as `0x${string}` | undefined
  const { balance } = useSmartWallet(eoaAddress)

  const formatBalance = (value: bigint | undefined) => {
    if (!value) return '0.00'
    const formatted = formatEther(value)
    return parseFloat(formatted).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })
  }

  return (
    <div className="fixed top-0 left-0 right-0 h-14 bg-background/80 backdrop-blur-sm border-b z-50">
      <div className="h-full max-w-screen-2xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="text-2xl">🏙️</span>
          <span className="font-bold text-lg hidden sm:block">DeFi City</span>
        </div>

        {/* Resources */}
        {authenticated && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
              <span className="text-lg">💰</span>
              <span className="font-mono text-sm">0.00 USDC</span>
            </div>
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
              <span className="text-lg">◇</span>
              <span className="font-mono text-sm">{formatBalance(balance)} ETH</span>
            </div>
            <div className="hidden md:flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
              <Diamond className="h-4 w-4 text-purple-400" />
              <span className="font-mono text-sm">0 Points</span>
            </div>
          </div>
        )}

        {/* Wallet */}
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:flex">
            Sepolia
          </Badge>
          <ConnectButton />
        </div>
      </div>
    </div>
  )
}
