'use client'

/**
 * GameHUD - Top bar overlay for the game
 * Shows: Logo | Wallet address | Token balances | Vault toggle | Exit
 */

import { useMemo } from 'react'

interface GameHUDProps {
  address?: string
  ethBalance: string
  usdcBalance: string
  usdtBalance: string
  wbtcBalance: string
  linkBalance: string
  smartWalletEthBalance: string
  smartWalletUsdcBalance: string
  smartWalletUsdtBalance: string
  smartWalletWbtcBalance: string
  smartWalletLinkBalance: string
  hasSmartWallet: boolean
  showVault: boolean
  onToggleVault: () => void
  showHistory: boolean
  onToggleHistory: () => void
  onLogout: () => void
}

const pixelFont = { fontFamily: '"Press Start 2P", monospace' } as const

export function GameHUD({
  address,
  ethBalance,
  usdcBalance,
  usdtBalance,
  wbtcBalance,
  linkBalance,
  smartWalletEthBalance,
  smartWalletUsdcBalance,
  smartWalletUsdtBalance,
  smartWalletWbtcBalance,
  smartWalletLinkBalance,
  hasSmartWallet,
  showVault,
  onToggleVault,
  showHistory,
  onToggleHistory,
  onLogout,
}: GameHUDProps) {
  const shortAddress = useMemo(() => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }, [address])

  return (
    <div
      className="pointer-events-auto flex items-center justify-between gap-4 px-4 py-2.5 bg-slate-900/90 backdrop-blur-sm border-b-2 border-slate-700"
      style={pixelFont}
    >
      {/* Left: Logo */}
      <h1
        className="text-white text-sm flex-shrink-0"
        style={{ textShadow: '2px 2px 0px #1e293b' }}
      >
        DEFICITY
      </h1>

      {/* Right: DEPOSIT (primary) + Wallet + VAULT + HISTORY + EXIT */}
      <div className="flex items-center gap-3">
        {/* DEPOSIT - primary blue button (opens Vault) */}
        {hasSmartWallet && (
          <button
            onClick={onToggleVault}
            className={`px-4 py-1.5 text-[8px] font-bold border-2 flex-shrink-0 transition-colors ${
              showVault
                ? 'bg-blue-600 border-blue-400 text-white'
                : 'bg-blue-600 border-blue-400 text-white hover:bg-blue-500 hover:border-blue-300'
            }`}
          >
            DEPOSIT
          </button>
        )}

        {/* Wallet Address - white box */}
        <div className="bg-white/95 border border-slate-300 px-3 py-1.5 flex-shrink-0">
          <span className="text-slate-800 text-[7px] font-mono">{shortAddress || '—'}</span>
        </div>

        {/* HISTORY */}
        {hasSmartWallet && (
          <button
            onClick={onToggleHistory}
            className={`px-2 py-1 text-[6px] border border-slate-600 flex-shrink-0 transition-colors ${
              showHistory ? 'bg-slate-700 text-green-300' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            HISTORY
          </button>
        )}

        {/* EXIT */}
        <button
          onClick={onLogout}
          className="px-2 py-1 bg-red-600 border-2 border-red-500 text-white text-[6px] hover:bg-red-500 flex-shrink-0"
        >
          EXIT
        </button>
      </div>
    </div>
  )
}
