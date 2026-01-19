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
  
  // Fixed position at center of map (5,5)
  const GRID_SIZE = 10
  const centerX = Math.floor(GRID_SIZE / 2)
  const centerY = Math.floor(GRID_SIZE / 2)
  
  const [createdWalletAddress, setCreatedWalletAddress] = useState<string | null>(null)
  const [showSuccess, setShowSuccess] = useState(false)

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
    const result = await createTownHall(userAddress, centerX, centerY)

    if (result.success && result.walletAddress) {
      // Add town hall to the game store at center
      addBuilding({
        id: `townhall-${Date.now()}`,
        type: 'townhall',
        position: { x: centerX, y: centerY },
        createdAt: Date.now(),
      })

      // Show success screen with wallet address
      setCreatedWalletAddress(result.walletAddress)
      setShowSuccess(true)
      
      // Auto-close after showing address
      setTimeout(() => {
        if (result.walletAddress) {
          onSuccess(result.walletAddress, result.buildingId || 1)
        }
        onClose()
        setShowSuccess(false)
      }, 5000)
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

                {/* Auto-placed at center info */}
                <div className="pt-4 border-t border-slate-700">
                  <div className="text-center p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div
                      className="text-xs text-slate-400 mb-2"
                      style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
                    >
                      Auto-Placement
                    </div>
                    <div className="text-sm text-slate-300">
                      Town Hall will be placed at the center of your map
                    </div>
                    <div className="text-xs text-emerald-400 mt-2 font-mono">
                      Position: ({centerX}, {centerY})
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

              {/* Success Overlay */}
              {showSuccess && createdWalletAddress && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute inset-0 bg-slate-900/95 flex items-center justify-center z-10"
                >
                  <div className="text-center max-w-md px-6">
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', duration: 0.5 }}
                    >
                      <PixelTownHall />
                    </motion.div>
                    <div
                      className="text-emerald-400 mt-4 mb-6"
                      style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}
                    >
                      Success!
                    </div>
                    <div className="text-sm text-slate-300 mb-4">
                      Your Smart Wallet has been created!
                    </div>
                    <div className="p-4 bg-slate-800 rounded-lg border-2 border-emerald-500/30">
                      <div className="text-xs text-slate-400 mb-2">Smart Wallet Address:</div>
                      <div className="text-xs font-mono text-emerald-400 break-all">
                        {createdWalletAddress}
                      </div>
                    </div>
                    <div className="text-xs text-slate-500 mt-4">
                      Redirecting to your city...
                    </div>
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
