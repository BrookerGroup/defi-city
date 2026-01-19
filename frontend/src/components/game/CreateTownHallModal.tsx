'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { useCreateTownHall } from '@/hooks/useContracts'
import { useGameStore } from '@/store/gameStore'
import { BUILDING_INFO } from '@/types'

interface CreateTownHallModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (walletAddress: string, buildingId: number) => void
}

// Pixel Art Town Hall Preview
function PixelTownHall() {
  const colors = BUILDING_INFO.townhall.colors

  return (
    <motion.svg
      width={96}
      height={96}
      viewBox="0 0 16 16"
      style={{ imageRendering: 'pixelated' }}
      animate={{ y: [0, -4, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <rect x="2" y="14" width="12" height="2" fill={colors.accent} />
      <rect x="3" y="6" width="10" height="8" fill={colors.wall} />
      <rect x="4" y="4" width="8" height="2" fill={colors.roof} />
      <rect x="5" y="2" width="6" height="2" fill={colors.roof} />
      <rect x="7" y="1" width="2" height="1" fill={colors.roof} />
      <rect x="7" y="0" width="1" height="1" fill={colors.accent} />
      <rect x="4" y="7" width="2" height="2" fill={colors.window} />
      <rect x="10" y="7" width="2" height="2" fill={colors.window} />
      <rect x="6" y="10" width="4" height="4" fill={colors.accent} />
      <rect x="7" y="11" width="2" height="3" fill={colors.window} />
      {/* Animated window lights */}
      <motion.rect
        x="4" y="7" width="1" height="1"
        fill="#FCD34D"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.rect
        x="10" y="7" width="1" height="1"
        fill="#FCD34D"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
    </motion.svg>
  )
}

export function CreateTownHallModal({ isOpen, onClose, onSuccess }: CreateTownHallModalProps) {
  const { user, authenticated, login } = usePrivy()
  const { wallets } = useWallets()
  const { createTownHall, loading, error } = useCreateTownHall()
  const { addBuilding } = useGameStore()
  const [gridX, setGridX] = useState(5)
  const [gridY, setGridY] = useState(5)

  // Get user's wallet address - prefer Privy embedded wallet, then any connected wallet
  const getUserAddress = () => {
    // First try the Privy embedded wallet
    const privyWallet = wallets.find(w => w.walletClientType === 'privy')
    if (privyWallet) return privyWallet.address

    // Then try user's linked wallet
    if (user?.wallet?.address) return user.wallet.address

    // Finally, try any available wallet
    if (wallets.length > 0) return wallets[0].address

    return null
  }

  const handleCreate = async () => {
    if (!authenticated) {
      login()
      return
    }

    const userAddress = getUserAddress()
    if (!userAddress) {
      alert('Please connect your wallet first. Try refreshing the page.')
      return
    }

    console.log('Creating Town Hall for address:', userAddress)
    const result = await createTownHall(userAddress, gridX, gridY)

    if (result.success && result.walletAddress) {
      // Add town hall to the game store
      addBuilding({
        id: `townhall-${Date.now()}`,
        type: 'townhall',
        position: { x: gridX, y: gridY },
        createdAt: Date.now(),
      })

      onSuccess(result.walletAddress, result.buildingId || 1)
      onClose()
    }
  }

  const colors = BUILDING_INFO.townhall.colors

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
            className="fixed inset-0 bg-black/70 z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg mx-4"
          >
            <div
              className="border-4"
              style={{
                backgroundColor: '#0f172a',
                borderColor: colors.accent,
                boxShadow: `8px 8px 0px ${colors.accent}40`
              }}
            >
              {/* Header */}
              <div
                className="px-6 py-4 border-b-2 text-center"
                style={{ borderColor: colors.accent }}
              >
                <PixelTownHall />
                <h2
                  className="text-xl mt-2"
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: '16px',
                    color: colors.roof
                  }}
                >
                  Create Town Hall
                </h2>
                <p className="text-sm text-slate-400 mt-2">
                  Start your city with your first building
                </p>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                {/* Features */}
                <div className="space-y-3">
                  <div
                    className="flex items-center gap-3 p-3 border-2"
                    style={{ borderColor: '#10B981', backgroundColor: 'rgba(16, 185, 129, 0.1)' }}
                  >
                    <div className="w-2 h-2 bg-emerald-400" />
                    <div>
                      <div className="text-sm text-emerald-300" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
                        Self-Custodial
                      </div>
                      <div className="text-xs text-slate-400 mt-1">You keep full control</div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-3 p-3 border-2"
                    style={{ borderColor: '#06B6D4', backgroundColor: 'rgba(6, 182, 212, 0.1)' }}
                  >
                    <div className="w-2 h-2 bg-cyan-400" />
                    <div>
                      <div className="text-sm text-cyan-300" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
                        Gasless Play
                      </div>
                      <div className="text-xs text-slate-400 mt-1">No signing every action</div>
                    </div>
                  </div>

                  <div
                    className="flex items-center gap-3 p-3 border-2"
                    style={{ borderColor: '#A855F7', backgroundColor: 'rgba(168, 85, 247, 0.1)' }}
                  >
                    <div className="w-2 h-2 bg-purple-400" />
                    <div>
                      <div className="text-sm text-purple-300" style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}>
                        Real DeFi
                      </div>
                      <div className="text-xs text-slate-400 mt-1">Built on best protocols</div>
                    </div>
                  </div>
                </div>

                {/* Position Selection */}
                <div className="pt-4 border-t border-slate-700">
                  <label
                    className="text-xs text-slate-400 mb-3 block"
                    style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
                  >
                    Town Hall Position
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">X</label>
                      <input
                        type="number"
                        value={gridX}
                        onChange={(e) => setGridX(Number(e.target.value))}
                        className="w-full bg-slate-800 border-2 border-slate-600 px-4 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                        min="0"
                        max="9"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-slate-500 mb-1 block">Y</label>
                      <input
                        type="number"
                        value={gridY}
                        onChange={(e) => setGridY(Number(e.target.value))}
                        className="w-full bg-slate-800 border-2 border-slate-600 px-4 py-2 text-white font-mono focus:border-amber-500 focus:outline-none"
                        min="0"
                        max="9"
                      />
                    </div>
                  </div>
                </div>

                {/* Error Message */}
                {error && (
                  <div className="p-3 border-2 border-red-500 bg-red-500/10">
                    <div className="text-sm text-red-400">{error}</div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 border-t-2" style={{ borderColor: colors.accent }}>
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-3 border-2 border-slate-600 text-slate-400 hover:bg-slate-800 transition-colors disabled:opacity-50"
                  style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={loading}
                  className="flex-1 py-3 border-2 text-white transition-all hover:brightness-110 disabled:opacity-50"
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: '10px',
                    borderColor: colors.roof,
                    backgroundColor: colors.accent,
                    boxShadow: `3px 3px 0px ${colors.roof}`
                  }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      Creating...
                    </span>
                  ) : (
                    'Create'
                  )}
                </button>
              </div>

              {/* Loading Overlay */}
              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-slate-900/90 flex items-center justify-center"
                >
                  <div className="text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    >
                      <PixelTownHall />
                    </motion.div>
                    <div
                      className="text-white mt-4"
                      style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
                    >
                      Building your city...
                    </div>
                    <div className="text-xs text-slate-400 mt-2">Please wait</div>
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
