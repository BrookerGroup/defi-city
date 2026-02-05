'use client'

/**
 * LPPanel - Uniswap V3 Provide Liquidity
 */

import { useState, useEffect, useCallback } from 'react'
import { ethers } from 'ethers'
import {
  useUniswapLP,
  nearestUsableTick,
  sortTokens,
  type PoolInfo,
} from '@/hooks/useUniswapLP'
import { ADDRESSES } from '@/config/contracts'

const TOKENS = [
  { symbol: 'USDC', address: ADDRESSES.USDC, decimals: 6 },
  { symbol: 'WETH', address: ADDRESSES.ETH, decimals: 18 },
  { symbol: 'USDT', address: ADDRESSES.USDT, decimals: 6 },
] as const

const pixelFont = { fontFamily: '"Press Start 2P", monospace' } as const

export interface LPPanelProps {
  visible: boolean
  smartWallet: string | null
  vaultBalances: Record<string, string>
  onSuccess?: () => void
  onClose?: () => void
}

export function LPPanel({
  visible,
  smartWallet,
  vaultBalances,
  onSuccess,
  onClose,
}: LPPanelProps) {
  const {
    getPoolInfo,
    mint,
    loading,
    error,
    setError,
    FEE_TIERS,
    TICK_SPACING,
  } = useUniswapLP(smartWallet)

  const [token0, setToken0] = useState<string>(TOKENS[0].address)
  const [token1, setToken1] = useState<string>(TOKENS[1].address)
  const [fee, setFee] = useState(3000)
  const [amount0, setAmount0] = useState('')
  const [amount1, setAmount1] = useState('')
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null)
  const [rangePercent, setRangePercent] = useState(5)

  const fetchPoolInfo = useCallback(async () => {
    const [t0, t1] = sortTokens(token0, token1)
    const info = await getPoolInfo(t0, t1, fee)
    setPoolInfo(info)
  }, [token0, token1, fee, getPoolInfo])

  useEffect(() => {
    if (visible && token0 !== token1) {
      fetchPoolInfo()
    } else {
      setPoolInfo(null)
    }
  }, [visible, token0, token1, fee, fetchPoolInfo])

  const tickLower = poolInfo
    ? nearestUsableTick(
        poolInfo.currentTick - Math.floor((rangePercent / 100) / 0.0001),
        TICK_SPACING[fee] ?? 60
      )
    : 0
  const tickUpper = poolInfo
    ? nearestUsableTick(
        poolInfo.currentTick + Math.floor((rangePercent / 100) / 0.0001),
        TICK_SPACING[fee] ?? 60
      )
    : 0

  const handleMint = async () => {
    if (!poolInfo?.exists || !amount0 || !amount1) return
    const amt0 = ethers.parseUnits(amount0, TOKENS.find((t) => t.address === poolInfo.token0)?.decimals ?? 18)
    const amt1 = ethers.parseUnits(amount1, TOKENS.find((t) => t.address === poolInfo.token1)?.decimals ?? 18)
    if (amt0 === 0n && amt1 === 0n) return

    const amount0Min = (amt0 * 95n) / 100n
    const amount1Min = (amt1 * 95n) / 100n

    const result = await mint(
      poolInfo.token0,
      poolInfo.token1,
      fee,
      tickLower,
      tickUpper,
      amt0,
      amt1,
      amount0Min,
      amount1Min
    )
    if (result.success) {
      setAmount0('')
      setAmount1('')
      onSuccess?.()
    }
  }

  const sym0 = TOKENS.find((t) => t.address.toLowerCase() === token0.toLowerCase())?.symbol ?? '?'
  const sym1 = TOKENS.find((t) => t.address.toLowerCase() === token1.toLowerCase())?.symbol ?? '?'

  if (!visible) return null

  return (
    <div className="bg-slate-900/95 border-2 border-slate-600 p-4 rounded">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-sm text-cyan-400" style={pixelFont}>
          UNISWAP V3 LP
        </h3>
        {onClose && (
          <button onClick={onClose} className="text-slate-400 hover:text-white" style={pixelFont}>
            X
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-400 text-[10px] mb-2" style={pixelFont}>
          {error}
        </p>
      )}

      <div className="space-y-3">
        <div>
          <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>TOKEN 0</p>
          <select
            value={token0}
            onChange={(e) => setToken0(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 p-2 text-white text-[10px]"
            style={pixelFont}
          >
            {TOKENS.filter((t) => t.address !== token1).map((t) => (
              <option key={t.address} value={t.address}>
                {t.symbol} (Bal: {parseFloat(vaultBalances[t.symbol] ?? '0').toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>TOKEN 1</p>
          <select
            value={token1}
            onChange={(e) => setToken1(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 p-2 text-white text-[10px]"
            style={pixelFont}
          >
            {TOKENS.filter((t) => t.address !== token0).map((t) => (
              <option key={t.address} value={t.address}>
                {t.symbol} (Bal: {parseFloat(vaultBalances[t.symbol] ?? '0').toFixed(2)})
              </option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>FEE TIER</p>
          <div className="flex gap-1">
            {FEE_TIERS.map((f) => (
              <button
                key={f}
                onClick={() => setFee(f)}
                className={`flex-1 py-2 border text-[8px] ${
                  fee === f ? 'bg-cyan-600 border-cyan-400' : 'bg-slate-800 border-slate-600'
                }`}
                style={pixelFont}
              >
                {f === 500 ? '0.05%' : f === 3000 ? '0.3%' : '1%'}
              </button>
            ))}
          </div>
        </div>

        {poolInfo && (
          <>
            <p className="text-slate-500 text-[6px]" style={pixelFont}>
              Pool: {poolInfo.exists ? `Tick ${poolInfo.currentTick}` : 'Not exists'}
            </p>
            <div>
              <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>
                RANGE ±{rangePercent}%
              </p>
              <input
                type="range"
                min="1"
                max="20"
                value={rangePercent}
                onChange={(e) => setRangePercent(Number(e.target.value))}
                className="w-full"
              />
              <p className="text-[6px] text-slate-400" style={pixelFont}>
                Lower: {tickLower} Upper: {tickUpper}
              </p>
            </div>
          </>
        )}

        <div>
          <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>AMOUNT {sym0}</p>
          <input
            type="number"
            value={amount0}
            onChange={(e) => setAmount0(e.target.value)}
            placeholder="0"
            className="w-full bg-slate-800 border border-slate-600 p-2 text-white text-xs"
            style={pixelFont}
          />
        </div>
        <div>
          <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>AMOUNT {sym1}</p>
          <input
            type="number"
            value={amount1}
            onChange={(e) => setAmount1(e.target.value)}
            placeholder="0"
            className="w-full bg-slate-800 border border-slate-600 p-2 text-white text-xs"
            style={pixelFont}
          />
        </div>

        <button
          onClick={handleMint}
          disabled={
            loading ||
            !poolInfo?.exists ||
            !amount0 ||
            !amount1 ||
            (parseFloat(amount0) <= 0 && parseFloat(amount1) <= 0)
          }
          className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 border-2 border-cyan-400 text-white text-[10px]"
          style={pixelFont}
        >
          {loading ? 'MINTING...' : 'PROVIDE LP'}
        </button>
      </div>

      <p className="text-slate-500 text-[6px] mt-2" style={pixelFont}>
        LP NFT goes to vault (Smart Wallet)
      </p>
    </div>
  )
}
