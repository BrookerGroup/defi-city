'use client'

import { useEffect, useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { ADDRESSES } from '@/config/contracts'
import { useUniswapLP, nearestUsableTick, sortTokens } from '@/hooks/useUniswapLP'
import { useUniswapLPBuild } from '@/hooks/useUniswapLPBuild'
import { useUniswapLPManage } from '@/hooks/useUniswapLPManage'
import type { Building } from '@/hooks/useCityBuildings'

const TOKENS = [
  { symbol: 'USDC', address: ADDRESSES.USDC, decimals: 6 },
  { symbol: 'WETH', address: ADDRESSES.ETH, decimals: 18 },
  { symbol: 'USDT', address: ADDRESSES.USDT, decimals: 6 },
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
  const { getPoolInfo, FEE_TIERS, TICK_SPACING } = useUniswapLP(smartWallet)
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
  const [rangePercent, setRangePercent] = useState(5)
  const [amountA, setAmountA] = useState('')
  const [amountB, setAmountB] = useState('')
  const [poolInfo, setPoolInfo] = useState<any>(null)
  const [position, setPosition] = useState<Awaited<ReturnType<typeof getPositionByBuildingId>>>(null)
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
    if (!selectedBuilding || selectedBuilding.type !== 'lp') return
    let cancelled = false
    getPositionByBuildingId(selectedBuilding.id).then((p) => {
      if (!cancelled) setPosition(p)
    })
    return () => { cancelled = true }
  }, [selectedBuilding?.id, selectedBuilding?.type, getPositionByBuildingId])

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

  const symA = TOKENS.find((t) => t.address.toLowerCase() === tokenA.toLowerCase())?.symbol ?? '?'
  const symB = TOKENS.find((t) => t.address.toLowerCase() === tokenB.toLowerCase())?.symbol ?? '?'

  const handlePlace = async () => {
    if (!userAddress || !smartWallet) {
      setError('Please create Town Hall first')
      return
    }
    if (!poolInfo?.exists) {
      setError('Pool does not exist')
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

    // amount0Min/amount1Min: 0 = accept any (thin testnet pools)
    const amount0Min = 0n
    const amount1Min = 0n

    const result = await placeLPBuilding(userAddress, smartWallet, {
      tokenA,
      tokenB,
      fee,
      tickLower,
      tickUpper,
      amountA: amountAWei,
      amountB: amountBWei,
      amount0Min,
      amount1Min,
      x: selectedCoords.x,
      y: selectedCoords.y,
    })

    if (result.success) {
      setAmountA('')
      setAmountB('')
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
    if (result.success) onSuccess()
  }

  const handleDemolish = async () => {
    if (!userAddress || !smartWallet || !selectedBuilding) return
    clearDisplayError()
    const result = await demolish(userAddress, smartWallet, selectedBuilding.id)
    if (result.success) onSuccess()
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
      const p = await getPositionByBuildingId(selectedBuilding.id)
      setPosition(p)
      onSuccess()
    }
  }

  if (selectedBuilding) {
    const sym0 = TOKENS.find((t) => t.address.toLowerCase() === position?.token0?.toLowerCase())?.symbol ?? 'T0'
    const sym1 = TOKENS.find((t) => t.address.toLowerCase() === position?.token1?.toLowerCase())?.symbol ?? 'T1'
    const hasTokenId = position != null

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
        <p className="text-cyan-400 text-[7px]" style={pixelFont}>
          Asset: {selectedBuilding.asset} | Amount: {selectedBuilding.amount.toFixed(4)}
        </p>
        <p className="text-slate-500 text-[6px]" style={pixelFont}>
          Building #{selectedBuilding.id} at ({selectedBuilding.x}, {selectedBuilding.y})
        </p>
        {position && (
          <p className="text-slate-500 text-[6px]" style={pixelFont}>
            Liquidity: {position.liquidity.toString()} | Fees: {sym0} {position.tokensOwed0.toString()} / {sym1} {position.tokensOwed1.toString()}
          </p>
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
          <p className="text-slate-400 text-[6px]" style={pixelFont}>
            Range ±{rangePercent}% (Lower {tickLower}, Upper {tickUpper})
          </p>
          <input
            type="range"
            min="1"
            max="20"
            value={rangePercent}
            onChange={(e) => setRangePercent(Number(e.target.value))}
            className="w-full"
          />
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
        disabled={loading}
        className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 border-2 border-cyan-400 text-white text-[10px]"
        style={pixelFont}
      >
        {loading ? 'PLACING...' : 'PLACE LP BUILDING'}
      </button>
    </div>
  )
}
