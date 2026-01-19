'use client'

import { motion } from 'framer-motion'
import { AaveAsset, AAVE_MARKET_DATA, ASSET_PRICES } from '@/types/aave'

interface AssetSelectorProps {
  selectedAsset: AaveAsset
  onSelect: (asset: AaveAsset) => void
  showAPY?: 'supply' | 'borrow'
  disabled?: boolean
}

const ASSETS: AaveAsset[] = ['USDC', 'USDT', 'ETH', 'WBTC']

// Asset icons
const ASSET_ICONS: Record<AaveAsset, string> = {
  USDC: '💵',
  USDT: '💲',
  ETH: '⟠',
  WBTC: '₿',
}

export function AssetSelector({
  selectedAsset,
  onSelect,
  showAPY = 'supply',
  disabled = false,
}: AssetSelectorProps) {
  return (
    <div className="grid grid-cols-4 gap-2">
      {ASSETS.map((asset) => {
        const info = AAVE_MARKET_DATA.assets[asset]
        const isSelected = selectedAsset === asset
        const apy = showAPY === 'supply' ? info.supplyAPY : info.borrowAPY
        const price = ASSET_PRICES[asset]

        return (
          <motion.button
            key={asset}
            onClick={() => !disabled && onSelect(asset)}
            disabled={disabled}
            className={`
              relative p-3 rounded-xl border-2 transition-all
              ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              ${
                isSelected
                  ? 'border-blue-500 bg-blue-500/20'
                  : 'border-slate-600 bg-slate-800/50 hover:border-slate-500'
              }
            `}
            whileHover={!disabled ? { scale: 1.02 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
          >
            {/* Selection indicator */}
            {isSelected && (
              <motion.div
                className="absolute top-1 right-1 w-3 h-3 rounded-full bg-blue-500"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                layoutId="asset-indicator"
              />
            )}

            <div className="flex flex-col items-center gap-1">
              {/* Icon */}
              <span className="text-2xl">{ASSET_ICONS[asset]}</span>

              {/* Symbol */}
              <span
                className={`font-bold text-sm ${
                  isSelected ? 'text-white' : 'text-slate-300'
                }`}
              >
                {asset}
              </span>

              {/* Price */}
              <span className="text-xs text-slate-400">
                ${price.toLocaleString()}
              </span>

              {/* APY */}
              <span
                className={`text-xs font-medium ${
                  showAPY === 'supply' ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {apy.toFixed(2)}% APY
              </span>
            </div>
          </motion.button>
        )
      })}
    </div>
  )
}

// Compact version for showing in lists
export function AssetBadge({
  asset,
  amount,
  showUSD = true,
}: {
  asset: AaveAsset
  amount: number
  showUSD?: boolean
}) {
  const info = AAVE_MARKET_DATA.assets[asset]
  const price = ASSET_PRICES[asset]
  const usdValue = amount * price

  return (
    <div
      className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{ backgroundColor: `${info.color}20` }}
    >
      <span className="text-lg">{ASSET_ICONS[asset]}</span>
      <div className="flex flex-col">
        <span className="text-sm font-medium text-white">
          {amount.toLocaleString(undefined, { maximumFractionDigits: 4 })} {asset}
        </span>
        {showUSD && (
          <span className="text-xs text-slate-400">
            ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
          </span>
        )}
      </div>
    </div>
  )
}

// Dropdown style selector
export function AssetDropdown({
  selectedAsset,
  onSelect,
  label,
  disabled = false,
}: {
  selectedAsset: AaveAsset
  onSelect: (asset: AaveAsset) => void
  label?: string
  disabled?: boolean
}) {
  const info = AAVE_MARKET_DATA.assets[selectedAsset]

  return (
    <div className="relative">
      {label && (
        <label className="block text-xs text-slate-400 mb-1">{label}</label>
      )}
      <select
        value={selectedAsset}
        onChange={(e) => onSelect(e.target.value as AaveAsset)}
        disabled={disabled}
        className={`
          w-full px-4 py-3 rounded-xl border-2 border-slate-600 bg-slate-800
          text-white font-medium appearance-none cursor-pointer
          focus:outline-none focus:border-blue-500
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
          backgroundRepeat: 'no-repeat',
          backgroundPosition: 'right 12px center',
          backgroundSize: '20px',
        }}
      >
        {ASSETS.map((asset) => (
          <option key={asset} value={asset}>
            {ASSET_ICONS[asset]} {asset} - ${ASSET_PRICES[asset].toLocaleString()}
          </option>
        ))}
      </select>
    </div>
  )
}
