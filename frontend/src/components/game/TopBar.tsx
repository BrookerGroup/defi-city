'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useSmartWallet } from '@/hooks/useContracts'
import { formatEther } from 'viem'
import { ConnectButton } from '@/components/wallet'
import { Copy } from 'lucide-react'
import { useState } from 'react'

export function TopBar() {
  const { user, authenticated } = usePrivy()
  const eoaAddress = user?.wallet?.address
  const { smartWallet, loading: walletLoading } = useSmartWallet(eoaAddress)
  const [copied, setCopied] = useState(false)

  const copyAddress = () => {
    if (smartWallet) {
      navigator.clipboard.writeText(smartWallet)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
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

        {/* Smart Wallet Address */}
        {authenticated && smartWallet && (
          <div className="flex items-center gap-2">
            <div
              className="flex items-center gap-2 px-3 py-1.5 border-2 cursor-pointer hover:brightness-110 transition-all"
              style={{
                borderColor: '#8B5CF6',
                backgroundColor: 'rgba(139, 92, 246, 0.1)',
              }}
              onClick={copyAddress}
              title="Click to copy Smart Wallet address"
            >
              <span className="text-purple-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
                WALLET
              </span>
              <span className="font-mono text-xs text-purple-300">
                {formatAddress(smartWallet)}
              </span>
              <Copy className="h-3 w-3 text-purple-400" />
            </div>
            {copied && (
              <span className="text-xs text-emerald-400" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
                Copied!
              </span>
            )}
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
