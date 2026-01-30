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
  onLogout,
}: GameHUDProps) {
  const shortAddress = useMemo(() => {
    if (!address) return ''
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }, [address])

  return (
    <div
      className="pointer-events-auto flex items-center gap-2 px-3 py-2 bg-slate-900/85 backdrop-blur-sm border-b-2 border-slate-700/80"
      style={pixelFont}
    >
      {/* Logo */}
      <h1
        className="text-amber-400 text-xs mr-3 flex-shrink-0"
        style={{ textShadow: '2px 2px 0px #92400E' }}
      >
        DEFICITY
      </h1>

      {/* Wallet Address */}
      <div className="bg-slate-800/60 border border-slate-700 px-2 py-1 flex-shrink-0">
        <span className="text-cyan-400 text-[7px]">{shortAddress}</span>
      </div>

      {/* Wallet Balances */}
      <div className="flex gap-1.5 text-[6px] flex-wrap flex-1 min-w-0">
        <span className="text-green-400">ETH:{parseFloat(ethBalance).toFixed(3)}</span>
        <span className="text-green-400">USDC:{parseFloat(usdcBalance).toFixed(0)}</span>
        <span className="text-green-400">USDT:{parseFloat(usdtBalance).toFixed(0)}</span>
        <span className="text-green-400">WBTC:{parseFloat(wbtcBalance).toFixed(4)}</span>
        <span className="text-green-400">LINK:{parseFloat(linkBalance).toFixed(0)}</span>
      </div>

      {/* Vault Balances (if has smart wallet) */}
      {hasSmartWallet && (
        <div className="flex gap-1.5 text-[6px] flex-wrap min-w-0 border-l border-slate-700 pl-2">
          <span className="text-amber-400 text-[5px] mr-1">VAULT:</span>
          <span className="text-amber-400">E:{parseFloat(smartWalletEthBalance).toFixed(3)}</span>
          <span className="text-amber-400">U:{parseFloat(smartWalletUsdcBalance).toFixed(0)}</span>
          <span className="text-amber-400">T:{parseFloat(smartWalletUsdtBalance).toFixed(0)}</span>
          <span className="text-amber-400">W:{parseFloat(smartWalletWbtcBalance).toFixed(4)}</span>
          <span className="text-amber-400">L:{parseFloat(smartWalletLinkBalance).toFixed(0)}</span>
        </div>
      )}

      {/* Vault Toggle */}
      {hasSmartWallet && (
        <button
          onClick={onToggleVault}
          className={`px-2 py-1 text-[7px] border-2 flex-shrink-0 transition-colors ${
            showVault
              ? 'bg-purple-600 border-purple-400 text-white'
              : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-purple-400'
          }`}
        >
          VAULT
        </button>
      )}

      {/* Exit */}
      <button
        onClick={onLogout}
        className="px-2 py-1 bg-red-600 border-2 border-red-400 text-white text-[7px] hover:bg-red-500 flex-shrink-0 transition-colors"
      >
        EXIT
      </button>
    </div>
  )
}
