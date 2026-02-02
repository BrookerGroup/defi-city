'use client'

import { useState } from 'react'
import { useAavePosition } from '@/hooks/useAavePosition'
import { ASSET_PRICES } from '@/config/aave'

interface TownHallInfoPanelProps {
  visible: boolean
  smartWallet: string | null
  smartWalletEthBalance: string
  smartWalletUsdcBalance: string
  smartWalletUsdtBalance: string
  smartWalletWbtcBalance: string
  smartWalletLinkBalance: string
  onClose: () => void
}

const pixelFont = { fontFamily: '"Press Start 2P", monospace' } as const

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`
}

export function TownHallInfoPanel({
  visible,
  smartWallet,
  smartWalletEthBalance,
  smartWalletUsdcBalance,
  smartWalletUsdtBalance,
  smartWalletWbtcBalance,
  smartWalletLinkBalance,
  onClose,
}: TownHallInfoPanelProps) {
  const [copied, setCopied] = useState(false)
  const { position } = useAavePosition(smartWallet)

  if (!visible) return null

  const vaultAssets = [
    { symbol: 'ETH', balance: smartWalletEthBalance, price: ASSET_PRICES.ETH },
    { symbol: 'USDC', balance: smartWalletUsdcBalance, price: ASSET_PRICES.USDC },
    { symbol: 'USDT', balance: smartWalletUsdtBalance, price: ASSET_PRICES.USDT },
    { symbol: 'WBTC', balance: smartWalletWbtcBalance, price: ASSET_PRICES.WBTC },
    { symbol: 'LINK', balance: smartWalletLinkBalance, price: ASSET_PRICES.LINK },
  ]

  // Vault balances total
  const vaultTotalUSD = vaultAssets.reduce((sum, a) => {
    const bal = parseFloat(a.balance) || 0
    return sum + bal * a.price
  }, 0)

  // Aave positions total
  const aaveSuppliedUSD = position?.totalSuppliedUSD ?? 0
  const aaveBorrowedUSD = position?.totalBorrowedUSD ?? 0
  const aaveNetUSD = aaveSuppliedUSD - aaveBorrowedUSD

  const totalPortfolioUSD = vaultTotalUSD + aaveNetUSD

  const handleCopy = async () => {
    if (!smartWallet) return
    await navigator.clipboard.writeText(smartWallet)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`pointer-events-auto absolute left-0 top-0 bottom-0 w-[400px] max-w-[90vw] bg-slate-900/92 backdrop-blur-sm border-r-2 border-amber-700 overflow-y-auto z-20 transition-transform duration-300 ${
        visible ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-amber-700 bg-amber-900/30">
        <p className="text-amber-400 text-[10px]" style={pixelFont}>
          TOWN HALL
        </p>
        <button
          onClick={onClose}
          className="w-8 h-8 bg-red-600 border-2 border-red-400 text-white flex items-center justify-center hover:bg-red-500 text-[10px]"
          style={pixelFont}
        >
          X
        </button>
      </div>

      <div className="p-4 space-y-4">
        {/* SmartWallet Address */}
        <div className="bg-slate-800/60 border border-amber-700/50 p-3">
          <p className="text-amber-400/70 text-[6px] mb-2" style={pixelFont}>
            SMARTWALLET ADDRESS
          </p>
          {smartWallet ? (
            <div className="flex items-center gap-2">
              <p className="text-amber-300 text-[8px] font-mono flex-1 break-all">
                {truncateAddress(smartWallet)}
              </p>
              <button
                onClick={handleCopy}
                className="px-2 py-1 bg-amber-700/50 border border-amber-600 text-amber-300 text-[7px] hover:bg-amber-700/80 shrink-0"
                style={pixelFont}
              >
                {copied ? 'COPIED!' : 'COPY'}
              </button>
            </div>
          ) : (
            <p className="text-slate-500 text-[8px]" style={pixelFont}>
              NOT CREATED
            </p>
          )}
        </div>

        {/* Total Portfolio Value */}
        <div className="bg-slate-800/60 border border-amber-700/50 p-3">
          <p className="text-amber-400/70 text-[6px] mb-2" style={pixelFont}>
            TOTAL PORTFOLIO VALUE
          </p>
          <p className="text-amber-300 text-[14px]" style={pixelFont}>
            ${totalPortfolioUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
        </div>

        {/* Vault Balances Breakdown */}
        <div className="bg-slate-800/60 border border-amber-700/50 p-3">
          <p className="text-amber-400/70 text-[6px] mb-2" style={pixelFont}>
            VAULT BALANCES
          </p>
          <div className="space-y-1.5">
            {vaultAssets.map((a) => {
              const bal = parseFloat(a.balance) || 0
              const usd = bal * a.price
              return (
                <div key={a.symbol} className="flex items-center justify-between">
                  <span className="text-slate-400 text-[7px]" style={pixelFont}>
                    {a.symbol}
                  </span>
                  <div className="text-right">
                    <span className="text-amber-300 text-[7px]" style={pixelFont}>
                      {bal > 0 ? bal.toFixed(a.symbol === 'WBTC' ? 6 : 4) : '0'}
                    </span>
                    <span className="text-slate-500 text-[6px] ml-2" style={pixelFont}>
                      (${usd.toFixed(2)})
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Aave Positions */}
        {position && (position.supplies.length > 0 || position.borrows.length > 0) && (
          <div className="bg-slate-800/60 border border-amber-700/50 p-3">
            <p className="text-amber-400/70 text-[6px] mb-2" style={pixelFont}>
              AAVE POSITIONS
            </p>
            {position.supplies.length > 0 && (
              <div className="mb-2">
                <p className="text-emerald-400/70 text-[6px] mb-1" style={pixelFont}>
                  SUPPLIED
                </p>
                {position.supplies.map((s: any) => (
                  <div key={s.asset} className="flex items-center justify-between">
                    <span className="text-slate-400 text-[7px]" style={pixelFont}>
                      {s.asset}
                    </span>
                    <div className="text-right">
                      <span className="text-emerald-300 text-[7px]" style={pixelFont}>
                        {s.amount.toFixed(4)}
                      </span>
                      <span className="text-slate-500 text-[6px] ml-2" style={pixelFont}>
                        (${s.amountUSD.toFixed(2)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {position.borrows.length > 0 && (
              <div>
                <p className="text-red-400/70 text-[6px] mb-1" style={pixelFont}>
                  BORROWED
                </p>
                {position.borrows.map((b: any) => (
                  <div key={b.asset} className="flex items-center justify-between">
                    <span className="text-slate-400 text-[7px]" style={pixelFont}>
                      {b.asset}
                    </span>
                    <div className="text-right">
                      <span className="text-red-300 text-[7px]" style={pixelFont}>
                        {b.amount.toFixed(4)}
                      </span>
                      <span className="text-slate-500 text-[6px] ml-2" style={pixelFont}>
                        (${b.amountUSD.toFixed(2)})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Self-custody notices */}
        <div className="bg-amber-900/20 border border-amber-700/40 p-3 space-y-2">
          <p className="text-amber-300 text-[7px] leading-relaxed" style={pixelFont}>
            This is YOUR SmartWallet - You own all assets
          </p>
          <p className="text-amber-400/60 text-[6px] leading-relaxed" style={pixelFont}>
            Assets are self-custodial (not held by game)
          </p>
        </div>

        {/* BaseScan Link */}
        {smartWallet && (
          <a
            href={`https://sepolia.basescan.org/address/${smartWallet}`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center py-2 bg-amber-700/40 border border-amber-600 text-amber-300 text-[7px] hover:bg-amber-700/60 transition-colors"
            style={pixelFont}
          >
            VIEW ON BASESCAN
          </a>
        )}
      </div>
    </div>
  )
}
