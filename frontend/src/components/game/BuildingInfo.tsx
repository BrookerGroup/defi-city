'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { Building, BUILDING_INFO } from '@/types'
import { Trash2, X } from 'lucide-react'

interface BuildingInfoProps {
  building: Building | null
  open: boolean
  onClose: () => void
  onRemove: (id: string) => void
}

// Pixel Art Building Preview
function PixelBuildingPreview({ type }: { type: Building['type'] }) {
  const info = BUILDING_INFO[type]
  const { colors } = info

  return (
    <motion.svg
      width={64}
      height={64}
      viewBox="0 0 16 16"
      style={{ imageRendering: 'pixelated' }}
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
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
    </motion.svg>
  )
}

export function BuildingInfo({ building, open, onClose, onRemove }: BuildingInfoProps) {
  if (!building) return null

  const info = BUILDING_INFO[building.type]
  const isTownHall = building.type === 'townhall'

  const handleRemove = () => {
    if (isTownHall) return
    onRemove(building.id)
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
            onClick={onClose}
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
                <PixelBuildingPreview type={building.type} />
                <div>
                  <h3
                    className="text-lg"
                    style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: '14px',
                      color: info.colors.roof
                    }}
                  >
                    {info.name}
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
                onClick={onClose}
                className="p-2 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-400">{info.description}</p>

              {/* Building Stats */}
              <div className="space-y-3">
                <div className="flex items-center justify-between py-2 border-b border-slate-700">
                  <span className="text-xs text-slate-500">Position</span>
                  <span
                    className="text-xs"
                    style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#94a3b8' }}
                  >
                    ({building.position.x}, {building.position.y})
                  </span>
                </div>

                {building.deposited && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-700">
                    <span className="text-xs text-slate-500">Deposited</span>
                    <span
                      className="text-xs"
                      style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#10b981' }}
                    >
                      {building.deposited} ETH
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-b border-slate-700">
                  <span className="text-xs text-slate-500">Built on</span>
                  <span className="text-xs text-slate-400">
                    {new Date(building.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex items-center justify-between py-2">
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
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t-2" style={{ borderColor: info.colors.accent }}>
              <button
                onClick={onClose}
                className="flex-1 py-3 border-2 border-slate-600 text-slate-400 hover:bg-slate-800 transition-colors"
                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
              >
                Close
              </button>
              {!isTownHall && (
                <button
                  onClick={handleRemove}
                  className="flex-1 py-3 border-2 border-red-500 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                  style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
