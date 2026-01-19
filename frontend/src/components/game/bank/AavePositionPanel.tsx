'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { AaveUserPosition, AAVE_MARKET_DATA, ASSET_PRICES } from '@/types/aave'
import { HealthFactorBar, HealthFactorBadge } from './HealthFactorBar'
import { AssetBadge } from './AssetSelector'

interface AavePositionPanelProps {
  position: AaveUserPosition
  compact?: boolean
}

export function AavePositionPanel({ position, compact = false }: AavePositionPanelProps) {
  const hasPosition = position.supplies.length > 0 || position.borrows.length > 0

  if (!hasPosition) {
    return (
      <div className="p-6 rounded-2xl bg-slate-800/50 border border-slate-700">
        <div className="text-center">
          <span className="text-4xl mb-3 block">🏦</span>
          <h3 className="text-lg font-bold text-white mb-2">No Position Yet</h3>
          <p className="text-sm text-slate-400">
            Supply assets to earn interest or use as collateral for borrowing.
          </p>
        </div>
      </div>
    )
  }

  if (compact) {
    return <CompactPositionView position={position} />
  }

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-3">
        {/* Total Supplied */}
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
          <div className="text-xs text-emerald-400 mb-1">Total Supplied</div>
          <div className="text-xl font-bold text-emerald-400">
            ${position.totalSuppliedUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Total Borrowed */}
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
          <div className="text-xs text-amber-400 mb-1">Total Borrowed</div>
          <div className="text-xl font-bold text-amber-400">
            ${position.totalBorrowedUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>

        {/* Net Worth */}
        <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <div className="text-xs text-blue-400 mb-1">Net Worth</div>
          <div className="text-xl font-bold text-blue-400">
            ${position.netWorthUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </div>
        </div>
      </div>

      {/* Health Factor */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
        <HealthFactorBar value={position.healthFactor} />
      </div>

      {/* Net APY */}
      <div className="flex items-center justify-between p-4 rounded-xl bg-slate-800/50 border border-slate-700">
        <span className="text-sm text-slate-400">Net APY</span>
        <span
          className={`text-lg font-bold ${
            position.netAPY >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {position.netAPY >= 0 ? '+' : ''}
          {position.netAPY.toFixed(2)}%
        </span>
      </div>

      {/* Supplied Assets */}
      {position.supplies.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <h4 className="text-sm font-medium text-emerald-400 mb-3 flex items-center gap-2">
            <span>📈</span> Supplied Assets
          </h4>
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {position.supplies.map((supply) => (
                <motion.div
                  key={supply.asset}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50"
                >
                  <AssetBadge asset={supply.asset} amount={supply.amount} />
                  <div className="text-right">
                    <div className="text-xs text-slate-400">APY</div>
                    <div className="text-sm font-medium text-emerald-400">
                      +{supply.apy.toFixed(2)}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}

      {/* Borrowed Assets */}
      {position.borrows.length > 0 && (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <h4 className="text-sm font-medium text-amber-400 mb-3 flex items-center gap-2">
            <span>📉</span> Borrowed Assets
          </h4>
          <div className="space-y-2">
            <AnimatePresence mode="popLayout">
              {position.borrows.map((borrow) => (
                <motion.div
                  key={borrow.asset}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex items-center justify-between p-3 rounded-lg bg-slate-700/50"
                >
                  <AssetBadge asset={borrow.asset} amount={borrow.amount} />
                  <div className="text-right">
                    <div className="text-xs text-slate-400">APY</div>
                    <div className="text-sm font-medium text-amber-400">
                      -{borrow.apy.toFixed(2)}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  )
}

// Compact view for sidebar or header
function CompactPositionView({ position }: { position: AaveUserPosition }) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700">
      {/* Net Worth */}
      <div className="flex-1">
        <div className="text-xs text-slate-400">Net Worth</div>
        <div className="text-lg font-bold text-white">
          ${position.netWorthUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
        </div>
      </div>

      {/* Health Factor Badge */}
      <HealthFactorBadge value={position.healthFactor} />

      {/* Net APY */}
      <div className="text-right">
        <div className="text-xs text-slate-400">Net APY</div>
        <div
          className={`font-bold ${
            position.netAPY >= 0 ? 'text-emerald-400' : 'text-red-400'
          }`}
        >
          {position.netAPY >= 0 ? '+' : ''}
          {position.netAPY.toFixed(2)}%
        </div>
      </div>
    </div>
  )
}

// Borrowing capacity indicator
export function BorrowingCapacity({
  position,
  previewBorrowUSD = 0,
}: {
  position: AaveUserPosition
  previewBorrowUSD?: number
}) {
  // Calculate max borrow based on supplies and LTV
  let maxBorrowUSD = 0
  for (const supply of position.supplies) {
    const assetInfo = AAVE_MARKET_DATA.assets[supply.asset]
    maxBorrowUSD += supply.amountUSD * assetInfo.ltv
  }

  const usedBorrowUSD = position.totalBorrowedUSD
  const availableBorrowUSD = Math.max(0, maxBorrowUSD - usedBorrowUSD)
  const usedPercentage = maxBorrowUSD > 0 ? (usedBorrowUSD / maxBorrowUSD) * 100 : 0
  const previewPercentage = maxBorrowUSD > 0 ? ((usedBorrowUSD + previewBorrowUSD) / maxBorrowUSD) * 100 : 0

  return (
    <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm text-slate-400">Borrowing Capacity</span>
        <span className="text-sm font-medium text-white">
          ${availableBorrowUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })} available
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-3 rounded-full bg-slate-700 overflow-hidden relative">
        {/* Used portion */}
        <motion.div
          className="absolute inset-y-0 left-0 bg-amber-500 rounded-full"
          initial={{ width: 0 }}
          animate={{ width: `${usedPercentage}%` }}
          transition={{ duration: 0.5 }}
        />

        {/* Preview portion */}
        {previewBorrowUSD > 0 && (
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full"
            style={{
              width: `${previewPercentage}%`,
              background: previewPercentage > 100
                ? 'linear-gradient(90deg, #f59e0b 0%, #ef4444 100%)'
                : '#f59e0b',
              opacity: 0.5,
            }}
            animate={{ opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>

      <div className="flex items-center justify-between mt-1">
        <span className="text-xs text-slate-500">
          ${usedBorrowUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })} used
        </span>
        <span className="text-xs text-slate-500">
          ${maxBorrowUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })} max
        </span>
      </div>

      {previewBorrowUSD > 0 && previewPercentage > 100 && (
        <motion.div
          className="mt-2 p-2 rounded-lg bg-red-500/20 border border-red-500/30 text-xs text-red-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          ⚠️ Exceeds borrowing capacity
        </motion.div>
      )}
    </div>
  )
}
