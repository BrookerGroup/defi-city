'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrivy } from '@privy-io/react-auth'
import { useCreateTownHall } from '@/hooks/useContracts'

interface CreateTownHallModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (walletAddress: string, buildingId: number) => void
}

export function CreateTownHallModal({ isOpen, onClose, onSuccess }: CreateTownHallModalProps) {
  const { user } = usePrivy()
  const { createTownHall, loading, error } = useCreateTownHall()
  const [gridX, setGridX] = useState(5)
  const [gridY, setGridY] = useState(5)

  const handleCreate = async () => {
    if (!user?.wallet?.address) {
      alert('Please connect your wallet first')
      return
    }

    const result = await createTownHall(user.wallet.address, gridX, gridY)

    if (result.success && result.walletAddress) {
      onSuccess(result.walletAddress, result.buildingId || 1)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
          >
            <div className="bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 rounded-2xl border border-purple-500/20 shadow-2xl shadow-purple-500/10 p-8">
              {/* Title */}
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">🏛️</div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent mb-2">
                  Create Your Town Hall
                </h2>
                <p className="text-slate-400">
                  This is your first building! Your SmartWallet will be created automatically.
                </p>
              </div>

              {/* Info Cards */}
              <div className="space-y-3 mb-6">
                <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">💎</div>
                    <div>
                      <div className="text-sm font-semibold text-purple-300 mb-1">
                        Self-Custodial SmartWallet
                      </div>
                      <div className="text-xs text-slate-400">
                        You keep full control of your assets
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">⚡</div>
                    <div>
                      <div className="text-sm font-semibold text-emerald-300 mb-1">
                        Gasless Gameplay
                      </div>
                      <div className="text-xs text-slate-400">
                        After setup, play without signing every action
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <div className="text-2xl">🎮</div>
                    <div>
                      <div className="text-sm font-semibold text-cyan-300 mb-1">
                        Real DeFi Yields
                      </div>
                      <div className="text-xs text-slate-400">
                        Earn actual yields from Aave, Aerodrome & more
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Position Selection */}
              <div className="mb-6">
                <label className="text-sm font-semibold text-slate-300 mb-3 block">
                  Town Hall Position
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">X Coordinate</label>
                    <input
                      type="number"
                      value={gridX}
                      onChange={(e) => setGridX(Number(e.target.value))}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      min="0"
                      max="50"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-slate-400 mb-1 block">Y Coordinate</label>
                    <input
                      type="number"
                      value={gridY}
                      onChange={(e) => setGridY(Number(e.target.value))}
                      className="w-full bg-slate-800/50 border border-slate-700 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none"
                      min="0"
                      max="50"
                    />
                  </div>
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Position: ({gridX}, {gridY})
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="text-sm text-red-400">{error}</div>
                </div>
              )}

              {/* Gas Estimate */}
              <div className="mb-6 p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">Estimated Gas:</span>
                  <span className="text-white font-mono">~2.3M gas (~$0.005 on Base)</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-slate-700/50 hover:bg-slate-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-lg font-semibold transition-all transform hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-orange-500/20"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Creating...
                    </span>
                  ) : (
                    'Create Town Hall'
                  )}
                </button>
              </div>

              {/* Loading Overlay */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center"
                >
                  <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-16 w-16 border-4 border-purple-500 border-t-transparent mb-4"></div>
                    <div className="text-white font-semibold mb-2">Creating your city...</div>
                    <div className="text-sm text-slate-400">This may take a few seconds</div>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
