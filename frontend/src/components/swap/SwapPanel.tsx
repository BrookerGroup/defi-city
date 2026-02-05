'use client'

/**
 * SwapPanel - Token swap via Uniswap V3
 * Swaps use vault (Smart Wallet) balances
 */

import { useState, useMemo, useEffect } from 'react'
import type { SwapToken } from '@/hooks/useUniswapSwap'
import { ethers } from 'ethers'

const DECIMALS: Record<SwapToken, number> = {
  USDC: 6,
  USDT: 6,
  ETH: 18,
  WBTC: 8,
  LINK: 18,
}

const pixelFont = { fontFamily: '"Press Start 2P", monospace' } as const
const TOKENS: SwapToken[] = ['ETH', 'USDC', 'USDT', 'WBTC', 'LINK']

export interface SwapPanelProps {
  visible: boolean
  vaultBalances: Record<SwapToken, string>
  onSwap: (
    tokenIn: SwapToken,
    tokenOut: SwapToken,
    amountInRaw: bigint,
    amountOutMin: bigint,
    fee?: number
  ) => Promise<{ success: boolean; txHash?: string; error?: string }>
  onGetQuote: (
    tokenIn: SwapToken,
    tokenOut: SwapToken,
    amountInRaw: bigint
  ) => Promise<{ amountOut: bigint; amountOutMin: bigint; success: boolean; fee?: number }>
  loading: boolean
  error: string | null
  onClose?: () => void
  /** When true, render as tab content without panel chrome */
  embed?: boolean
}

export function SwapPanel({
  visible,
  vaultBalances,
  onSwap,
  onGetQuote,
  loading,
  error,
  onClose,
  embed = false,
}: SwapPanelProps) {
  const [tokenIn, setTokenIn] = useState<SwapToken>('USDC')
  const [tokenOut, setTokenOut] = useState<SwapToken>('ETH')
  const [amountIn, setAmountIn] = useState('')
  const [quoteOut, setQuoteOut] = useState<string | null>(null)

  const decIn = DECIMALS[tokenIn]
  const decOut = DECIMALS[tokenOut]
  const vaultBalanceIn = parseFloat(vaultBalances[tokenIn])

  const amountInRaw = useMemo(() => {
    if (!amountIn || isNaN(parseFloat(amountIn))) return 0n
    try {
      return ethers.parseUnits(amountIn, decIn)
    } catch {
      return 0n
    }
  }, [amountIn, decIn])

  const hasInsufficient = useMemo(() => {
    const amt = parseFloat(amountIn)
    return !isNaN(amt) && amt > 0 && amt > vaultBalanceIn
  }, [amountIn, vaultBalanceIn])

  useEffect(() => {
    if (amountInRaw === 0n || tokenIn === tokenOut) {
      setQuoteOut(null)
      return
    }
    let cancelled = false
    onGetQuote(tokenIn, tokenOut, amountInRaw).then((q) => {
      if (cancelled || !q.success) {
        setQuoteOut(null)
        return
      }
      setQuoteOut(ethers.formatUnits(q.amountOut, decOut))
    })
    return () => {
      cancelled = true
    }
  }, [amountInRaw, tokenIn, tokenOut, decOut, onGetQuote])

  const handleSwap = async () => {
    if (amountInRaw === 0n || tokenIn === tokenOut || hasInsufficient) return
    const quote = await onGetQuote(tokenIn, tokenOut, amountInRaw)
    if (!quote.success || quote.amountOutMin === 0n) {
      return
    }
    const result = await onSwap(
      tokenIn,
      tokenOut,
      amountInRaw,
      quote.amountOutMin,
      quote.fee ?? 3000
    )
    if (result.success) {
      setAmountIn('')
      setQuoteOut(null)
    }
  }

  const handleFlip = () => {
    setTokenIn(tokenOut)
    setTokenOut(tokenIn)
    setQuoteOut(null)
  }

  if (!visible) return null

  const content = (
    <div className="p-4 space-y-4">
        <p className="text-slate-500 text-[6px]" style={pixelFont}>
          SWAP FROM VAULT BALANCE
        </p>

        {/* From */}
        <div className="bg-slate-800/60 border border-slate-700 p-3">
          <div className="flex justify-between mb-2">
            <span className="text-slate-500 text-[6px]" style={pixelFont}>
              FROM
            </span>
            <span className="text-cyan-400 text-[6px]" style={pixelFont}>
              {tokenIn}: {vaultBalanceIn.toFixed(decIn === 18 ? 4 : decIn === 8 ? 6 : 2)}
            </span>
          </div>
          <div className="flex gap-2">
            <input
              type="number"
              value={amountIn}
              onChange={(e) => setAmountIn(e.target.value)}
              placeholder="0"
              className={`flex-1 bg-slate-900 border-2 p-2 text-white text-xs ${
                hasInsufficient ? 'border-red-500' : 'border-slate-600'
              }`}
              style={pixelFont}
            />
            <div className="flex gap-1 flex-wrap">
              {TOKENS.filter((t) => t !== tokenOut).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTokenIn(t)
                    setQuoteOut(null)
                  }}
                  className={`px-2 py-1 text-[6px] border ${
                    tokenIn === t
                      ? 'bg-amber-600 text-white border-amber-400'
                      : 'bg-slate-900 text-slate-500 border-slate-700'
                  }`}
                  style={pixelFont}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Flip */}
        <div className="flex justify-center">
          <button
            onClick={handleFlip}
            className="w-10 h-10 bg-slate-800 border-2 border-slate-600 text-slate-400 hover:bg-slate-700 flex items-center justify-center"
            style={pixelFont}
          >
            ⇅
          </button>
        </div>

        {/* To */}
        <div className="bg-slate-800/60 border border-slate-700 p-3">
          <div className="flex justify-between mb-2">
            <span className="text-slate-500 text-[6px]" style={pixelFont}>
              TO
            </span>
            {quoteOut && (
              <span className="text-green-400 text-[6px]" style={pixelFont}>
                ~{parseFloat(quoteOut).toFixed(decOut === 18 ? 4 : decOut === 8 ? 6 : 2)} {tokenOut}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <div className="flex-1 bg-slate-900 border-2 border-slate-600 p-2 text-slate-400 text-xs min-h-[40px] flex items-center" style={pixelFont}>
              {quoteOut
                ? parseFloat(quoteOut).toFixed(decOut === 18 ? 4 : decOut === 8 ? 6 : 2)
                : '—'}
            </div>
            <div className="flex gap-1 flex-wrap">
              {TOKENS.filter((t) => t !== tokenIn).map((t) => (
                <button
                  key={t}
                  onClick={() => {
                    setTokenOut(t)
                    setQuoteOut(null)
                  }}
                  className={`px-2 py-1 text-[6px] border ${
                    tokenOut === t
                      ? 'bg-amber-600 text-white border-amber-400'
                      : 'bg-slate-900 text-slate-500 border-slate-700'
                  }`}
                  style={pixelFont}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <p className="text-red-500 text-[6px]" style={pixelFont}>
            {error.slice(0, 80)}
          </p>
        )}

        <button
          onClick={handleSwap}
          disabled={
            loading ||
            hasInsufficient ||
            !amountIn ||
            parseFloat(amountIn) <= 0 ||
            tokenIn === tokenOut ||
            !quoteOut
          }
          className={`w-full py-3 border-4 text-white text-[8px] ${
            hasInsufficient || !quoteOut
              ? 'bg-slate-700 border-slate-600'
              : 'bg-amber-600 border-amber-400 hover:bg-amber-500'
          } disabled:opacity-50`}
          style={pixelFont}
        >
          {loading
            ? 'SWAPPING...'
            : hasInsufficient
              ? `INSUFFICIENT ${tokenIn}`
              : tokenIn === tokenOut
                ? 'SAME TOKEN'
                : !quoteOut
                  ? 'NO LIQUIDITY / ENTER AMOUNT'
                  : 'SWAP'}
        </button>

        <p className="text-slate-600 text-[5px]" style={pixelFont}>
          10% slippage • Try smaller amount if swap fails
        </p>
    </div>
  )

  if (embed) return content

  return (
    <div className="pointer-events-auto absolute right-0 top-0 bottom-0 w-[360px] max-w-[90vw] bg-slate-900/92 backdrop-blur-sm border-l-2 border-slate-700 overflow-y-auto z-20">
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-slate-700 bg-slate-800/60">
        <h3 className="text-[10px] text-amber-400" style={pixelFont}>
          SWAP (Uniswap V3)
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="w-7 h-7 bg-red-600 border-2 border-red-400 text-white flex items-center justify-center hover:bg-red-500 text-[8px]"
            style={pixelFont}
          >
            X
          </button>
        )}
      </div>
      {content}
    </div>
  )
}
