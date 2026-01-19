'use client'

import { usePrivy } from '@privy-io/react-auth'
import { Button } from '@/components/ui/button'
import { Loader2, Wallet, Mail, Chrome, Sparkles, Zap, Shield, Coins } from 'lucide-react'
import { motion } from 'framer-motion'
import { IsometricBuilding } from '@/components/landing/IsometricBuilding'
import { ParticleField } from '@/components/landing/ParticleField'
import { FeatureCard } from '@/components/landing/FeatureCard'
import { useRouter } from 'next/navigation'

export function WelcomeScreen() {
  const router = useRouter()
  const { ready } = usePrivy()

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
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-b from-indigo-900 via-purple-900 to-slate-900">
      {/* Retro pixel grid background */}
      <div className="fixed inset-0 z-0">
        {/* Pixel grid pattern - like retro games */}
        <div className="absolute inset-0 opacity-20" style={{
          backgroundImage: `
            linear-gradient(rgba(99, 102, 241, 0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(99, 102, 241, 0.3) 1px, transparent 1px)
          `,
          backgroundSize: '32px 32px',
          imageRendering: 'pixelated'
        }} />

        {/* Animated stars/particles - pixel style */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 rounded-sm"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                backgroundColor: ['#FCD34D', '#A78BFA', '#60A5FA', '#34D399'][Math.floor(Math.random() * 4)]
              }}
              animate={{
                opacity: [0.2, 0.8, 0.2],
                scale: [1, 1.5, 1],
              }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>

        {/* Retro gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-indigo-900/60" />

        {/* Scanline effect - retro CRT */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{
          backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 4px)',
          imageRendering: 'pixelated'
        }} />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Hero Section */}
        <section className="min-h-screen flex flex-col items-center justify-center px-6 py-20">
          {/* Hero Text */}
          <div className="text-center space-y-8 mb-16">
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
              The Simplest Way to Earn Crypto.
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                No Wallets. No Gas Fees. Just Play & Earn.
              </span>
            </motion.p>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.6 }}
              className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed"
            >
              Build your city, earn <span className="font-bold text-emerald-400">real yields from DeFi</span> (4-15% APY).
              Login with email, play for free, withdraw anytime.
              <span className="font-semibold text-white"> Join 1,000+ builders earning daily.</span>
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
                  Start Earning Free →
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
                See How It Works ↓
              </Button>
            </motion.div>
          </div>

          {/* Isometric City - Floating Buildings */}
          <div className="relative w-full max-w-6xl h-[400px] perspective-1000">
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
          </div>
        </section>

        {/* Stats / Social Proof Section */}
        <section className="relative py-20 px-6 border-y border-white/10 bg-slate-900/30">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="grid grid-cols-2 md:grid-cols-4 gap-8"
            >
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 mb-2">
                  $10B+
                </div>
                <div className="text-slate-400 text-sm">Total Value Locked on Aave</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-2">
                  4-15%
                </div>
                <div className="text-slate-400 text-sm">Annual Yield (APY)</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 mb-2">
                  $0
                </div>
                <div className="text-slate-400 text-sm">Gas Fees for Playing</div>
              </div>
              <div className="text-center">
                <div className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2">
                  0.05%
                </div>
                <div className="text-slate-400 text-sm">Only Fee (on deposits)</div>
              </div>
            </motion.div>
          </div>
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
              <div className="inline-block px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
                <span className="text-emerald-400 font-semibold text-sm">✓ NO CRYPTO EXPERIENCE NEEDED</span>
              </div>
              <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 mb-6">
                Start Earning in 3 Minutes
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Simple as playing a mobile game. Powerful as managing millions in DeFi.
              </p>
            </motion.div>

            {/* Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              <FeatureCard
                icon="📧"
                title="1. Login with Email"
                description="No MetaMask? No problem. Sign in with email, Google, or any wallet you already have."
                gradient="from-amber-500 to-orange-600"
                delay={0}
              />
              <FeatureCard
                icon="💵"
                title="2. Deposit $10+"
                description="Start small. Deposit USDC, ETH, BTC, or USDT. Works with any amount from $10 to millions."
                gradient="from-emerald-500 to-green-600"
                delay={0.1}
              />
              <FeatureCard
                icon="🏗️"
                title="3. Place Buildings"
                description="Each building earns you money automatically. Banks give 4%, Shops give 12%, Lottery $1M jackpot."
                gradient="from-cyan-500 to-blue-600"
                delay={0.2}
              />
              <FeatureCard
                icon="💸"
                title="4. Harvest & Withdraw"
                description="Collect your earnings daily. Withdraw anytime, no fees, no lock-ups. Your money, always available."
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
                Choose Your Strategy
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Every building earns you money 24/7. Pick steady income or go for the jackpot.
              </p>
            </motion.div>

            {/* Buildings Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<span className="text-4xl">🏦</span>}
                title="Bank — 4% APY Safe Returns"
                description="Deposit USDC, ETH, BTC, or USDT into battle-tested Aave protocol. Earn steady interest while you sleep. Withdraw anytime. $10B+ already trusted."
                gradient="from-emerald-500 to-teal-600"
                delay={0}
              />
              <FeatureCard
                icon={<span className="text-4xl">🏪</span>}
                title="Shop — 8-15% APY High Yield"
                description="Provide liquidity on Aerodrome DEX. Earn from every trade + bonus AERO tokens. Higher rewards, slightly higher risk. Perfect for experienced players."
                gradient="from-cyan-500 to-blue-600"
                delay={0.1}
              />
              <FeatureCard
                icon={<span className="text-4xl">🎰</span>}
                title="Lottery — $1M+ Jackpot"
                description="Feeling lucky? Buy tickets for Megapot's massive jackpot. Provably fair, powered by Chainlink VRF. Pure entertainment, huge prizes!"
                gradient="from-purple-500 to-pink-600"
                delay={0.2}
              />
            </div>
          </div>
        </section>

        {/* Features Highlights */}
        <section className="relative py-32 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Trust badges section */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h3 className="text-3xl md:text-4xl font-bold text-white mb-4">
                Why Choose DefiCity?
              </h3>
              <p className="text-lg text-slate-400">
                The safest, simplest way to earn from DeFi
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Shield className="w-8 h-8 text-white" />}
                title="Your Money Stays Yours"
                description="100% non-custodial. Your wallet, your keys, your control. We can't touch your funds - ever. Withdraw everything with one click."
                gradient="from-green-500 to-emerald-600"
                delay={0}
              />
              <FeatureCard
                icon={<Zap className="w-8 h-8 text-white" />}
                title="Zero Fees to Play"
                description="No gas fees. No withdrawal fees. No performance fees. Only 0.05% when you create a building. That's it. 20x cheaper than competitors."
                gradient="from-yellow-500 to-orange-600"
                delay={0.1}
              />
              <FeatureCard
                icon={<Coins className="w-8 h-8 text-white" />}
                title="Real Money, Not Points"
                description="Earn USDC, ETH, and BTC daily from battle-tested protocols like Aave ($10B TVL). Not fake tokens. Not promises. Real crypto you can spend."
                gradient="from-blue-500 to-purple-600"
                delay={0.2}
              />
            </div>
          </div>
        </section>

        {/* Who is this for Section */}
        <section className="relative py-32 px-6 bg-gradient-to-b from-transparent to-slate-950/50">
          <div className="max-w-7xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
              className="text-center mb-16"
            >
              <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400 mb-6">
                Perfect For Everyone
              </h2>
              <p className="text-xl text-slate-300 max-w-3xl mx-auto">
                Whether you're brand new to crypto or a seasoned DeFi veteran
              </p>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0 }}
                className="relative bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 rounded-2xl p-8"
              >
                <div className="text-4xl mb-4">🌱</div>
                <h3 className="text-2xl font-bold text-white mb-3">Crypto Beginners</h3>
                <p className="text-slate-300 mb-4">
                  Never touched crypto before? Start here. We'll create your wallet, no complex setup needed.
                </p>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">→</span>
                    <span>Login with email (that's it!)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">→</span>
                    <span>Start with just $10</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400">→</span>
                    <span>Step-by-step guidance</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="relative bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-2xl p-8"
              >
                <div className="text-4xl mb-4">🎮</div>
                <h3 className="text-2xl font-bold text-white mb-3">Casual Gamers</h3>
                <p className="text-slate-300 mb-4">
                  Love city builders? Earn real money while playing. It's like SimCity meets your savings account.
                </p>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400">→</span>
                    <span>Fun, visual city-building</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400">→</span>
                    <span>Earn while you play</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-cyan-400">→</span>
                    <span>Free to play (no gas fees)</span>
                  </li>
                </ul>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="relative bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-2xl p-8"
              >
                <div className="text-4xl mb-4">💎</div>
                <h3 className="text-2xl font-bold text-white mb-3">DeFi Experts</h3>
                <p className="text-slate-300 mb-4">
                  Already farming yields? Manage all your positions in one beautiful dashboard with zero gas costs.
                </p>
                <ul className="space-y-2 text-sm text-slate-400">
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">→</span>
                    <span>Multi-protocol management</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">→</span>
                    <span>Advanced strategies (leverage, LP)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-purple-400">→</span>
                    <span>Lowest fees in DeFi (0.05%)</span>
                  </li>
                </ul>
              </motion.div>
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
                {/* Social proof badge */}
                <div className="flex justify-center gap-2 mb-6">
                  <div className="px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="text-emerald-400 font-semibold text-sm">🔥 1,000+ Active Players</span>
                  </div>
                  <div className="px-4 py-2 rounded-full bg-purple-500/10 border border-purple-500/20">
                    <span className="text-purple-400 font-semibold text-sm">💰 $5M+ Earned</span>
                  </div>
                </div>

                <h2 className="text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-pink-400 to-purple-400">
                  Start Earning Today
                </h2>
                <p className="text-xl text-slate-300 max-w-2xl mx-auto">
                  <span className="font-bold text-emerald-400">Free to start.</span> No credit card required.
                  <br />
                  Join thousands earning passive income while they sleep.
                </p>

                {/* Value props */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto text-left">
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 text-xl">✓</span>
                    <span className="text-slate-300 text-sm">Setup in 60 seconds</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 text-xl">✓</span>
                    <span className="text-slate-300 text-sm">Withdraw anytime</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <span className="text-emerald-400 text-xl">✓</span>
                    <span className="text-slate-300 text-sm">Battle-tested protocols</span>
                  </div>
                </div>

                {/* Login Options */}
                <div className="space-y-4 pt-8">
                  <Button
                    onClick={() => router.push('/app')}
                    size="lg"
                    className="w-full max-w-md group relative overflow-hidden bg-gradient-to-r from-orange-500 via-pink-500 to-purple-500 text-white border-0 px-8 py-6 text-lg font-bold rounded-xl shadow-2xl hover:shadow-orange-500/50 transition-all duration-300"
                  >
                    <span className="relative z-10 flex items-center justify-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      Start Building Free →
                    </span>
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"
                      initial={{ x: '100%' }}
                      whileHover={{ x: 0 }}
                      transition={{ duration: 0.3 }}
                    />
                  </Button>

                  <div className="flex items-center gap-3 max-w-md mx-auto">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="text-slate-500 text-sm">or sign in with</span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  <div className="flex gap-3 max-w-md mx-auto">
                    <Button
                      onClick={() => router.push('/app')}
                      variant="outline"
                      size="lg"
                      className="flex-1 border-2 border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 px-6 py-4 text-base font-semibold rounded-xl"
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      Email
                    </Button>

                    <Button
                      onClick={() => router.push('/app')}
                      variant="outline"
                      size="lg"
                      className="flex-1 border-2 border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 px-6 py-4 text-base font-semibold rounded-xl"
                    >
                      <Chrome className="mr-2 h-4 w-4" />
                      Google
                    </Button>

                    <Button
                      onClick={() => router.push('/app')}
                      variant="outline"
                      size="lg"
                      className="flex-1 border-2 border-white/20 bg-white/5 backdrop-blur-xl text-white hover:bg-white/10 px-6 py-4 text-base font-semibold rounded-xl"
                    >
                      <Wallet className="mr-2 h-4 w-4" />
                      Wallet
                    </Button>
                  </div>
                </div>

                <p className="text-xs text-slate-500 pt-4">
                  By signing up, you agree to our Terms of Service and Privacy Policy
                </p>
              </div>
            </div>
          </motion.div>
        </section>

        {/* Footer */}
        <footer className="relative py-12 px-6 border-t border-white/10">
          <div className="max-w-7xl mx-auto">
            {/* Trust badges */}
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <span className="text-slate-300 text-xs font-medium">🔒 Non-Custodial</span>
              </div>
              <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <span className="text-slate-300 text-xs font-medium">✅ Audited Contracts</span>
              </div>
              <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <span className="text-slate-300 text-xs font-medium">⚡ Built on Base</span>
              </div>
              <div className="px-4 py-2 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <span className="text-slate-300 text-xs font-medium">🛡️ Battle-Tested Protocols</span>
              </div>
            </div>

            <div className="text-center text-slate-400 text-sm space-y-2">
              <p className="font-medium text-slate-300">
                Powered by <span className="text-emerald-400">Aave V3</span>, <span className="text-cyan-400">Aerodrome</span> & <span className="text-purple-400">Megapot</span>
              </p>
              <p>© 2025 DefiCity. Building the future of gamified DeFi on Base blockchain.</p>
              <p className="text-xs text-slate-500 max-w-2xl mx-auto pt-4">
                Risk Warning: DeFi investments carry risk. Yields are variable and not guaranteed. Only invest what you can afford to lose.
                Lottery is for entertainment only. Always DYOR (Do Your Own Research).
              </p>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
