'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useHasWallet } from '@/hooks/useContracts'
import {
  PixiGameCanvas,
  TopBar,
  BottomBar,
  CreateTownHallModal,
} from '@/components/game'
import { WalletInfo, DepositForm, WithdrawForm } from '@/components/wallet'
import { useGameStore } from '@/store/gameStore'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { BUILDING_INFO } from '@/types'

// Pixel Art Town Hall for Welcome Screen
function PixelTownHallLarge() {
  const colors = BUILDING_INFO.townhall.colors

  return (
    <motion.svg
      width={120}
      height={120}
      viewBox="0 0 16 16"
      style={{ imageRendering: 'pixelated' }}
      animate={{ y: [0, -6, 0] }}
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

export default function AppPage() {
  const { ready, authenticated, user } = usePrivy()
  const eoaAddress = user?.wallet?.address
  const { hasWallet, loading: walletLoading } = useHasWallet(eoaAddress)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showTownHallModal, setShowTownHallModal] = useState(false)
  const [walletAddress, setWalletAddress] = useState<string | null>(null)

  // Also check local buildings from gameStore
  const localBuildings = useGameStore((state) => state.buildings)
  const hasLocalTownHall = localBuildings.some(b => b.type === 'townhall')

  // User has wallet if blockchain says so OR local storage has a town hall
  const userHasWallet = hasWallet || hasLocalTownHall

  // Not ready yet
  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(to bottom, #0f172a, #1e1b4b, #0f172a)' }}
      >
        <div className="text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
          >
            <PixelTownHallLarge />
          </motion.div>
          <p
            className="text-amber-400 mt-4"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}
          >
            Loading DefiCity...
          </p>
        </div>
      </div>
    )
  }

  // Loading wallet status
  if (walletLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'linear-gradient(to bottom, #0f172a, #1e1b4b, #0f172a)' }}
      >
        <div className="text-center">
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 1, repeat: Infinity }}
          >
            <PixelTownHallLarge />
          </motion.div>
          <p
            className="text-emerald-400 mt-4"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}
          >
            Checking your city...
          </p>
        </div>
      </div>
    )
  }

  // User needs to create Town Hall
  if (authenticated && !userHasWallet) {
    return (
      <>
        <main
          className="relative min-h-screen overflow-hidden"
          style={{ background: 'linear-gradient(to bottom, #0f172a, #1e1b4b, #0f172a)' }}
        >
          <TopBar />

          {/* Animated background stars */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(30)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                }}
                animate={{ opacity: [0.2, 0.8, 0.2] }}
                transition={{
                  duration: 2 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2
                }}
              />
            ))}
          </div>

          {/* Welcome Message */}
          <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
            <motion.div
              className="text-center space-y-6 pointer-events-auto max-w-2xl px-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <PixelTownHallLarge />

              <h1
                className="text-3xl md:text-4xl"
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  color: '#F59E0B'
                }}
              >
                Welcome to DefiCity
              </h1>

              <p className="text-lg text-slate-300">
                Start your journey by creating your Town Hall
              </p>

              <motion.button
                onClick={() => setShowTownHallModal(true)}
                className="px-8 py-4 border-4 text-white transition-all"
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: '12px',
                  borderColor: '#F59E0B',
                  backgroundColor: '#B45309',
                  boxShadow: '6px 6px 0px #92400E'
                }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
              >
                Create Town Hall
              </motion.button>
            </motion.div>
          </div>

          {/* Faded grid background */}
          <div className="opacity-20">
            <PixiGameCanvas />
          </div>

          <BottomBar />
        </main>

        {/* Town Hall Modal */}
        <CreateTownHallModal
          isOpen={showTownHallModal}
          onClose={() => setShowTownHallModal(false)}
          onSuccess={(wallet, buildingId) => {
            setWalletAddress(wallet)
            setShowTownHallModal(false)
            // Refresh page to show game with wallet
            window.location.reload()
          }}
        />
      </>
    )
  }

  // Show game (user has wallet)
  return (
    <main className="relative min-h-screen overflow-hidden">
      <TopBar />
      <PixiGameCanvas />
      <BottomBar />

      {/* Sidebar Toggle */}
      <motion.button
        className="fixed right-0 top-1/2 -translate-y-1/2 z-50 border-2 border-r-0 p-2"
        style={{
          backgroundColor: '#0f172a',
          borderColor: '#475569'
        }}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        whileHover={{ x: -4 }}
      >
        {sidebarOpen ? (
          <ChevronRight className="h-5 w-5 text-slate-400" />
        ) : (
          <ChevronLeft className="h-5 w-5 text-slate-400" />
        )}
      </motion.button>

      {/* Sidebar Panel */}
      <motion.div
        className="fixed right-0 top-16 bottom-24 w-80 z-40 overflow-y-auto border-l-2"
        style={{
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          borderColor: '#475569'
        }}
        initial={{ x: '100%' }}
        animate={{ x: sidebarOpen ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <div className="p-4 space-y-4">
          <div
            className="text-center py-2 border-b-2"
            style={{ borderColor: '#475569' }}
          >
            <span
              className="text-amber-400"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
            >
              Wallet
            </span>
          </div>
          <WalletInfo />

          <div
            className="text-center py-2 border-b-2"
            style={{ borderColor: '#475569' }}
          >
            <span
              className="text-emerald-400"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
            >
              Actions
            </span>
          </div>
          <DepositForm smartWalletAddress={(walletAddress as `0x${string}`) || null} />
          <WithdrawForm smartWalletAddress={(walletAddress as `0x${string}`) || null} />
        </div>
      </motion.div>
    </main>
  )
}
