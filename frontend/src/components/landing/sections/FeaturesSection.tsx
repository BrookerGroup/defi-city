'use client'

import { motion } from 'framer-motion'
import { PixelCard } from '../pixel'
import { Shield, Zap, Wallet, KeyRound, Clock, Globe } from 'lucide-react'

const features = [
  {
    icon: KeyRound,
    title: 'No Wallet Setup',
    description: 'Login with email or social accounts. We handle the crypto wallet complexity for you.',
    color: '#F59E0B'
  },
  {
    icon: Zap,
    title: 'Zero Gas Fees',
    description: 'Gasless gameplay powered by ERC-4337. Play, build, and manage without transaction costs.',
    color: '#10B981'
  },
  {
    icon: Shield,
    title: 'Non-Custodial',
    description: 'Your keys, your crypto. We never hold your funds. Full self-custody from day one.',
    color: '#06B6D4'
  },
  {
    icon: Clock,
    title: 'Instant Withdrawals',
    description: 'Access your funds anytime. No lockups, no waiting periods. Your money stays yours.',
    color: '#A855F7'
  },
  {
    icon: Wallet,
    title: 'Start Small',
    description: 'Begin with any amount. No minimum deposits to start building your crypto city.',
    color: '#EC4899'
  },
  {
    icon: Globe,
    title: 'Battle-Tested Protocols',
    description: 'Built on Aave, Aerodrome, and Megapot. Proven protocols with billions in value.',
    color: '#F97316'
  }
]

export function FeaturesSection() {
  return (
    <section className="relative py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2
            className="text-3xl md:text-4xl font-bold text-amber-400 mb-4"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            Why DefiCity
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            DeFi made simple. No technical knowledge required.
            Just play and let your crypto work.
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <PixelCard key={feature.title} delay={index * 0.1} variant="default">
              <div className="space-y-3">
                <div
                  className="inline-flex p-3 border-2"
                  style={{
                    backgroundColor: `${feature.color}15`,
                    borderColor: feature.color,
                    boxShadow: `3px 3px 0px ${feature.color}30`
                  }}
                >
                  <feature.icon className="w-6 h-6" style={{ color: feature.color }} />
                </div>
                <h3
                  className="text-sm font-bold text-white"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {feature.title}
                </h3>
                <p className="text-slate-400 text-sm leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </PixelCard>
          ))}
        </div>

        {/* Fee transparency */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16"
        >
          <PixelCard variant="highlight">
            <div className="text-center py-4">
              <h3
                className="text-xl font-bold text-amber-400 mb-2"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                Transparent Fees
              </h3>
              <p className="text-slate-300 mb-4">
                Only <span className="text-amber-400 font-bold">0.05%</span> fee on building creation.
                No hidden charges. No performance fees. No withdrawal fees.
              </p>
              <p className="text-sm text-slate-500">
                That is 20x lower than most DeFi platforms.
              </p>
            </div>
          </PixelCard>
        </motion.div>
      </div>
    </section>
  )
}
