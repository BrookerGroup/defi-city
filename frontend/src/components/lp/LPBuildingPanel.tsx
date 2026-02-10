'use client'

import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { ethers } from 'ethers'
import { toast } from 'react-hot-toast'
import { ADDRESSES, BLOCK_EXPLORER_URL } from '@/config/contracts'
import {
  useUniswapLP,
  floorTick,
  ceilTick,
  sortTokens,
  tickToPriceToken1PerToken0,
  tickToPriceToken0PerToken1,
  tickToDisplayPrice,
  formatPriceForInput,
  priceToTick,
  MIN_TICK,
  MAX_TICK,
} from '@/hooks/useUniswapLP'
import { useUniswapLPBuild } from '@/hooks/useUniswapLPBuild'
import { useUniswapLPManage } from '@/hooks/useUniswapLPManage'
import type { Building } from '@/hooks/useCityBuildings'

const TOKENS = [
  { symbol: 'USDC', address: ADDRESSES.USDC, decimals: 6, icon: '$' },
  { symbol: 'WETH', address: ADDRESSES.ETH, decimals: 18, icon: 'Ξ' },
  { symbol: 'USDT', address: ADDRESSES.USDT, decimals: 6, icon: '$' },
] as const

const pixelFont = { fontFamily: '"Press Start 2P", monospace' } as const

interface LPBuildingPanelProps {
  smartWallet: string | null
  userAddress?: string
  selectedCoords: { x: number; y: number }
  selectedBuilding: Building | null
  vaultBalances: Record<string, string>
  onRefetchBalances?: () => void
  onSuccess: () => void
}

export function LPBuildingPanel({
  smartWallet,
  userAddress,
  selectedCoords,
  selectedBuilding,
  vaultBalances,
  onRefetchBalances,
  onSuccess,
}: LPBuildingPanelProps) {
  const { getPoolInfo, createPoolAndInitialize, FEE_TIERS, TICK_SPACING } = useUniswapLP(smartWallet)
  const { placeLPBuilding, loading, error, setError } = useUniswapLPBuild()
  const {
    getPositionByBuildingId,
    harvest,
    demolish,
    linkPosition,
    increaseLiquidity,
    decreaseLiquidity,
    loading: manageLoading,
    error: manageError,
    setError: setManageError,
  } = useUniswapLPManage()

  const [tokenA, setTokenA] = useState<string>(TOKENS[0].address)
  const [tokenB, setTokenB] = useState<string>(TOKENS[1].address)
  const [fee, setFee] = useState(3000)
  const [tickLower, setTickLower] = useState<number | null>(null)
  const [tickUpper, setTickUpper] = useState<number | null>(null)
  const [minPriceInput, setMinPriceInput] = useState<string>('')
  const [maxPriceInput, setMaxPriceInput] = useState<string>('')
  const [zoomPct, setZoomPct] = useState<number>(20)
  const [quoteToken1PerToken0, setQuoteToken1PerToken0] = useState<boolean>(true)
  const [draggingHandle, setDraggingHandle] = useState<'min' | 'max' | null>(null)
  const rangeTrackRef = useRef<HTMLDivElement>(null)
  const rangeParamsRef = useRef<{
    lo: number
    hi: number
    span: number
    applyTicks: (tl: number, tu: number) => void
    otherTick: number
  } | null>(null)
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')
  const [poolInfo, setPoolInfo] = useState<any>(null)
  const [position, setPosition] = useState<Awaited<ReturnType<typeof getPositionByBuildingId>>>(null)
  const [positionLoading, setPositionLoading] = useState(false)
  const [incAmount0, setIncAmount0] = useState('')
  const [incAmount1, setIncAmount1] = useState('')
  const [decLiquidity, setDecLiquidity] = useState('')
  const [linkTokenId, setLinkTokenId] = useState('')

  const fetchPoolInfo = useCallback(async () => {
    const [t0, t1] = sortTokens(tokenA, tokenB)
    const info = await getPoolInfo(t0, t1, fee)
    setPoolInfo(info)
  }, [tokenA, tokenB, fee, getPoolInfo])

  useEffect(() => {
    if (tokenA !== tokenB) fetchPoolInfo()
  }, [tokenA, tokenB, fee, fetchPoolInfo])

  useEffect(() => {
    if (!selectedBuilding || selectedBuilding.type !== 'lp') {
      setPosition(null)
      setPositionLoading(false)
      return
    }
    let cancelled = false
    setPositionLoading(true)
    setPosition(null)
    getPositionByBuildingId(selectedBuilding.id).then((p) => {
      if (!cancelled) {
        setPosition(p)
        setPositionLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [selectedBuilding?.id, selectedBuilding?.type, getPositionByBuildingId])

  const tickSpacing = poolInfo?.tickSpacing ?? TICK_SPACING[fee] ?? 60
  const tok0 = poolInfo ? TOKENS.find((t) => t.address.toLowerCase() === poolInfo.token0?.toLowerCase()) : null
  const tok1 = poolInfo ? TOKENS.find((t) => t.address.toLowerCase() === poolInfo.token1?.toLowerCase()) : null
  const dec0 = tok0?.decimals ?? 18
  const dec1 = tok1?.decimals ?? 6
  const sym0 = tok0?.symbol ?? 'T0'
  const sym1 = tok1?.symbol ?? 'T1'
  const currentDisplay = poolInfo ? tickToDisplayPrice(poolInfo.currentTick, dec0, dec1) : { value: 0, token1PerToken0: true }

  // Keep quote direction stable (avoid "flipping" between token0/token1 when values cross readability thresholds)
  useEffect(() => {
    if (!poolInfo?.exists) return
    setQuoteToken1PerToken0(currentDisplay.token1PerToken0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolInfo?.poolAddress])

  // When switching pools, reset range to a sensible default
  useEffect(() => {
    if (!poolInfo?.poolAddress) return
    setTickLower(null)
    setTickUpper(null)
    setMinPriceInput('')
    setMaxPriceInput('')
  }, [poolInfo?.poolAddress])

  const priceLabel = quoteToken1PerToken0 ? `${sym0}/${sym1}` : `${sym1}/${sym0}`

  function tickToQuotePrice(tick: number): number {
    return quoteToken1PerToken0
      ? tickToPriceToken1PerToken0(tick, dec0, dec1)
      : tickToPriceToken0PerToken1(tick, dec0, dec1)
  }

  function displayPriceToTick(displayValue: number, token1PerToken0: boolean): number {
    const price = token1PerToken0 ? displayValue : 1 / (displayValue || 1e-18)
    return priceToTick(price, dec0, dec1)
  }

  const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

  const formatPlain = (value: number): string => {
    if (!Number.isFinite(value) || value <= 0) return ''
    if (value >= 1) return value.toFixed(value >= 1000 ? 2 : 4).replace(/\.?0+$/, '')
    if (value >= 0.0001) return value.toFixed(6).replace(/0+$/, '').replace(/\.$/, '')
    return value.toExponential(6)
  }

  const parsePlain = (s: string): number => {
    const cleaned = (s ?? '').toString().replace(/,/g, '').trim()
    const v = parseFloat(cleaned)
    return Number.isFinite(v) ? v : NaN
  }

  const applyTicks = useCallback((tlRaw: number, tuRaw: number) => {
    if (!poolInfo?.exists) return
    const tl = floorTick(tlRaw, tickSpacing)
    let tu = ceilTick(tuRaw, tickSpacing)
    if (tu <= tl) tu = tl + tickSpacing
    const tl2 = clamp(tl, MIN_TICK + tickSpacing, MAX_TICK - tickSpacing)
    const tu2 = clamp(tu, MIN_TICK + tickSpacing, MAX_TICK - tickSpacing)
    setTickLower(tl2)
    setTickUpper(tu2)
    setMinPriceInput(formatPlain(tickToQuotePrice(tl2)))
    setMaxPriceInput(formatPlain(tickToQuotePrice(tu2)))
  }, [poolInfo?.exists, tickSpacing, tickToQuotePrice])

  // Initialize range once per pool (defaults to wide range)
  useEffect(() => {
    if (!poolInfo?.exists) return
    if (tickLower != null && tickUpper != null) return
    const cur = Number(poolInfo.currentTick ?? 0)
    // default: ~wide in ticks (±600 * spacing) but bounded
    const d = 600 * tickSpacing
    applyTicks(cur - d, cur + d)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [poolInfo?.poolAddress, poolInfo?.exists, tickSpacing])

  const effectiveTickLower = tickLower ?? (poolInfo ? floorTick(poolInfo.currentTick - 600 * tickSpacing, tickSpacing) : 0)
  const effectiveTickUpper = tickUpper ?? (poolInfo ? ceilTick(poolInfo.currentTick + 600 * tickSpacing, tickSpacing) : 0)

  const currentQuotePrice = poolInfo?.exists ? tickToQuotePrice(poolInfo.currentTick) : 0
  const minQuotePrice = poolInfo?.exists ? tickToQuotePrice(effectiveTickLower) : 0
  const maxQuotePrice = poolInfo?.exists ? tickToQuotePrice(effectiveTickUpper) : 0

  const minPct = currentQuotePrice > 0 ? (((minQuotePrice - currentQuotePrice) / currentQuotePrice) * 100).toFixed(2) : '0'
  const maxPct = currentQuotePrice > 0 ? (((maxQuotePrice - currentQuotePrice) / currentQuotePrice) * 100).toFixed(2) : '0'

  const inRange = poolInfo?.exists
    ? poolInfo.currentTick >= effectiveTickLower && poolInfo.currentTick <= effectiveTickUpper
    : false

  const zoomWindow = useMemo(() => {
    if (!poolInfo?.exists) return null
    const cur = Number(poolInfo.currentTick ?? 0)
    const z = clamp(zoomPct, 1, 200)
    const dTicks = Math.max(
      tickSpacing * 4,
      Math.round(Math.log(1 + z / 100) / Math.log(1.0001))
    )
    const lo = floorTick(cur - dTicks, tickSpacing)
    const hi = ceilTick(cur + dTicks, tickSpacing)
    return { lo, hi }
  }, [poolInfo?.exists, poolInfo?.currentTick, zoomPct, tickSpacing])

  // When quote direction flips, update displayed min/max inputs (ticks remain unchanged)
  useEffect(() => {
    if (!poolInfo?.exists) return
    if (tickLower == null || tickUpper == null) return
    setMinPriceInput(formatPlain(tickToQuotePrice(tickLower)))
    setMaxPriceInput(formatPlain(tickToQuotePrice(tickUpper)))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [quoteToken1PerToken0, poolInfo?.exists, tickLower, tickUpper])


  const symA = TOKENS.find((t) => t.address.toLowerCase() === tokenA.toLowerCase())?.symbol ?? '?'
  const symB = TOKENS.find((t) => t.address.toLowerCase() === tokenB.toLowerCase())?.symbol ?? '?'

  const [creatingPool, setCreatingPool] = useState(false)
  const handleCreatePool = async () => {
    if (!poolInfo || creatingPool) return
    setCreatingPool(true)
    setError(null)
    const result = await createPoolAndInitialize(tokenA, tokenB, fee)
    setCreatingPool(false)
    if (result.success) {
      await fetchPoolInfo()
    } else {
      setError(result.error ?? 'Create pool failed')
    }
  }

  const handlePlace = async () => {
    if (!userAddress || !smartWallet) {
      setError('Please create Town Hall first')
      return
    }
    if (!poolInfo?.exists) {
      setError('Pool does not exist. Click "Create Pool" first.')
      return
    }

    const amountAWei = ethers.parseUnits(
      amountA || '0',
      TOKENS.find((t) => t.address === tokenA)?.decimals ?? 18
    )
    const amountBWei = ethers.parseUnits(
      amountB || '0',
      TOKENS.find((t) => t.address === tokenB)?.decimals ?? 18
    )

    if (amountAWei === 0n && amountBWei === 0n) {
      setError('Amount must be > 0')
      return
    }

    const balA = ethers.parseUnits(
      vaultBalances[symA] ?? '0',
      TOKENS.find((t) => t.address === tokenA)?.decimals ?? 18
    )
    const balB = ethers.parseUnits(
      vaultBalances[symB] ?? '0',
      TOKENS.find((t) => t.address === tokenB)?.decimals ?? 18
    )
    if (amountAWei > balA || amountBWei > balB) {
      setError(`Insufficient vault balance. ${symA}: ${vaultBalances[symA] ?? '0'}, ${symB}: ${vaultBalances[symB] ?? '0'}`)
      return
    }

    // amount0Min/amount1Min computed in hook (90% slippage tolerance)
    const result = await placeLPBuilding(userAddress, smartWallet, {
      tokenA,
      tokenB,
      fee,
      tickLower: effectiveTickLower,
      tickUpper: effectiveTickUpper,
      amountA: amountAWei,
      amountB: amountBWei,
      amount0Min: 0n,
      amount1Min: 0n,
      x: selectedCoords.x,
      y: selectedCoords.y,
    })

    if (result.success) {
      setAmountA('')
      setAmountB('')
      if (result.txHash) {
        toast.success((t) => (
          <span>
            LP placed!{' '}
            <a href={`${BLOCK_EXPLORER_URL}/tx/${result.txHash}`} target="_blank" rel="noopener noreferrer" className="underline text-cyan-400">
              View on BaseScan ↗
            </a>
          </span>
        ))
      }
      onSuccess()
    }
  }

  // Manage mode: selected LP building
  const displayError = manageError ?? error
  const displayLoading = loading || manageLoading
  const clearDisplayError = () => { setError(null); setManageError(null) }

  const handleHarvest = async () => {
    if (!userAddress || !smartWallet || !selectedBuilding) return
    clearDisplayError()
    const result = await harvest(userAddress, smartWallet, selectedBuilding.id)
    if (result.success) {
      if (result.txHash) {
        toast.success((t) => (
          <span>
            Harvested!{' '}
            <a href={`${BLOCK_EXPLORER_URL}/tx/${result.txHash}`} target="_blank" rel="noopener noreferrer" className="underline text-cyan-400">
              View on BaseScan ↗
            </a>
          </span>
        ))
      }
      onSuccess()
    }
  }

  const handleDemolish = async () => {
    if (!userAddress || !smartWallet || !selectedBuilding) return
    clearDisplayError()
    const result = await demolish(userAddress, smartWallet, selectedBuilding.id)
    if (result.success) {
      if (result.txHash) {
        toast.success((t) => (
          <span>
            Demolished!{' '}
            <a href={`${BLOCK_EXPLORER_URL}/tx/${result.txHash}`} target="_blank" rel="noopener noreferrer" className="underline text-cyan-400">
              View on BaseScan ↗
            </a>
          </span>
        ))
      }
      onSuccess()
    }
  }

  const handleIncrease = async () => {
    if (!userAddress || !smartWallet || !selectedBuilding || !position) return
    const dec0 = TOKENS.find((t) => t.address.toLowerCase() === position.token0.toLowerCase())?.decimals ?? 18
    const dec1 = TOKENS.find((t) => t.address.toLowerCase() === position.token1.toLowerCase())?.decimals ?? 18
    const amount0 = ethers.parseUnits(incAmount0 || '0', dec0)
    const amount1 = ethers.parseUnits(incAmount1 || '0', dec1)
    if (amount0 === 0n && amount1 === 0n) return
    clearDisplayError()
    const result = await increaseLiquidity(userAddress, smartWallet, selectedBuilding.id, {
      amount0Desired: amount0,
      amount1Desired: amount1,
      amount0Min: 0n,
      amount1Min: 0n,
    })
    if (result.success) {
      setIncAmount0('')
      setIncAmount1('')
      if (result.txHash) {
        toast.success((t) => (
          <span>
            Liquidity increased!{' '}
            <a href={`${BLOCK_EXPLORER_URL}/tx/${result.txHash}`} target="_blank" rel="noopener noreferrer" className="underline text-cyan-400">
              View on BaseScan ↗
            </a>
          </span>
        ))
      }
      const p = await getPositionByBuildingId(selectedBuilding.id)
      setPosition(p)
      onSuccess()
    }
  }

  const handleLinkPosition = async () => {
    if (!userAddress || !smartWallet || !selectedBuilding) return
    const tid = linkTokenId.trim()
    if (!tid || isNaN(Number(tid))) return
    const tokenId = BigInt(tid)
    if (tokenId < 1n) return
    clearDisplayError()
    const result = await linkPosition(userAddress, smartWallet, selectedBuilding.id, tokenId)
    if (result.success) {
      setLinkTokenId('')
      if (result.txHash) {
        toast.success((t) => (
          <span>
            Position linked!{' '}
            <a href={`${BLOCK_EXPLORER_URL}/tx/${result.txHash}`} target="_blank" rel="noopener noreferrer" className="underline text-cyan-400">
              View on BaseScan ↗
            </a>
          </span>
        ))
      }
      const p = await getPositionByBuildingId(selectedBuilding.id)
      setPosition(p)
      onSuccess()
    }
  }

  const handleDecrease = async () => {
    if (!userAddress || !smartWallet || !selectedBuilding || !position) return
    const liq = decLiquidity === 'max' || !decLiquidity ? position.liquidity : BigInt(decLiquidity)
    if (liq === 0n) return
    clearDisplayError()
    const result = await decreaseLiquidity(userAddress, smartWallet, selectedBuilding.id, {
      liquidity: liq,
      amount0Min: 0n,
      amount1Min: 0n,
    })
    if (result.success) {
      setDecLiquidity('')
      if (result.txHash) {
        toast.success((t) => (
          <span>
            Liquidity decreased!{' '}
            <a href={`${BLOCK_EXPLORER_URL}/tx/${result.txHash}`} target="_blank" rel="noopener noreferrer" className="underline text-cyan-400">
              View on BaseScan ↗
            </a>
          </span>
        ))
      }
      const p = await getPositionByBuildingId(selectedBuilding.id)
      setPosition(p)
      onSuccess()
    }
  }

  if (selectedBuilding) {
    const tok0 = TOKENS.find((t) => t.address.toLowerCase() === position?.token0?.toLowerCase())
    const tok1 = TOKENS.find((t) => t.address.toLowerCase() === position?.token1?.toLowerCase())
    const sym0 = tok0?.symbol ?? 'T0'
    const sym1 = tok1?.symbol ?? 'T1'
    const icon0 = tok0?.icon ?? ''
    const icon1 = tok1?.icon ?? ''
    const dec0 = tok0?.decimals ?? 18
    const dec1 = tok1?.decimals ?? 6
    const hasTokenId = position != null
    const formatFee = (n: bigint, decimals: number) =>
      Number(ethers.formatUnits(n, decimals)).toLocaleString(undefined, { maximumFractionDigits: 6, minimumFractionDigits: 0 })
    const formatAmount = (n: bigint, decimals: number) => {
      const v = Number(ethers.formatUnits(n, decimals))
      if (v === 0) return '0'
      return v.toLocaleString(undefined, { maximumFractionDigits: Math.min(decimals, 6), minimumFractionDigits: v < 0.01 ? 4 : 0 })
    }
    const formatLiq = (n: bigint) => n.toString().length > 12 ? `${n.toString().slice(0, 6)}...` : n.toString()

    return (
      <div className="space-y-3">
        {displayError && (
          <p className="text-red-400 text-[7px]" style={pixelFont}>
            {displayError}
          </p>
        )}
        <p className="text-slate-400 text-[6px]" style={pixelFont}>
          LP POSITION
        </p>
        {position && (
          <p className="text-cyan-400 text-[7px] flex items-center gap-1" style={pixelFont}>
            Pair: <span className="text-amber-400">{icon0}</span> {sym0} / <span className="text-cyan-300">{icon1}</span> {sym1}
          </p>
        )}
        <p className="text-cyan-400 text-[7px]" style={pixelFont}>
          Asset: {selectedBuilding.asset} | Amount: {selectedBuilding.amount.toFixed(4)}
        </p>
        <p className="text-slate-500 text-[6px]" style={pixelFont}>
          Building #{selectedBuilding.id} at ({selectedBuilding.x}, {selectedBuilding.y})
        </p>
        {positionLoading && (
          <p className="text-slate-500 text-[6px] animate-pulse" style={pixelFont}>
            Loading position...
          </p>
        )}
        {position && (
          <div className="space-y-0.5">
            {(position.amount0 != null || position.amount1 != null) && (
              <>
                <p className="text-cyan-400 text-[7px]" style={pixelFont}>
                  {sym0}: {position.amount0 != null ? formatAmount(position.amount0, dec0) : '?'} · {sym1}: {position.amount1 != null ? formatAmount(position.amount1, dec1) : '0'}
                </p>
                {(position.amount0 === 0n || position.amount1 === 0n) && (
                  <p className="text-slate-500 text-[5px]" style={pixelFont} title="Concentrated LP: price outside range = liquidity in one token">
                    (Price out of range: liquidity in one token)
                  </p>
                )}
                {position.currentTick != null && (
                  <p className="text-slate-600 text-[5px]" style={pixelFont}>
                    Tick {position.currentTick} (range {position.tickLower}–{position.tickUpper})
                  </p>
                )}
              </>
            )}
            <p className="text-slate-500 text-[6px]" style={pixelFont}>
              Liquidity: {formatLiq(position.liquidity)} | Fees: {sym0} {formatFee(position.tokensOwed0, dec0)} · {sym1} {formatFee(position.tokensOwed1, dec1)}
            </p>
          </div>
        )}
        {!hasTokenId && (
          <div className="space-y-2">
            <p className="text-amber-400 text-[6px]" style={pixelFont}>
              Position not linked. Enter LP NFT Token ID to link:
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Token ID (e.g. 123)"
                value={linkTokenId}
                onChange={(e) => setLinkTokenId(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-600 p-2 text-white text-[10px]"
                style={pixelFont}
              />
              <button
                onClick={handleLinkPosition}
                disabled={displayLoading}
                className="py-2 px-4 bg-cyan-600 hover:bg-cyan-500 border border-cyan-400 text-white text-[7px] disabled:opacity-50"
                style={pixelFont}
              >
                LINK
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            className="flex-1 py-2 bg-amber-600 hover:bg-amber-500 border-2 border-amber-400 text-white text-[7px] disabled:opacity-50"
            style={pixelFont}
            disabled={displayLoading || !hasTokenId}
            onClick={handleHarvest}
          >
            HARVEST
          </button>
          <button
            className="flex-1 py-2 bg-red-600 hover:bg-red-500 border-2 border-red-400 text-white text-[7px] disabled:opacity-50"
            style={pixelFont}
            disabled={displayLoading || !hasTokenId}
            onClick={handleDemolish}
          >
            DEMOLISH
          </button>
        </div>

        {hasTokenId && (
          <>
            <p className="text-slate-500 text-[6px] pt-2" style={pixelFont}>INCREASE LIQUIDITY</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`${sym0}`}
                value={incAmount0}
                onChange={(e) => setIncAmount0(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-600 p-2 text-white text-[10px]"
                style={pixelFont}
              />
              <input
                type="text"
                placeholder={`${sym1}`}
                value={incAmount1}
                onChange={(e) => setIncAmount1(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-600 p-2 text-white text-[10px]"
                style={pixelFont}
              />
            </div>
            <button
              onClick={handleIncrease}
              disabled={displayLoading}
              className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 border border-cyan-400 text-white text-[7px] disabled:opacity-50"
              style={pixelFont}
            >
              INCREASE
            </button>

            <p className="text-slate-500 text-[6px] pt-2" style={pixelFont}>DECREASE LIQUIDITY</p>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Liquidity or max"
                value={decLiquidity}
                onChange={(e) => setDecLiquidity(e.target.value)}
                className="flex-1 bg-slate-800 border border-slate-600 p-2 text-white text-[10px]"
                style={pixelFont}
              />
              <button
                type="button"
                onClick={() => setDecLiquidity('max')}
                className="py-2 px-2 bg-slate-700 border border-slate-500 text-[7px]"
                style={pixelFont}
              >
                MAX
              </button>
            </div>
            <button
              onClick={handleDecrease}
              disabled={displayLoading}
              className="w-full py-2 bg-slate-600 hover:bg-slate-500 border border-slate-400 text-white text-[7px] disabled:opacity-50"
              style={pixelFont}
            >
              DECREASE
            </button>
          </>
        )}
      </div>
    )
  }

  const wethBal = parseFloat(vaultBalances['WETH'] ?? '0')
  const needsWeth = tokenB.toLowerCase() === (ADDRESSES.ETH || '').toLowerCase() && parseFloat(amountB || '0') > 0 && wethBal < parseFloat(amountB || '0')

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-red-400 text-[7px]" style={pixelFont}>
          {error}
        </p>
      )}
      {needsWeth && (
        <p className="text-amber-400 text-[6px]" style={pixelFont}>
          Need WETH. Swap USDC→WETH in Vault tab first.
        </p>
      )}
      {onRefetchBalances && (
        <button
          type="button"
          onClick={onRefetchBalances}
          className="text-slate-400 hover:text-cyan-400 text-[6px]"
          style={pixelFont}
        >
          REFRESH BALANCES
        </button>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>TOKEN A</p>
          <select
            value={tokenA}
            onChange={(e) => setTokenA(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 p-2 text-white text-[10px]"
            style={pixelFont}
          >
            {TOKENS.filter((t) => t.address !== tokenB).map((t) => (
              <option key={t.address} value={t.address}>
                {t.symbol} (Bal: {parseFloat(vaultBalances[t.symbol] ?? '0').toFixed(2)})
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1">
          <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>TOKEN B</p>
          <select
            value={tokenB}
            onChange={(e) => setTokenB(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 p-2 text-white text-[10px]"
            style={pixelFont}
          >
            {TOKENS.filter((t) => t.address !== tokenA).map((t) => (
              <option key={t.address} value={t.address}>
                {t.symbol} (Bal: {parseFloat(vaultBalances[t.symbol] ?? '0').toFixed(2)})
              </option>
            ))}
          </select>
        </div>
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
        <div>
          <p className="text-slate-500 text-[6px]" style={pixelFont}>
            Pool: {poolInfo.exists ? `Tick ${poolInfo.currentTick}` : 'Not exists'}
          </p>
          {!poolInfo.exists && (
            <button
              type="button"
              onClick={handleCreatePool}
              disabled={creatingPool || tokenA === tokenB}
              className="w-full py-2 mt-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 border border-amber-400 text-white text-[8px]"
              style={pixelFont}
            >
              {creatingPool ? 'CREATING POOL...' : 'CREATE POOL (one-time)'}
            </button>
          )}
          {poolInfo.exists && (
            <>
              <p className="text-slate-400 text-[6px] mb-2" style={pixelFont}>
                Custom range: concentrate liquidity within price bounds to earn more fees (requires active management).
              </p>

              {/* Current price + range picker */}
              <div className="mb-3 p-3 bg-slate-800/80 border border-slate-600 rounded">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <p className="text-slate-500 text-[5px]" style={pixelFont}>Current price</p>
                  <button
                    type="button"
                    onClick={() => setQuoteToken1PerToken0((v) => !v)}
                    className="text-[6px] px-2 py-1 bg-slate-900 border border-slate-600 hover:border-slate-500 text-slate-300"
                    style={pixelFont}
                    title="Invert quote (swap price direction)"
                  >
                    INVERT
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="w-8 h-8 rounded-full bg-amber-500/30 border-2 border-amber-400 flex items-center justify-center text-amber-400 text-[10px]" style={pixelFont} title={sym0}>
                      {tok0?.icon ?? sym0.slice(0,1)}
                    </span>
                    <span className="w-8 h-8 rounded-full bg-cyan-500/30 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 text-[10px]" style={pixelFont} title={sym1}>
                      {tok1?.icon ?? sym1.slice(0,1)}
                    </span>
                  </div>
                  <span className="text-cyan-400 text-[10px]" style={pixelFont}>
                    {formatPriceForInput(currentQuotePrice)} {priceLabel}
                  </span>
                  <span
                    className={`text-[6px] px-2 py-1 border ${
                      inRange ? 'text-green-300 border-green-600/60 bg-green-900/20' : 'text-amber-300 border-amber-600/60 bg-amber-900/20'
                    }`}
                    style={pixelFont}
                    title={inRange ? 'Price is inside your range' : 'Price is outside your range'}
                  >
                    {inRange ? 'IN RANGE' : 'OUT'}
                  </span>
                </div>
                {/* Range bar: min ----●---- max */}
                {poolInfo?.exists && minQuotePrice > 0 && maxQuotePrice > minQuotePrice && (
                  <div className="mt-2">
                    <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="absolute top-0 bottom-0 bg-cyan-500/40 rounded-full"
                        style={{
                          left: '0%',
                          width: `${Math.min(100, Math.max(0, ((currentQuotePrice - minQuotePrice) / (maxQuotePrice - minQuotePrice)) * 100))}%`,
                        }}
                      />
                      {/* Right side (from current price -> max). This is important for One-sided upper (+100%). */}
                      <div
                        className="absolute top-0 bottom-0 bg-fuchsia-500/35"
                        style={{
                          left: `${Math.min(100, Math.max(0, ((currentQuotePrice - minQuotePrice) / (maxQuotePrice - minQuotePrice)) * 100))}%`,
                          width: `${Math.min(100, Math.max(0, (1 - (currentQuotePrice - minQuotePrice) / (maxQuotePrice - minQuotePrice)) * 100))}%`,
                        }}
                      />
                      <div
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-cyan-400 border-2 border-white shadow"
                        style={{
                          left: `calc(${Math.min(100, Math.max(0, ((currentQuotePrice - minQuotePrice) / (maxQuotePrice - minQuotePrice)) * 100))}% - 4px)`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-slate-500 text-[5px] mt-0.5" style={pixelFont}>
                      <span>Min {formatPriceForInput(minQuotePrice)}</span>
                      <span>Max {formatPriceForInput(maxQuotePrice)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2 mb-1">
                <p className="text-slate-500 text-[6px]" style={pixelFont}>Price strategies</p>

                {/* Uniswap-style strategy cards */}
                <div className="grid grid-cols-2 gap-1">
                  <button
                    type="button"
                    disabled={!poolInfo?.exists}
                    onClick={() => {
                      if (!poolInfo?.exists) return
                      const d = 3 * tickSpacing
                      applyTicks(poolInfo.currentTick - d, poolInfo.currentTick + d)
                    }}
                    className="p-2 bg-slate-900/60 border border-slate-600 rounded text-left hover:border-cyan-400 disabled:opacity-50"
                  >
                    <p className="text-[7px] text-white mb-0.5" style={pixelFont}>Stable</p>
                    <p className="text-[7px] text-cyan-300 mb-0.5" style={pixelFont}>± 3 ticks</p>
                    <p className="text-[5px] text-slate-400" style={pixelFont}>
                      Good for stablecoins or low volatility pairs
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={!poolInfo?.exists || currentQuotePrice <= 0}
                    onClick={() => {
                      if (!poolInfo?.exists || currentQuotePrice <= 0) return
                      // Wide: Low 50%, High 100% around current price
                      // Use tick math directly so it is symmetric regardless of quote direction.
                      const curTick = Number(poolInfo.currentTick ?? 0)
                      const d = Math.round(Math.log(2) / Math.log(1.0001)) // factor 2x in price
                      applyTicks(curTick - d, curTick + d)
                    }}
                    className="p-2 bg-slate-900/60 border border-slate-600 rounded text-left hover:border-cyan-400 disabled:opacity-50"
                  >
                    <p className="text-[7px] text-white mb-0.5" style={pixelFont}>Wide</p>
                    <p className="text-[7px] text-cyan-300 mb-0.5" style={pixelFont}>–50% — +100%</p>
                    <p className="text-[5px] text-slate-400" style={pixelFont}>
                      Good for volatile pairs
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={!poolInfo?.exists || currentQuotePrice <= 0}
                    onClick={() => {
                      if (!poolInfo?.exists || currentQuotePrice <= 0) return
                      applyTicks(
                        displayPriceToTick(currentQuotePrice * 0.5, quoteToken1PerToken0),
                        poolInfo.currentTick
                      )
                    }}
                    className="p-2 bg-slate-900/60 border border-slate-600 rounded text-left hover:border-cyan-400 disabled:opacity-50"
                  >
                    <p className="text-[7px] text-white mb-0.5" style={pixelFont}>One-sided lower</p>
                    <p className="text-[7px] text-cyan-300 mb-0.5" style={pixelFont}>–50%</p>
                    <p className="text-[5px] text-slate-400" style={pixelFont}>
                      Supply liquidity if price goes down
                    </p>
                  </button>

                  <button
                    type="button"
                    disabled={!poolInfo?.exists || currentQuotePrice <= 0}
                    onClick={() => {
                      if (!poolInfo?.exists || currentQuotePrice <= 0) return
                      // One-sided upper: min = price now, max ≈ +100%
                      const curTick = Number(poolInfo.currentTick ?? 0)
                      const d = Math.round(Math.log(2) / Math.log(1.0001)) // ~+100% in price
                      applyTicks(curTick, curTick + d)
                    }}
                    className="p-2 bg-slate-900/60 border border-slate-600 rounded text-left hover:border-cyan-400 disabled:opacity-50"
                  >
                    <p className="text-[7px] text-white mb-0.5" style={pixelFont}>One-sided upper</p>
                    <p className="text-[7px] text-cyan-300 mb-0.5" style={pixelFont}>+100%</p>
                    <p className="text-[5px] text-slate-400" style={pixelFont}>
                      Supply liquidity if price goes up
                    </p>
                  </button>
                </div>

                <div className="flex items-center justify-between gap-2">
                  <p className="text-slate-500 text-[6px]" style={pixelFont}>Zoom: {zoomPct}%</p>
                  <input
                    type="range"
                    min={5}
                    max={200}
                    step={5}
                    value={zoomPct}
                    onChange={(e) => setZoomPct(Number(e.target.value))}
                    className="flex-1"
                  />
                </div>

                {zoomWindow && (() => {
                  const lo = zoomWindow.lo
                  const hi = zoomWindow.hi
                  const span = Math.max(1, hi - lo)
                  const sliderMax = 1000
                  const toSlider = (t: number) => clamp(Math.round(((t - lo) / span) * sliderMax), 0, sliderMax)
                  const lowerV = toSlider(effectiveTickLower)
                  const upperV = toSlider(effectiveTickUpper)
                  const curV = toSlider(Number(poolInfo.currentTick ?? 0))
                  const leftPct = (Math.min(lowerV, upperV) / sliderMax) * 100
                  const rightPct = (Math.max(lowerV, upperV) / sliderMax) * 100
                  return (
                    <div className="relative h-14 bg-slate-900/60 border border-slate-700 rounded overflow-visible px-4 py-2">
                      <div ref={rangeTrackRef} className="relative w-full h-full select-none">
                        {/* หลอด: คลิกที่หลอดไม่ทำให้จุดขยับ (ไม่มี input range) */}
                        <div className="absolute inset-0 pointer-events-none">
                          <div
                            className="absolute inset-0 opacity-30"
                            style={{
                              backgroundImage:
                                'repeating-linear-gradient(to right, rgba(148,163,184,0.25), rgba(148,163,184,0.25) 1px, transparent 1px, transparent 24px)',
                            }}
                          />
                          <div
                            className="absolute top-0 bottom-0 bg-cyan-500/20"
                            style={{ left: `${leftPct}%`, width: `${Math.max(0, rightPct - leftPct)}%` }}
                          />
                          <div
                            className="absolute top-0 bottom-0 w-[2px] bg-amber-400/80"
                            style={{ left: `calc(${(curV / sliderMax) * 100}% - 1px)` }}
                            title="Current price"
                          />
                        </div>

                        {/* ปุ่ม Min – ลากจากปุ่มเท่านั้น (คลิกที่หลอดไม่ขยับ) */}
                        <div
                          role="slider"
                          aria-label="Min price"
                          aria-valuenow={effectiveTickLower}
                          tabIndex={0}
                          onPointerDown={(e) => {
                            e.preventDefault()
                            if (draggingHandle) return
                            const el = e.currentTarget as HTMLElement
                            const params = { lo, hi, span, applyTicks, otherTick: effectiveTickUpper }
                            rangeParamsRef.current = params
                            setDraggingHandle('min')
                            el.setPointerCapture(e.pointerId)
                            const onMove = (e2: PointerEvent) => {
                              const track = rangeTrackRef.current
                              if (!track || !rangeParamsRef.current) return
                              const rect = track.getBoundingClientRect()
                              let fraction = (e2.clientX - rect.left) / rect.width
                              fraction = clamp(fraction, 0, 1)
                              const rawTick = Math.round(lo + fraction * span)
                              rangeParamsRef.current.applyTicks(rawTick, rangeParamsRef.current.otherTick)
                            }
                            const onUp = () => {
                              el.releasePointerCapture(e.pointerId)
                              el.removeEventListener('pointermove', onMove)
                              el.removeEventListener('pointerup', onUp)
                              el.removeEventListener('pointercancel', onUp)
                              setDraggingHandle(null)
                            }
                            el.addEventListener('pointermove', onMove)
                            el.addEventListener('pointerup', onUp)
                            el.addEventListener('pointercancel', onUp)
                          }}
                          className={`absolute top-1/2 -translate-y-1/2 w-6 h-9 bg-cyan-400 border-2 border-cyan-300 rounded-md shadow-lg cursor-grab active:cursor-grabbing z-20 touch-none ${
                            draggingHandle === 'min' ? 'ring-2 ring-white' : ''
                          }`}
                          style={{ left: `calc(${(lowerV / sliderMax) * 100}% - 12px)` }}
                          title="Min (ลากปุ่มเท่านั้น)"
                        />
                        {/* ปุ่ม Max – ลากจากปุ่มเท่านั้น (คลิกที่หลอดไม่ขยับ) */}
                        <div
                          role="slider"
                          aria-label="Max price"
                          aria-valuenow={effectiveTickUpper}
                          tabIndex={0}
                          onPointerDown={(e) => {
                            e.preventDefault()
                            if (draggingHandle) return
                            const el = e.currentTarget as HTMLElement
                            const params = { lo, hi, span, applyTicks, otherTick: effectiveTickLower }
                            rangeParamsRef.current = params
                            setDraggingHandle('max')
                            el.setPointerCapture(e.pointerId)
                            const onMove = (e2: PointerEvent) => {
                              const track = rangeTrackRef.current
                              if (!track || !rangeParamsRef.current) return
                              const rect = track.getBoundingClientRect()
                              let fraction = (e2.clientX - rect.left) / rect.width
                              fraction = clamp(fraction, 0, 1)
                              const rawTick = Math.round(lo + fraction * span)
                              rangeParamsRef.current.applyTicks(rangeParamsRef.current.otherTick, rawTick)
                            }
                            const onUp = () => {
                              el.releasePointerCapture(e.pointerId)
                              el.removeEventListener('pointermove', onMove)
                              el.removeEventListener('pointerup', onUp)
                              el.removeEventListener('pointercancel', onUp)
                              setDraggingHandle(null)
                            }
                            el.addEventListener('pointermove', onMove)
                            el.addEventListener('pointerup', onUp)
                            el.addEventListener('pointercancel', onUp)
                          }}
                          className={`absolute top-1/2 -translate-y-1/2 w-6 h-9 bg-cyan-400 border-2 border-cyan-300 rounded-md shadow-lg cursor-grab active:cursor-grabbing z-20 touch-none ${
                            draggingHandle === 'max' ? 'ring-2 ring-white' : ''
                          }`}
                          style={{ left: `calc(${(upperV / sliderMax) * 100}% - 12px)` }}
                          title="Max (ลากปุ่มเท่านั้น)"
                        />

                        <div className="absolute left-0 top-1 text-[5px] text-slate-500 pointer-events-none" style={pixelFont}>
                          {lo}
                        </div>
                        <div className="absolute right-0 top-1 text-[5px] text-slate-500 pointer-events-none" style={pixelFont}>
                          {hi}
                        </div>
                      </div>
                    </div>
                  )
                })()}

                <div className="grid grid-cols-2 gap-1 mt-2">
                  {/* Min price card */}
                  <div className="bg-slate-900/60 border border-slate-700 rounded p-2">
                    <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>
                      Min price ({priceLabel})
                    </p>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={minPriceInput}
                      onChange={(e) => {
                        const v = e.target.value
                        setMinPriceInput(v)
                        const n = parsePlain(v)
                        if (Number.isFinite(n) && n > 0) {
                          const tl = displayPriceToTick(n, quoteToken1PerToken0)
                          applyTicks(tl, effectiveTickUpper)
                        }
                      }}
                      className="w-full bg-transparent border-none outline-none text-white text-[10px]"
                      style={pixelFont}
                    />
                    <p className="text-slate-400 text-[5px] mt-0.5" style={pixelFont}>
                      {Number(minPct) >= 0 ? '+' : ''}
                      {minPct}% from current
                    </p>
                  </div>

                  {/* Max price card */}
                  <div className="bg-slate-900/60 border border-slate-700 rounded p-2">
                    <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>
                      Max price ({priceLabel})
                    </p>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={maxPriceInput}
                      onChange={(e) => {
                        const v = e.target.value
                        setMaxPriceInput(v)
                        const n = parsePlain(v)
                        if (Number.isFinite(n) && n > 0) {
                          const tu = displayPriceToTick(n, quoteToken1PerToken0)
                          applyTicks(effectiveTickLower, tu)
                        }
                      }}
                      className="w-full bg-transparent border-none outline-none text-white text-[10px]"
                      style={pixelFont}
                    />
                    <p className="text-slate-400 text-[5px] mt-0.5" style={pixelFont}>
                      {Number(maxPct) >= 0 ? '+' : ''}
                      {maxPct}% from current
                    </p>
                  </div>
                </div>

                <p className="text-slate-500 text-[5px] mt-1" style={pixelFont}>
                  Tips: pick a strategy, then fine-tune Min/Max or drag handles. Prices shown as {priceLabel}.
                </p>
              </div>
            </>
          )}
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>AMOUNT {symA}</p>
          <input
            type="number"
            value={amountA}
            onChange={(e) => setAmountA(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 p-2 text-white text-xs"
            style={pixelFont}
          />
        </div>
        <div className="flex-1">
          <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>AMOUNT {symB}</p>
          <input
            type="number"
            value={amountB}
            onChange={(e) => setAmountB(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 p-2 text-white text-xs"
            style={pixelFont}
          />
        </div>
      </div>

      <button
        onClick={handlePlace}
        disabled={loading || !poolInfo?.exists}
        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 border-2 border-cyan-400 text-white text-[10px]"
        style={pixelFont}
      >
        {loading ? 'PLACING...' : !poolInfo?.exists ? 'CREATE POOL FIRST' : 'PLACE LP BUILDING'}
      </button>
    </div>
  )
}
