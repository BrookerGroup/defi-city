'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useSmartWallet, useTokenBalance } from '@/hooks'
import { formatEther } from 'viem'
import { ConnectButton } from '@/components/wallet'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { LayoutDashboard, Map, Building2, Settings } from 'lucide-react'

type NavItem = {
  label: string
  icon: React.ReactNode
  href: string
  active?: boolean
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, href: '#dashboard' },
  { label: 'Map', icon: <Map className="h-4 w-4" />, href: '#map', active: true },
  { label: 'Buildings', icon: <Building2 className="h-4 w-4" />, href: '#buildings' },
  { label: 'Settings', icon: <Settings className="h-4 w-4" />, href: '#settings' },
]

export function TopBar() {
  const { user, authenticated } = usePrivy()
  const eoaAddress = user?.wallet?.address as `0x${string}` | undefined
  const { balance, walletAddress } = useSmartWallet(eoaAddress)
  const { formatted: usdcBalance } = useTokenBalance(walletAddress ?? undefined, 'USDC')

  const formatBalance = (value: bigint | undefined) => {
    if (!value) return '0.00'
    const formatted = formatEther(value)
    return parseFloat(formatted).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 4,
    })
  }

  const formatUSDC = (value: string) => {
    return parseFloat(value).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
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

        {/* Navigation Menu */}
        {authenticated && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.label}
                variant={item.active ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-2"
                asChild
              >
                <a href={item.href}>
                  {item.icon}
                  <span className="hidden lg:inline">{item.label}</span>
                </a>
              </Button>
            ))}
          </nav>
        )}

        {/* Resources */}
        {authenticated && (
          <div className="flex items-center gap-2 md:gap-4">
            <div className="flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
              <span className="text-lg">💰</span>
              <span className="font-mono text-sm">{formatUSDC(usdcBalance)} USDC</span>
            </div>
            <div className="hidden sm:flex items-center gap-2 bg-muted/50 px-3 py-1.5 rounded-full">
              <span className="text-lg">◇</span>
              <span className="font-mono text-sm">{formatBalance(balance)} ETH</span>
            </div>
          </div>
        )}

        {/* Wallet */}
        <div className="flex items-center gap-3">
          <Badge variant="outline" className="hidden sm:flex">
            Base Sepolia
          </Badge>
          <ConnectButton />
        </div>
      </div>
    </div>
  )
}
