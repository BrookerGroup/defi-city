'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BUILDING_INFO, BuildingType } from '@/types'
import { useSmartWallet } from '@/hooks'
import { usePrivy } from '@privy-io/react-auth'
import { formatEther } from 'viem'
import { X } from 'lucide-react'

interface BuildingModalProps {
  open: boolean
  onClose: () => void
  buildingType: BuildingType | null
  onConfirm: (amount?: string) => void
}

// Pixel Art Building Preview
function PixelBuildingPreview({ type }: { type: BuildingType }) {
  const info = BUILDING_INFO[type]
  const { colors } = info

  return (
    <svg
      width={80}
      height={80}
      viewBox="0 0 16 16"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect x="2" y="14" width="12" height="2" fill={colors.accent} />
      <rect x="3" y="6" width="10" height="8" fill={colors.wall} />

      {type === 'townhall' ? (
        <>
          <rect x="4" y="4" width="8" height="2" fill={colors.roof} />
          <rect x="5" y="2" width="6" height="2" fill={colors.roof} />
          <rect x="7" y="1" width="2" height="1" fill={colors.roof} />
          <rect x="7" y="0" width="1" height="1" fill={colors.accent} />
        </>
      ) : type === 'bank' ? (
        <>
          <rect x="2" y="5" width="12" height="1" fill={colors.roof} />
          <rect x="3" y="4" width="10" height="1" fill={colors.roof} />
          <rect x="4" y="6" width="1" height="8" fill={colors.accent} />
          <rect x="7" y="6" width="2" height="8" fill={colors.accent} />
          <rect x="11" y="6" width="1" height="8" fill={colors.accent} />
        </>
      ) : type === 'shop' ? (
        <>
          <rect x="2" y="5" width="12" height="2" fill={colors.roof} />
          <rect x="2" y="5" width="2" height="2" fill={colors.accent} />
          <rect x="6" y="5" width="2" height="2" fill={colors.accent} />
          <rect x="10" y="5" width="2" height="2" fill={colors.accent} />
          <rect x="5" y="3" width="6" height="2" fill={colors.accent} />
        </>
      ) : (
        <>
          <rect x="3" y="4" width="10" height="2" fill={colors.roof} />
          <rect x="6" y="2" width="4" height="2" fill={colors.roof} />
          <rect x="7" y="1" width="2" height="1" fill={colors.accent} />
          <rect x="7" y="0" width="2" height="1" fill="#FCD34D" />
        </>
      )}

      <rect x="4" y="7" width="2" height="2" fill={colors.window} />
      <rect x="10" y="7" width="2" height="2" fill={colors.window} />
      <rect x="6" y="10" width="4" height="4" fill={colors.accent} />
      <rect x="7" y="11" width="2" height="3" fill={colors.window} />
    </svg>
  )
}

export function BuildingModal({
  open,
  onClose,
  buildingType,
  onConfirm,
}: BuildingModalProps) {
  const [amount, setAmount] = useState('')
  const { user } = usePrivy()
  const eoaAddress = user?.wallet?.address as `0x${string}` | undefined
  const { balance } = useSmartWallet(eoaAddress)

  if (!buildingType) return null

  const info = BUILDING_INFO[buildingType]
  const formattedBalance = balance ? formatEther(balance) : '0'

  const handleConfirm = () => {
    onConfirm(amount || undefined)
    setAmount('')
    onClose()
  }

  const handleCancel = () => {
    setAmount('')
    onClose()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={handleCancel}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-md mx-4 border-4"
            style={{
              backgroundColor: '#0f172a',
              borderColor: info.colors.accent,
              boxShadow: `8px 8px 0px ${info.colors.accent}40`
            }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b-2"
              style={{ borderColor: info.colors.accent }}
            >
              <div className="flex items-center gap-3">
                <PixelBuildingPreview type={buildingType} />
                <div>
                  <h3
                    className="text-lg"
                    style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: '14px',
                      color: info.colors.roof
                    }}
                  >
                    Build {info.name}
                  </h3>
                  <p
                    className="text-sm mt-1"
                    style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: '8px',
                      color: '#64748b'
                    }}
                  >
                    {info.category}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-400">{info.description}</p>

              {/* Features */}
              <div className="space-y-2">
                {info.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2"
                      style={{ backgroundColor: info.colors.roof }}
                    />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Risk Level */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                <span className="text-xs text-slate-500">Risk Level</span>
                <span
                  className="text-xs px-2 py-1 border"
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: '8px',
                    color: info.riskColor,
                    borderColor: info.riskColor,
                    backgroundColor: `${info.riskColor}15`
                  }}
                >
                  {info.risk}
                </span>
              </div>

              {/* Deposit Input */}
              <div className="pt-4 border-t border-slate-700">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-500">Deposit Amount (Optional)</span>
                  <span className="text-slate-400">
                    Balance: {parseFloat(formattedBalance).toFixed(4)} ETH
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.001"
                    min="0"
                    className="flex-1 px-3 py-2 bg-slate-800 border-2 border-slate-600 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="flex items-center px-3 bg-slate-800 border-2 border-slate-600 text-sm text-slate-400">
                    ETH
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t-2" style={{ borderColor: info.colors.accent }}>
              <button
                onClick={handleCancel}
                className="flex-1 py-3 border-2 border-slate-600 text-slate-400 hover:bg-slate-800 transition-colors"
                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 border-2 text-white transition-all hover:brightness-110"
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: '10px',
                  borderColor: info.colors.roof,
                  backgroundColor: info.colors.accent,
                  boxShadow: `3px 3px 0px ${info.colors.roof}`
                }}
              >
                Build
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
