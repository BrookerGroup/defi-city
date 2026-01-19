'use client'

import { motion } from 'framer-motion'
import { PixelCard, BuildingIcon } from '../pixel'
import { Tractor, Factory, Store, Lock, TowerControl, Pickaxe } from 'lucide-react'

const strategies = [
  {
    type: 'bank' as const,
    name: 'Bank',
    category: 'Lending Protocol',
    description: 'Deposit your crypto into battle-tested lending pools. Your assets work for you around the clock.',
    features: [
      'Supply USDC, ETH, BTC, USDT',
      'Withdraw anytime',
      'Industry-leading security'
    ],
    risk: 'Conservative',
    riskColor: '#10B981'
  },
  {
    type: 'shop' as const,
    name: 'Shop',
    category: 'DEX Liquidity',
    description: 'Provide liquidity to decentralized exchanges. Earn from every trade that passes through.',
    features: [
      'Liquidity provision',
      'Trading rewards',
      'Protocol rewards'
    ],
    risk: 'Moderate',
    riskColor: '#F59E0B'
  },
  {
    type: 'lottery' as const,
    name: 'Lottery',
    category: 'Prize Games',
    description: 'Try your luck with provably fair lottery. Verifiable randomness ensures transparent draws.',
    features: [
      'Verifiable randomness',
      'Transparent draws',
      'Prize pool jackpots'
    ],
    risk: 'High Variance',
    riskColor: '#EF4444'
  }
]

export function StrategiesSection() {
  return (
    <section className="relative py-24 px-6 bg-gradient-to-b from-transparent via-slate-800/30 to-transparent">
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
            Choose Your Buildings
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Each building connects to real DeFi protocols.
            Pick your strategy based on your goals.
          </p>
        </motion.div>

        {/* Buildings grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {strategies.map((strategy, index) => (
            <PixelCard
              key={strategy.name}
              delay={index * 0.15}
              variant="default"
            >
              <div className="space-y-4">
                {/* Building icon and name */}
                <div className="flex items-center gap-4">
                  <BuildingIcon type={strategy.type} size={64} />
                  <div>
                    <h3
                      className="text-lg font-bold text-white"
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      {strategy.name}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      {strategy.category}
                    </p>
                  </div>
                </div>

                {/* Description */}
                <p className="text-slate-400 text-sm leading-relaxed">
                  {strategy.description}
                </p>

                {/* Features list */}
                <ul className="space-y-2">
                  {strategy.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-slate-300">
                      <div className="w-2 h-2 bg-amber-500" style={{ imageRendering: 'pixelated' }} />
                      {feature}
                    </li>
                  ))}
                </ul>

                {/* Risk indicator */}
                <div className="pt-4 border-t border-slate-700">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 uppercase tracking-wide">Risk Level</span>
                    <span
                      className="text-xs font-bold px-2 py-1 border"
                      style={{
                        color: strategy.riskColor,
                        borderColor: strategy.riskColor,
                        backgroundColor: `${strategy.riskColor}15`
                      }}
                    >
                      {strategy.risk}
                    </span>
                  </div>
                </div>
              </div>
            </PixelCard>
          ))}
        </div>

        {/* Coming Soon Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-16"
        >
          <div className="text-center mb-8">
            <h3
              className="text-xl font-bold text-teal-400 mb-2"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              And Many More...
            </h3>
            <p className="text-sm text-slate-400">
              These are just the beginning. More buildings are coming to expand your city.
            </p>
          </div>

          {/* Coming soon buildings grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { icon: Tractor, name: 'Farm', desc: 'Yield Farming', color: '#22C55E' },
              { icon: Factory, name: 'Factory', desc: 'Auto-Compound', color: '#6366F1' },
              { icon: Store, name: 'Market', desc: 'Spot Trading', color: '#EC4899' },
              { icon: Lock, name: 'Vault', desc: 'Secure Savings', color: '#F59E0B' },
              { icon: TowerControl, name: 'Tower', desc: 'Leverage', color: '#EF4444' },
              { icon: Pickaxe, name: 'Mine', desc: 'Staking', color: '#8B5CF6' },
            ].map((building, index) => (
              <motion.div
                key={building.name}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="relative p-4 border-2 border-slate-700 bg-slate-800/50 text-center group hover:border-slate-600 transition-colors"
              >
                <div
                  className="inline-flex p-3 border-2 mb-3"
                  style={{
                    borderColor: building.color,
                    backgroundColor: `${building.color}15`
                  }}
                >
                  <building.icon className="w-6 h-6" style={{ color: building.color }} />
                </div>
                <h4
                  className="text-xs font-bold text-white mb-1"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {building.name}
                </h4>
                <p className="text-xs text-slate-500">{building.desc}</p>
                <div className="absolute top-2 right-2">
                  <span className="text-[8px] px-1 py-0.5 bg-teal-500/20 text-teal-400 border border-teal-500/30">
                    SOON
                  </span>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Disclaimer */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-center text-xs text-slate-500 mt-8 max-w-2xl mx-auto"
        >
          All DeFi activities carry risk. Performance depends on market conditions.
          Only invest what you can afford to lose.
        </motion.p>
      </div>
    </section>
  )
}
