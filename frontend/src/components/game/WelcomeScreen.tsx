'use client'

import { usePrivy } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'
import { Loader2, Wallet, Mail, Chrome, Sparkles, Zap, Shield, Coins } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import { IsometricBuilding } from '@/components/landing/IsometricBuilding'
import { ParticleField } from '@/components/landing/ParticleField'
import { FeatureCard } from '@/components/landing/FeatureCard'
import { useRef } from 'react'
import { useRouter } from 'next/navigation'

export function WelcomeScreen() {
  const router = useRouter()
  const { ready } = usePrivy()
  const containerRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end start"]
  })

  const backgroundY = useTransform(scrollYProgress, [0, 1], ['0%', '50%'])
  const cityY = useTransform(scrollYProgress, [0, 1], ['0%', '100%'])
  const textY = useTransform(scrollYProgress, [0, 1], ['0%', '200%'])

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
        <div className="flex items-center gap-3 text-white">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-xl font-bold">Loading DefiCity...</span>
        </div>
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative min-h-screen overflow-x-hidden bg-slate-950">
      {/* Animated gradient background */}
      <motion.div
        className="fixed inset-0 z-0"
        style={{ y: backgroundY }}
      >
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 via-pink-500/20 to-purple-600/20" />

        {/* Animated gradient orbs */}
        <motion.div
          className="absolute top-0 left-1/4 w-[800px] h-[800px] bg-gradient-radial from-orange-500/30 to-transparent rounded-full blur-3xl"
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-gradient-radial from-purple-500/30 to-transparent rounded-full blur-3xl"
          animate={{
            x: [0, -100, 0],
            y: [0, 50, 0],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 w-[700px] h-[700px] bg-gradient-radial from-pink-500/20 to-transparent rounded-full blur-3xl"
          animate={{
            rotate: 360,
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear"
          }}
        />

        {/* Grid overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)',
          backgroundSize: '100px 100px'
        }} />

        {/* Particle field */}
        <ParticleField count={80} />
      </motion.div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
          {/* Hero Text */}
          <motion.div
            style={{ y: textY }}
            className="text-center space-y-8 mb-16"
          >
            {/* Logo/Badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: "backOut" }}
              className="inline-block"
            >
              <div className="relative">
                <motion.div
                  className="absolute -inset-2 bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 rounded-full blur-xl opacity-75"
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: 360,
                  }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                  }}
                />
                <div className="relative bg-slate-950 rounded-full px-6 py-3 border border-white/20">
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 font-bold text-sm tracking-wider">
                    ⚡ POWERED BY BASE BLOCKCHAIN
                  </span>
                </div>
              </div>
            </motion.div>

            {/* Main Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-7xl md:text-9xl font-black tracking-tighter"
            >
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400">
                DefiCity
              </span>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
              className="text-2xl md:text-4xl font-bold text-white/90 max-w-3xl mx-auto leading-tight"
            >
              Build your DeFi empire.
              <br />
              Earn real yields while you play.
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed"
            >
              Place buildings that interact with real DeFi protocols. Your city grows, your crypto grows.
              Self-custodial, gasless, and 100% on-chain.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
            >
              <Button
                onClick={() => router.push('/app')}
                size="lg"
                className="group relative overflow-hidden bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white border-0 px-8 py-6 text-lg font-bold rounded-xl shadow-2xl hover:shadow-orange-500/50 transition-all duration-300"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Start Building Now
                </span>
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"
                  initial={{ x: '100%' }}
                  whileHover={{ x: 0 }}
                  transition={{ duration: 0.3 }}
                />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-2 border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold rounded-xl"
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
              >
                Learn More
              </Button>
            </motion.div>
          </motion.div>

          {/* Isometric City - Floating Buildings */}
          <motion.div
            style={{ y: cityY }}
            className="relative w-full max-w-6xl h-[400px] perspective-1000"
          >
            {/* Grid of buildings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative w-full h-full">
                {/* Town Hall - Center */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  <IsometricBuilding type="townhall" size="lg" delay={0} floatSpeed={4} />
                </div>

                {/* Bank - Top Left */}
                <div className="absolute top-1/4 left-1/4">
                  <IsometricBuilding type="bank" size="md" delay={0.2} floatSpeed={3.5} />
                </div>

                {/* Shop - Top Right */}
                <div className="absolute top-1/4 right-1/4">
                  <IsometricBuilding type="shop" size="md" delay={0.4} floatSpeed={3.2} />
                </div>

                {/* Lottery - Bottom Left */}
                <div className="absolute bottom-1/4 left-1/3">
                  <IsometricBuilding type="lottery" size="md" delay={0.6} floatSpeed={3.8} />
                </div>

                {/* Additional small buildings */}
                <div className="absolute top-1/3 left-1/6">
                  <IsometricBuilding type="bank" size="sm" delay={0.8} floatSpeed={3} />
                </div>
                <div className="absolute bottom-1/3 right-1/6">
                  <IsometricBuilding type="shop" size="sm" delay={1} floatSpeed={3.3} />
                </div>
              </div>
            </div>

            {/* Connecting lines / roads */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
              <motion.line
                x1="25%" y1="25%" x2="50%" y2="50%"
                stroke="url(#lineGradient1)"
                strokeWidth="2"
                strokeDasharray="10,5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 1 }}
              />
              <motion.line
                x1="75%" y1="25%" x2="50%" y2="50%"
                stroke="url(#lineGradient2)"
                strokeWidth="2"
                strokeDasharray="10,5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 1.2 }}
              />
              <motion.line
                x1="33%" y1="75%" x2="50%" y2="50%"
                stroke="url(#lineGradient3)"
                strokeWidth="2"
                strokeDasharray="10,5"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, delay: 1.4 }}
              />
              <defs>
                <linearGradient id="lineGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#10b981" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id="lineGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#06b6d4" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <linearGradient id="lineGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#a855f7" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
              </defs>
            </svg>
          </motion.div>
        </section>

        {/* Features Section */}
        <section id="features" className="relative py-32 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 mb-6">
                How It Works
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Four simple steps to start earning real yields in your DeFi city
              </p>
            </motion.div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon="🏛️"
                title="Place Town Hall"
                description="Creates your self-custodial SmartWallet on Base. You own it, you control it."
                gradient="from-amber-500 to-orange-600"
                delay={0}
              />
              <FeatureCard
                icon="💰"
                title="Deposit Assets"
                description="Transfer USDC or other tokens to your SmartWallet. Your funds, your control."
                gradient="from-emerald-500 to-green-600"
                delay={0.1}
              />
              <FeatureCard
                icon="🏗️"
                title="Build & Earn"
                description="Place DeFi buildings that interact with Aave, Aerodrome, and Megapot to earn real yields."
                gradient="from-cyan-500 to-blue-600"
                delay={0.2}
              />
              <FeatureCard
                icon="🎮"
                title="Play Gasless"
                description="Use session keys for gasless transactions. Play like a Web2 game, powered by Web3."
                gradient="from-purple-500 to-pink-600"
                delay={0.3}
              />
            </div>
          </div>
        </section>

        {/* DeFi Buildings Section */}
        <section className="relative py-32 px-6 bg-gradient-to-b from-transparent to-slate-950/50">
          <div className="max-w-7xl mx-auto">
            {/* Section Header */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-20"
            >
              <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-purple-400 mb-6">
                DeFi Buildings
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Each building connects to real DeFi protocols on Base blockchain
              </p>
            </motion.div>

            {/* Buildings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<span className="text-4xl">🏦</span>}
                title="Bank (Aave V3)"
                description="Supply stablecoins to Aave and earn interest. Watch your aTokens grow as your city expands."
                gradient="from-emerald-500 to-teal-600"
                delay={0}
              />
              <FeatureCard
                icon={<span className="text-4xl">🏪</span>}
                title="Shop (Aerodrome)"
                description="Provide liquidity to Aerodrome DEX pools. Earn trading fees and AERO rewards."
                gradient="from-cyan-500 to-blue-600"
                delay={0.1}
              />
              <FeatureCard
                icon={<span className="text-4xl">🎰</span>}
                title="Lottery (Megapot)"
                description="Buy lottery tickets with Megapot. Try your luck for massive jackpot prizes!"
                gradient="from-purple-500 to-pink-600"
                delay={0.2}
              />
            </div>
          </div>
        </section>

        {/* Features Highlights */}
        <section className="relative py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Shield className="w-8 h-8 text-white" />}
                title="Self-Custodial"
                description="You own your SmartWallet. Your keys, your crypto. We never hold your funds."
                gradient="from-green-500 to-emerald-600"
                delay={0}
              />
              <FeatureCard
                icon={<Zap className="w-8 h-8 text-white" />}
                title="Gasless Gameplay"
                description="Session keys enable free transactions. Play without worrying about gas fees."
                gradient="from-yellow-500 to-orange-600"
                delay={0.1}
              />
              <FeatureCard
                icon={<Coins className="w-8 h-8 text-white" />}
                title="Real Yields"
                description="Earn from actual DeFi protocols. Not points, not promises - real crypto rewards."
                gradient="from-blue-500 to-purple-600"
                delay={0.2}
              />
            </div>
          </div>
        </section>

        {/* Final CTA Section */}
        <section className="relative py-32 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="max-w-4xl mx-auto text-center"
          >
            <div className="relative">
              {/* Background glow */}
              <div className="absolute -inset-8 bg-gradient-to-r from-orange-500/20 via-pink-500/20 to-purple-500/20 rounded-3xl blur-3xl" />

              {/* Content */}
              <div className="relative bg-slate-900/50 backdrop-blur-xl border border-white/10 rounded-3xl p-12 space-y-8">
                <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400">
                  Ready to Build?
                </h2>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                  Join DefiCity and start earning yields from real DeFi protocols.
                  Your city, your crypto, your way.
                </p>

                {/* Login Options */}
                <div className="space-y-4 pt-8">
                  <Button
                    onClick={() => router.push('/app')}
                    size="lg"
                    className="w-full max-w-md group relative overflow-hidden bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white border-0 px-8 py-6 text-lg font-bold rounded-xl shadow-2xl hover:shadow-orange-500/50 transition-all duration-300"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Wallet className="w-5 h-5" />
                      Connect with Wallet
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"
                      initial={{ x: '100%' }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </Button>

                  <Button
                    onClick={() => router.push('/app')}
                    variant="outline"
                    size="lg"
                    className="w-full max-w-md border-2 border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold rounded-xl"
                  >
                    <Mail className="mr-3 h-5 w-5" />
                    Continue with Email
                  </Button>

                  <Button
                    onClick={() => router.push('/app')}
                    variant="outline"
                    size="lg"
                    className="w-full max-w-md border-2 border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 px-8 py-6 text-lg font-semibold rounded-xl"
                  >
                    <Chrome className="mr-3 h-5 w-5" />
                    Continue with Google
                  </Button>
                </div>

                <p className="text-sm text-slate-400 pt-4">
                  By connecting, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="relative py-12 px-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto text-center text-slate-400 text-sm">
            <p>© 2025 DefiCity. Built on Base blockchain. Powered by Aave, Aerodrome & Megapot.</p>
          </div>
        </footer>
      </div>
    </div>
  )
}
