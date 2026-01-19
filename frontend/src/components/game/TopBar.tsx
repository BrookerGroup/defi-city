'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useSmartWallet, useTokenBalance } from '@/hooks'
import { formatEther } from 'viem'
import { ConnectButton } from '@/components/wallet'

type View = 'dashboard' | 'map' | 'buildings' | 'settings'

type NavItem = {
  label: string
  icon: React.ReactNode
  view: View
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: <LayoutDashboard className="h-4 w-4" />, view: 'dashboard' },
  { label: 'Map', icon: <Map className="h-4 w-4" />, view: 'map' },
  { label: 'Buildings', icon: <Building2 className="h-4 w-4" />, view: 'buildings' },
  { label: 'Settings', icon: <Settings className="h-4 w-4" />, view: 'settings' },
]

interface TopBarProps {
  currentView?: View
  onViewChange?: (view: View) => void
}

export function TopBar({ currentView = 'map', onViewChange }: TopBarProps) {
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
    <div
      className="fixed top-0 left-0 right-0 h-16 z-50 border-b-2"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#475569',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="h-full max-w-screen-2xl mx-auto px-4 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="px-3 py-1.5 border-2"
            style={{
              borderColor: '#F59E0B',
              backgroundColor: 'rgba(245, 158, 11, 0.1)',
              boxShadow: '3px 3px 0px #B45309'
            }}
          >
            <span
              className="text-amber-400 text-sm font-bold tracking-wide"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              DEFICITY
            </span>
          </div>
        </div>

        {/* Navigation Menu */}
        {authenticated && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => (
              <Button
                key={item.label}
                variant={currentView === item.view ? 'secondary' : 'ghost'}
                size="sm"
                className="gap-2"
                onClick={() => onViewChange?.(item.view)}
              >
                {item.icon}
                <span className="hidden lg:inline">{item.label}</span>
              </Button>
            ))}
          </nav>
        )}

        {/* Resources */}
        {authenticated && (
          <div className="flex items-center gap-3">
            <div
              className="flex items-center gap-2 px-3 py-1.5 border-2"
              style={{
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
              }}
            >
              <span className="text-emerald-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>ETH</span>
              <span className="font-mono text-sm text-emerald-300">{formatBalance(balance)}</span>
            </div>
            <div
              className="hidden md:flex items-center gap-2 px-3 py-1.5 border-2"
              style={{
                borderColor: '#06B6D4',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
              }}
            >
              <span className="text-cyan-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>USDC</span>
              <span className="font-mono text-sm text-cyan-300">0.00</span>
            </div>
          </div>
        )}

        {/* Network & Wallet */}
        <div className="flex items-center gap-3">
          <div
            className="hidden sm:flex px-2 py-1 border-2 text-xs"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '8px',
              borderColor: '#8B5CF6',
              backgroundColor: 'rgba(139, 92, 246, 0.1)',
              color: '#A78BFA'
            }}
          >
            Base Sepolia
          </div>
          <ConnectButton />
        </div>
      </div>
    </div>
  )
}
