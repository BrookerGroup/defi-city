'use client'

import { motion } from 'framer-motion'
import { PixelCard, BuildingIcon } from '../pixel'

const strategies = [
  {
    type: 'bank' as const,
    name: 'Bank',
    protocol: 'Aave V3',
    description: 'Deposit your crypto into battle-tested lending pools. Your assets work for you around the clock.',
    features: [
      'Supply USDC, ETH, BTC, USDT',
      'Withdraw anytime',
      'Billions in protocol TVL'
    ],
    risk: 'Conservative',
    riskColor: '#10B981'
  },
  {
    type: 'shop' as const,
    name: 'Shop',
    protocol: 'Aerodrome',
    description: 'Provide liquidity to decentralized exchanges. Earn from every trade that passes through.',
    features: [
      'Liquidity provision',
      'Trading fee collection',
      'Protocol rewards'
    ],
    risk: 'Moderate',
    riskColor: '#F59E0B'
  },
  {
    type: 'lottery' as const,
    name: 'Lottery',
    protocol: 'Megapot',
    description: 'Try your luck with provably fair lottery. Chainlink VRF ensures transparent, random draws.',
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
                      Powered by {strategy.protocol}
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
