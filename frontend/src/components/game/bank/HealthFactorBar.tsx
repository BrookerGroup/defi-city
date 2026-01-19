'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface HealthFactorBarProps {
  value: number
  previewValue?: number
  showLabel?: boolean
  size?: 'sm' | 'md' | 'lg'
}

// Health factor thresholds
const DANGER_THRESHOLD = 1.0
const WARNING_THRESHOLD = 1.5
const SAFE_THRESHOLD = 2.0

function getHealthFactorColor(value: number): string {
  if (value === Infinity) return '#10b981' // Emerald - No borrows
  if (value < DANGER_THRESHOLD) return '#ef4444' // Red - Liquidation risk
  if (value < WARNING_THRESHOLD) return '#f59e0b' // Amber - Warning
  if (value < SAFE_THRESHOLD) return '#eab308' // Yellow - Caution
  return '#10b981' // Emerald - Safe
}

function getHealthFactorLabel(value: number): string {
  if (value === Infinity) return 'Safe'
  if (value < DANGER_THRESHOLD) return 'Liquidation Risk!'
  if (value < WARNING_THRESHOLD) return 'Risky'
  if (value < SAFE_THRESHOLD) return 'Moderate'
  return 'Safe'
}

function getHealthFactorPercentage(value: number): number {
  if (value === Infinity) return 100
  if (value <= 0) return 0
  // Map health factor 0-3+ to 0-100%
  return Math.min(100, (value / 3) * 100)
}

export function HealthFactorBar({
  value,
  previewValue,
  showLabel = true,
  size = 'md',
}: HealthFactorBarProps) {
  const color = useMemo(() => getHealthFactorColor(value), [value])
  const previewColor = useMemo(
    () => (previewValue !== undefined ? getHealthFactorColor(previewValue) : null),
    [previewValue]
  )
  const label = useMemo(() => getHealthFactorLabel(value), [value])
  const percentage = useMemo(() => getHealthFactorPercentage(value), [value])
  const previewPercentage = useMemo(
    () => (previewValue !== undefined ? getHealthFactorPercentage(previewValue) : null),
    [previewValue]
  )

  const heights = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  }

  const displayValue = value === Infinity ? '∞' : value.toFixed(2)
  const displayPreviewValue = previewValue === Infinity ? '∞' : previewValue?.toFixed(2)

  return (
    <div className="w-full">
      {/* Header */}
      {showLabel && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Health Factor</span>
          <div className="flex items-center gap-2">
            <span
              className="font-bold text-lg"
              style={{ color }}
            >
              {displayValue}
            </span>
            {previewValue !== undefined && previewValue !== value && (
              <>
                <span className="text-slate-500">→</span>
                <span
                  className="font-bold text-lg"
                  style={{ color: previewColor || color }}
                >
                  {displayPreviewValue}
                </span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Bar */}
      <div className={`w-full ${heights[size]} rounded-full bg-slate-700 overflow-hidden relative`}>
        {/* Gradient background */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, #ef4444 0%, #f59e0b 33%, #eab308 50%, #10b981 100%)',
            opacity: 0.3,
          }}
        />

        {/* Current value bar */}
        <motion.div
          className={`absolute inset-y-0 left-0 rounded-full`}
          style={{ backgroundColor: color }}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />

        {/* Preview value indicator */}
        {previewPercentage !== null && previewPercentage !== percentage && (
          <motion.div
            className="absolute inset-y-0 w-1 rounded-full"
            style={{
              backgroundColor: previewColor || color,
              left: `${previewPercentage}%`,
              boxShadow: `0 0 8px ${previewColor || color}`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}

        {/* Threshold markers */}
        <div
          className="absolute inset-y-0 w-0.5 bg-slate-500"
          style={{ left: `${(DANGER_THRESHOLD / 3) * 100}%` }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-slate-500"
          style={{ left: `${(WARNING_THRESHOLD / 3) * 100}%` }}
        />
        <div
          className="absolute inset-y-0 w-0.5 bg-slate-500"
          style={{ left: `${(SAFE_THRESHOLD / 3) * 100}%` }}
        />
      </div>

      {/* Status label */}
      {showLabel && (
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs text-slate-500">Liquidation at 1.0</span>
          <motion.span
            className="text-xs font-medium"
            style={{ color }}
            animate={value < DANGER_THRESHOLD ? { opacity: [1, 0.5, 1] } : {}}
            transition={{ duration: 0.5, repeat: value < DANGER_THRESHOLD ? Infinity : 0 }}
          >
            {label}
          </motion.span>
        </div>
      )}
    </div>
  )
}

// Compact inline version
export function HealthFactorBadge({ value }: { value: number }) {
  const color = getHealthFactorColor(value)
  const displayValue = value === Infinity ? '∞' : value.toFixed(2)

  return (
    <div
      className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: `${color}20`, color }}
    >
      <div
        className="w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      />
      HF: {displayValue}
    </div>
  )
}

// Risk indicator for quick glance
export function RiskIndicator({ healthFactor }: { healthFactor: number }) {
  const color = getHealthFactorColor(healthFactor)
  const label = getHealthFactorLabel(healthFactor)
  const isRisky = healthFactor < WARNING_THRESHOLD && healthFactor !== Infinity

  return (
    <motion.div
      className="flex items-center gap-2 px-3 py-2 rounded-lg"
      style={{ backgroundColor: `${color}15`, borderColor: color, borderWidth: 1 }}
      animate={isRisky ? { opacity: [1, 0.7, 1] } : {}}
      transition={{ duration: 1, repeat: isRisky ? Infinity : 0 }}
    >
      {isRisky && (
        <motion.span
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        >
          ⚠️
        </motion.span>
      )}
      <div className="flex flex-col">
        <span className="text-xs text-slate-400">Health Factor</span>
        <span className="font-bold" style={{ color }}>
          {healthFactor === Infinity ? '∞ Safe' : `${healthFactor.toFixed(2)} ${label}`}
        </span>
      </div>
    </motion.div>
  )
}
