'use client'

/**
 * VaultPanel - Right side panel for vault deposit/withdraw/swap
 * Extracts vault management logic from page.tsx
 */

import { useState, useMemo } from 'react'
import type { TokenType } from '@/hooks'
import type { SwapToken } from '@/hooks/useUniswapSwap'
import { SwapPanel } from '@/components/swap/SwapPanel'

interface VaultPanelProps {
  visible: boolean
  address?: string
  ethBalance: string
  usdcBalance: string
  usdtBalance: string
  wbtcBalance: string
  linkBalance: string
  mpusdcBalance: string
  smartWallet: string | null
  smartWalletEthBalance: string
  smartWalletWethBalance: string
  smartWalletUsdcBalance: string
  smartWalletUsdtBalance: string
  smartWalletWbtcBalance: string
  smartWalletLinkBalance: string
  smartWalletMpusdcBalance: string
  onDeposit: (token: TokenType, amount: string) => Promise<void>
  onWithdraw: (token: TokenType, amount: string) => Promise<void>
  isDepositing: boolean
  isWithdrawing: boolean
  onClose: () => void
  // Swap (optional - when provided, Swap tab is shown)
  onSwap?: (
    tokenIn: SwapToken,
    tokenOut: SwapToken,
    amountInRaw: bigint,
    amountOutMin: bigint,
    fee?: number
  ) => Promise<{ success: boolean; txHash?: string; error?: string }>
  onGetQuote?: (
    tokenIn: SwapToken,
    tokenOut: SwapToken,
    amountInRaw: bigint
  ) => Promise<{ amountOut: bigint; amountOutMin: bigint; success: boolean }>
  swapLoading?: boolean
  swapError?: string | null
}

const pixelFont = { fontFamily: '"Press Start 2P", monospace' } as const
const TOKENS: TokenType[] = ['ETH', 'USDC', 'USDT', 'WBTC', 'LINK', 'MPUSDC']

export function VaultPanel({
  visible,
  address,
  ethBalance,
  usdcBalance,
  usdtBalance,
  wbtcBalance,
  linkBalance,
  mpusdcBalance,
  smartWallet,
  smartWalletEthBalance,
  smartWalletWethBalance,
  smartWalletUsdcBalance,
  smartWalletUsdtBalance,
  smartWalletWbtcBalance,
  smartWalletLinkBalance,
  smartWalletMpusdcBalance,
  onDeposit,
  onWithdraw,
  isDepositing,
  isWithdrawing,
  onClose,
  onSwap,
  onGetQuote,
  swapLoading = false,
  swapError = null,
}: VaultPanelProps) {
  const [activeTab, setActiveTab] = useState<'deposit' | 'withdraw' | 'swap'>('deposit')
  const hasSwap = Boolean(onSwap && onGetQuote)
  const [selectedToken, setSelectedToken] = useState<TokenType>('ETH')
  const [withdrawToken, setWithdrawToken] = useState<TokenType>('ETH')
  const [depositAmount, setDepositAmount] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')

  const walletBalances: Record<TokenType, string> = {
    ETH: ethBalance,
    USDC: usdcBalance,
    USDT: usdtBalance,
    WBTC: wbtcBalance,
    LINK: linkBalance,
    MPUSDC: mpusdcBalance,
  }

  const vaultBalances: Record<TokenType, string> = {
    ETH: smartWalletEthBalance,
    USDC: smartWalletUsdcBalance,
    USDT: smartWalletUsdtBalance,
    WBTC: smartWalletWbtcBalance,
    LINK: smartWalletLinkBalance,
    MPUSDC: smartWalletMpusdcBalance,
  }

  const currentWalletBalance = useMemo(
    () => parseFloat(walletBalances[selectedToken]),
    [selectedToken, walletBalances],
  )

  const currentVaultBalance = useMemo(
    () => parseFloat(vaultBalances[withdrawToken]),
    [withdrawToken, vaultBalances],
  )

  const hasInsufficientDeposit = useMemo(() => {
    const amt = parseFloat(depositAmount)
    return !isNaN(amt) && amt > 0 && amt > currentWalletBalance
  }, [depositAmount, currentWalletBalance])

  const hasInsufficientWithdraw = useMemo(() => {
    const amt = parseFloat(withdrawAmount)
    return !isNaN(amt) && amt > 0 && amt > currentVaultBalance
  }, [withdrawAmount, currentVaultBalance])

  if (!visible) return null

  return (
    <div className="pointer-events-auto absolute right-0 top-0 bottom-0 w-[360px] max-w-[90vw] bg-slate-900/92 backdrop-blur-sm border-l-2 border-slate-700 overflow-y-auto z-20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-slate-700 bg-slate-800/60">
        <h3
          className={`text-[10px] ${
            activeTab === 'deposit' ? 'text-blue-400' : activeTab === 'withdraw' ? 'text-purple-400' : 'text-amber-400'
          }`}
          style={pixelFont}
        >
          VAULT MGMT
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-900 p-0.5 border border-slate-700">
            <button
              onClick={() => setActiveTab('deposit')}
              className={`px-2 py-1 text-[7px] ${
                activeTab === 'deposit' ? 'bg-blue-600 text-white' : 'text-slate-500'
              }`}
              style={pixelFont}
            >
              DEPOSIT
            </button>
            <button
              onClick={() => setActiveTab('withdraw')}
              className={`px-2 py-1 text-[7px] ${
                activeTab === 'withdraw' ? 'bg-purple-600 text-white' : 'text-slate-500'
              }`}
              style={pixelFont}
            >
              WITHDRAW
            </button>
            {hasSwap && (
              <button
                onClick={() => setActiveTab('swap')}
                className={`px-2 py-1 text-[7px] ${
                  activeTab === 'swap' ? 'bg-amber-600 text-white' : 'text-slate-500'
                }`}
                style={pixelFont}
              >
                SWAP
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 bg-red-600 border-2 border-red-400 text-white flex items-center justify-center hover:bg-red-500 text-[8px]"
            style={pixelFont}
          >
            X
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {activeTab === 'swap' && onSwap && onGetQuote ? (
          <>
            <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>
              SWAP FROM VAULT
            </p>
            <p className="text-amber-400 text-[6px] mb-2 truncate" style={pixelFont} title={smartWallet ?? undefined}>
              {smartWallet ? `${smartWallet.slice(0, 6)}...${smartWallet.slice(-4)}` : '—'}
            </p>
            <SwapPanel
              visible
              embed
              vaultBalances={{
                ETH: smartWalletWethBalance,
                USDC: smartWalletUsdcBalance,
                USDT: smartWalletUsdtBalance,
                WBTC: smartWalletWbtcBalance,
                LINK: smartWalletLinkBalance,
              }}
              onSwap={onSwap}
              onGetQuote={onGetQuote}
            loading={swapLoading}
            error={swapError}
          />
          </>
        ) : activeTab === 'deposit' ? (
          <>
            {/* Wallet balance display */}
            <div className="bg-slate-800/60 border border-slate-700 p-3">
              <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>
                YOUR WALLET (EOA)
              </p>
              <p className="text-cyan-400 text-[6px] mb-2 truncate" style={pixelFont}>
                {address}
              </p>
              <div className="flex flex-wrap gap-1 text-[6px]" style={pixelFont}>
                {TOKENS.map(t => (
                  <span key={t} className="text-green-400">
                    {t}:{parseFloat(walletBalances[t]).toFixed(t === 'ETH' ? 4 : t === 'WBTC' ? 6 : 2)}
                  </span>
                ))}
              </div>
            </div>

            {/* Token selector */}
            <div className="flex gap-1">
              {TOKENS.map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedToken(t)}
                  className={`flex-1 py-2 border-2 text-[7px] ${
                    selectedToken === t
                      ? 'bg-blue-600 text-white border-blue-400'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                  style={pixelFont}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Amount input */}
            <div className="relative">
              <input
                type="number"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full bg-slate-900 border-2 p-3 pr-14 text-white text-xs ${
                  hasInsufficientDeposit ? 'border-red-500' : 'border-slate-700'
                }`}
                style={pixelFont}
              />
              <button
                onClick={() => setDepositAmount(currentWalletBalance.toString())}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-blue-600 text-white text-[6px] hover:bg-blue-500"
                style={pixelFont}
              >
                MAX
              </button>
            </div>

            {hasInsufficientDeposit && (
              <p className="text-red-500 text-[7px]" style={pixelFont}>
                INSUFFICIENT {selectedToken} BALANCE
              </p>
            )}

            <button
              onClick={() => onDeposit(selectedToken, depositAmount).then(() => setDepositAmount(''))}
              disabled={isDepositing || hasInsufficientDeposit || !depositAmount || parseFloat(depositAmount) <= 0}
              className={`w-full py-3 border-4 text-white text-[8px] ${
                hasInsufficientDeposit ? 'bg-slate-700 border-slate-600' : 'bg-blue-600 border-blue-400 hover:bg-blue-500'
              } disabled:opacity-50`}
              style={pixelFont}
            >
              {isDepositing ? 'DEPOSITING...' : hasInsufficientDeposit ? `INSUFFICIENT ${selectedToken}` : 'DEPOSIT TO VAULT'}
            </button>
          </>
        ) : (
          <>
            {/* Vault balance display */}
            <div className="bg-slate-800/60 border border-slate-700 p-3">
              <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>
                VAULT (SMART WALLET)
              </p>
              <div className="flex items-center gap-2">
                <p className="text-amber-400 text-[6px] truncate flex-1" style={pixelFont}>
                  {smartWallet}
                </p>
                <button
                  onClick={async () => {
                    if (smartWallet) {
                      await navigator.clipboard.writeText(smartWallet)
                    }
                  }}
                  className="px-2 py-1 bg-amber-700/50 border border-amber-600 text-amber-300 text-[6px] hover:bg-amber-700/80 shrink-0"
                  style={pixelFont}
                >
                  COPY
                </button>
              </div>
              <div className="flex flex-wrap gap-1 text-[6px] mt-2" style={pixelFont}>
                {TOKENS.map(t => (
                  <span key={t} className="text-purple-400">
                    {t}:{parseFloat(vaultBalances[t]).toFixed(t === 'ETH' ? 4 : t === 'WBTC' ? 6 : 2)}
                  </span>
                ))}
              </div>
            </div>

            {/* Token selector */}
            <div className="flex gap-1">
              {TOKENS.map(t => (
                <button
                  key={t}
                  onClick={() => setWithdrawToken(t)}
                  className={`flex-1 py-2 border-2 text-[7px] ${
                    withdrawToken === t
                      ? 'bg-purple-600 text-white border-purple-400'
                      : 'bg-slate-900 text-slate-400 border-slate-700'
                  }`}
                  style={pixelFont}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* Amount input */}
            <div className="relative">
              <input
                type="number"
                value={withdrawAmount}
                onChange={e => setWithdrawAmount(e.target.value)}
                placeholder="0.00"
                className={`w-full bg-slate-900 border-2 p-3 pr-14 text-white text-xs ${
                  hasInsufficientWithdraw ? 'border-red-500' : 'border-slate-700'
                }`}
                style={pixelFont}
              />
              <button
                onClick={() => setWithdrawAmount(currentVaultBalance.toString())}
                className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-1 bg-purple-600 text-white text-[6px] hover:bg-purple-500"
                style={pixelFont}
              >
                MAX
              </button>
            </div>

            {hasInsufficientWithdraw && (
              <p className="text-red-500 text-[7px]" style={pixelFont}>
                INSUFFICIENT {withdrawToken} IN VAULT
              </p>
            )}

            <button
              onClick={() => onWithdraw(withdrawToken, withdrawAmount).then(() => setWithdrawAmount(''))}
              disabled={isWithdrawing || hasInsufficientWithdraw || !withdrawAmount || parseFloat(withdrawAmount) <= 0}
              className={`w-full py-3 border-4 text-white text-[8px] ${
                hasInsufficientWithdraw ? 'bg-slate-700 border-slate-600' : 'bg-purple-600 border-purple-400 hover:bg-purple-500'
              } disabled:opacity-50`}
              style={pixelFont}
            >
              {isWithdrawing ? 'WITHDRAWING...' : hasInsufficientWithdraw ? `NOT ENOUGH ${withdrawToken}` : 'WITHDRAW TO WALLET'}
            </button>
          </>
        )}

        {/* Notices & Self-Custody Info */}
        <div className="pt-4 mt-4 border-t border-slate-700 space-y-4">
          <div className="bg-slate-800/40 p-3 border border-slate-700/50">
            <p className="text-amber-400/80 text-[6px] leading-relaxed mb-2" style={pixelFont}>
              ℹ️ WITHDRAWAL NOTICE
            </p>
            <p className="text-slate-400 text-[6px] leading-relaxed" style={pixelFont}>
              You can only withdraw funds that are currently IDLE in your Smart Wallet. 
            </p>
            <p className="text-slate-500 text-[5px] mt-1 leading-relaxed" style={pixelFont}>
              If your funds are invested in buildings (Aave), you must DEMOLISH those buildings first to make the funds available for withdrawal.
            </p>
          </div>

          <div className="bg-blue-900/20 p-3 border border-blue-800/30">
            <p className="text-blue-400/80 text-[6px] leading-relaxed mb-2" style={pixelFont}>
              🔐 TRUE SELF-CUSTODY
            </p>
            <p className="text-slate-400 text-[6px] leading-relaxed mb-3" style={pixelFont}>
              Your assets belong to YOU. You can withdraw your funds directly from your Smart Wallet anytime, even without using this game UI.
            </p>
            {smartWallet && (
              <a
                href={`https://sepolia.basescan.org/address/${smartWallet}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-blue-400 text-[6px] underline hover:text-blue-300"
                style={pixelFont}
              >
                VIEW ON BASESCAN ↗
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
