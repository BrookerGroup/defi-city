'use client'

import { usePrivy } from '@privy-io/react-auth'
import { useAccount } from 'wagmi'
import { motion } from 'framer-motion'
import { Loader2, Wallet, LogOut, CheckCircle, FileSignature } from 'lucide-react'
import { useState, useEffect } from 'react'

export default function AppPage() {
  const { ready, authenticated, user, login, logout, signMessage: privySignMessage } = usePrivy()
  const { address, isConnected } = useAccount()

  const [isSigned, setIsSigned] = useState(false)
  const [hasTriggeredSign, setHasTriggeredSign] = useState(false)
  const [signRejected, setSignRejected] = useState(false)
  const [isCheckingSignature, setIsCheckingSignature] = useState(true)

  // Check if already signed (from localStorage) - runs FIRST
  useEffect(() => {
    if (authenticated && user) {
      const signatureKey = `signature_${user.id}`
      const savedSignature = localStorage.getItem(signatureKey)

      console.log('[Sign Check]', { userId: user.id, hasSavedSignature: !!savedSignature })

      if (savedSignature) {
        setIsSigned(true)
      } else {
        // Reset states when new user or no signature found
        setIsSigned(false)
        setHasTriggeredSign(false)
        setSignRejected(false)
      }

      // Mark checking as complete
      setIsCheckingSignature(false)
    } else {
      // Reset everything when not authenticated
      setIsCheckingSignature(false)
      setIsSigned(false)
      setHasTriggeredSign(false)
      setSignRejected(false)
    }
  }, [authenticated, user])

  // Auto-trigger sign after connect - ONLY after checking localStorage
  useEffect(() => {
    // Wait for signature check to complete
    if (isCheckingSignature) {
      console.log('[Auto-Sign] Still checking localStorage...')
      return
    }

    if (authenticated && !isSigned && !hasTriggeredSign && user) {
      console.log('[Auto-Sign] Triggering sign with Privy...')

      setHasTriggeredSign(true)

      // Use Privy's signMessage - works for ALL wallet types
      const walletAddress = user?.wallet?.address || address || 'unknown'
      const message = `Welcome to DeFi City!\n\nPlease sign this message to verify your wallet ownership.\n\nWallet: ${walletAddress}\nTimestamp: ${new Date().toISOString()}`

      // Privy's signMessage handles all wallet types automatically
      privySignMessage(message)
        .then((signature) => {
          console.log('[Sign Success] Signature:', signature)
          const signatureKey = `signature_${user.id}`
          localStorage.setItem(signatureKey, 'signed')
          setIsSigned(true)
        })
        .catch((error) => {
          console.error('[Sign Error]', error)
          setSignRejected(true)
          // Disconnect after 1 second
          setTimeout(() => {
            logout()
          }, 1000)
        })
    }
  }, [authenticated, isSigned, hasTriggeredSign, user, address, isCheckingSignature, privySignMessage, logout])

  // Loading state
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          <span
            className="text-amber-400 text-sm"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            Loading...
          </span>
        </div>
      </div>
    )
  }

  // Not authenticated - show login screen
  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4 relative overflow-hidden">
        {/* Animated Background Grid */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `
              linear-gradient(rgba(245, 158, 11, 0.1) 1px, transparent 1px),
              linear-gradient(90deg, rgba(245, 158, 11, 0.1) 1px, transparent 1px)
            `,
            backgroundSize: '50px 50px',
          }} />
        </div>

        {/* Floating Particles */}
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-amber-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -30, 0],
              opacity: [0.2, 0.8, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-lg w-full space-y-8 text-center relative z-10"
        >
          {/* Logo with Glow Effect */}
          <motion.div
            animate={{
              textShadow: [
                "0 0 20px rgba(245, 158, 11, 0.5)",
                "0 0 40px rgba(245, 158, 11, 0.8)",
                "0 0 20px rgba(245, 158, 11, 0.5)",
              ]
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <h1
              className="text-amber-400 text-4xl mb-4"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              DEFICITY
            </h1>
          </motion.div>

          {/* Subtitle with typing effect */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-slate-300 text-lg mb-8"
          >
            Build Your City, Earn Real Crypto
          </motion.p>

          {/* Feature Pills */}
          <div className="flex flex-wrap justify-center gap-2 mb-8">
            {['🏗️ Build', '💰 Earn', '🎮 Play'].map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-full text-sm text-slate-300"
              >
                {feature}
              </motion.div>
            ))}
          </div>

          {/* Main Connect Button with Enhanced Effects */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="relative"
          >
            {/* Glow Effect */}
            <motion.div
              className="absolute inset-0 bg-amber-400 rounded-lg blur-xl opacity-20"
              animate={{
                opacity: [0.2, 0.4, 0.2],
                scale: [1, 1.05, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />

            {/* Button */}
            <motion.button
              onClick={login}
              className="relative w-full px-8 py-6 border-4 text-white flex items-center justify-center gap-4 overflow-hidden group"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                fontSize: "14px",
                borderColor: "#F59E0B",
                backgroundColor: "#B45309",
                boxShadow: "8px 8px 0px #92400E",
              }}
              whileHover={{
                scale: 1.05,
                y: -4,
                boxShadow: "12px 12px 0px #92400E",
              }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Shine Effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-0 group-hover:opacity-20"
                animate={{
                  x: [-200, 200],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />

              {/* Wallet Icon with Bounce */}
              <motion.div
                animate={{
                  rotate: [0, -10, 10, -10, 0],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  repeatDelay: 3,
                }}
              >
                <Wallet className="h-6 w-6" />
              </motion.div>

              <span>Connect Wallet</span>
            </motion.button>
          </motion.div>

          {/* Support Info Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1 }}
            className="grid grid-cols-3 gap-4 mt-8"
          >
            {[
              { icon: '🦊', text: 'MetaMask' },
              { icon: '🔗', text: 'WalletConnect' },
              { icon: '📧', text: 'Email/Social' },
            ].map((item, i) => (
              <motion.div
                key={i}
                className="p-4 bg-slate-800/50 border border-slate-700 rounded-lg backdrop-blur"
                whileHover={{ scale: 1.05, y: -2 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <div className="text-2xl mb-2">{item.icon}</div>
                <div className="text-xs text-slate-400">{item.text}</div>
              </motion.div>
            ))}
          </motion.div>

          {/* Security Badge */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="flex items-center justify-center gap-2 text-xs text-slate-500"
          >
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span>🔒 Secure authentication powered by Privy</span>
          </motion.div>
        </motion.div>
      </div>
    )
  }

  // Authenticated but not signed - show minimal state (Privy handles UI)
  if (authenticated && !isSigned) {
    // Show rejection message if sign was rejected
    if (signRejected) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full text-center space-y-6"
          >
            <motion.div
              animate={{
                rotate: [0, 10, -10, 0],
              }}
              transition={{
                duration: 0.5,
              }}
            >
              <div className="h-20 w-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <LogOut className="h-10 w-10 text-red-400" />
              </div>
            </motion.div>

            <div>
              <h2
                className="text-red-400 text-xl mb-3"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                Signature Rejected
              </h2>
              <p className="text-slate-300 text-sm mb-2">
                You need to sign the message to continue
              </p>
              <p className="text-slate-500 text-xs">
                Disconnecting...
              </p>
            </div>

            <Loader2 className="h-6 w-6 animate-spin text-slate-400 mx-auto" />
          </motion.div>
        </div>
      )
    }

    // Minimal loading while Privy handles sign UI
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-amber-400" />
          <span
            className="text-amber-400 text-sm"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            Verifying...
          </span>
        </div>
      </div>
    )
  }

  // Authenticated and signed - show dashboard
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <h1
            className="text-amber-400 text-xl"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            DEFICITY
          </h1>
          <motion.button
            onClick={logout}
            className="px-4 py-2 border-2 border-red-600 bg-red-700 text-white rounded hover:bg-red-600 transition-colors flex items-center gap-2 text-sm"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <LogOut className="h-4 w-4" />
            Logout
          </motion.button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Welcome Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-2 border-green-700 rounded-lg bg-slate-800 p-6 relative overflow-hidden"
          >
            {/* Success indicator */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/10 rounded-full blur-3xl" />

            <div className="flex items-start gap-3 mb-4">
              <motion.div
                animate={{
                  scale: [1, 1.2, 1],
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                }}
              >
                <CheckCircle className="h-8 w-8 text-green-400" />
              </motion.div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">
                  Welcome to DeFi City! 🎮
                </h2>
                <div className="flex items-center gap-2 mb-3">
                  <div className="px-3 py-1 bg-green-900/50 border border-green-700 rounded-full text-xs text-green-400 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    Verified & Signed
                  </div>
                </div>
              </div>
            </div>

            <p className="text-slate-300 mb-4">
              You're successfully connected and verified. Start building your city and earning crypto!
            </p>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between p-3 bg-slate-900 rounded">
                <span className="text-slate-400">Login Method:</span>
                <span className="text-white font-mono">
                  {user?.email?.address || user?.google?.email || 'External Wallet'}
                </span>
              </div>
              {user?.wallet?.address && (
                <div className="flex items-center justify-between p-3 bg-slate-900 rounded">
                  <span className="text-slate-400">Privy Wallet:</span>
                  <span className="text-white font-mono text-xs">
                    {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
                  </span>
                </div>
              )}
              {isConnected && address && (
                <div className="flex items-center justify-between p-3 bg-slate-900 rounded border border-amber-600">
                  <span className="text-slate-400">External Wallet:</span>
                  <span className="text-amber-400 font-mono text-xs">
                    {address.slice(0, 6)}...{address.slice(-4)}
                  </span>
                </div>
              )}
            </div>
          </motion.div>

          {/* Next Steps */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="border-2 border-slate-700 rounded-lg bg-slate-800 p-6"
          >
            <h3 className="text-lg font-bold text-white mb-4">Next Steps</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-2xl">🏗️</span>
                <div>
                  <h4 className="text-white font-semibold">Build Your City</h4>
                  <p className="text-slate-400 text-sm">
                    Place buildings and start earning yields
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <h4 className="text-white font-semibold">Deposit Funds</h4>
                  <p className="text-slate-400 text-sm">
                    Add crypto to your smart wallet to start playing
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-2xl">📈</span>
                <div>
                  <h4 className="text-white font-semibold">Earn Yields</h4>
                  <p className="text-slate-400 text-sm">
                    Your buildings generate real DeFi yields
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
