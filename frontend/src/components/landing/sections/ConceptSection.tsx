'use client'

import { motion } from 'framer-motion'
import { PixelCard, BuildingIcon } from '../pixel'
import { Building, Wallet, Coins, Gamepad2 } from 'lucide-react'

const concepts = [
  {
    game: 'Your City',
    defi: 'Your Portfolio',
    description: 'Every city you build represents your crypto holdings. Watch it grow as your investments prosper.',
    icon: Wallet,
    color: '#F59E0B'
  },
  {
    game: 'Buildings',
    defi: 'Strategies',
    description: 'Each building type connects to real DeFi protocols. Different buildings, different opportunities.',
    icon: Building,
    color: '#10B981'
  },
  {
    game: 'Resources',
    defi: 'Real Crypto',
    description: 'The coins you earn are actual USDC, ETH, and BTC. Not points. Not tokens. Real assets.',
    icon: Coins,
    color: '#06B6D4'
  },
  {
    game: 'Playing',
    defi: 'Managing DeFi',
    description: 'Complex DeFi operations simplified into intuitive game mechanics anyone can understand.',
    icon: Gamepad2,
    color: '#A855F7'
  }
]

export function ConceptSection() {
  return (
    <section id="concept" className="relative py-24 px-6">
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
            The Game is Real
          </h2>
          <p className="text-lg text-slate-400 max-w-2xl mx-auto">
            Every action in DefiCity corresponds to real decentralized finance operations.
            No simulation. Real protocols. Real crypto.
          </p>
        </motion.div>

        {/* Concept grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {concepts.map((concept, index) => (
            <PixelCard key={concept.game} delay={index * 0.1} variant="default">
              <div className="flex items-start gap-4">
                <div
                  className="p-3 border-2"
                  style={{
                    backgroundColor: `${concept.color}20`,
                    borderColor: concept.color,
                    boxShadow: `3px 3px 0px ${concept.color}40`
                  }}
                >
                  <concept.icon className="w-6 h-6" style={{ color: concept.color }} />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className="text-sm font-bold"
                      style={{
                        color: concept.color,
                        fontFamily: '"Press Start 2P", monospace'
                      }}
                    >
                      {concept.game}
                    </span>
                    <span className="text-slate-500">=</span>
                    <span className="text-white font-semibold">
                      {concept.defi}
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm leading-relaxed">
                    {concept.description}
                  </p>
                </div>
              </div>
            </PixelCard>
          ))}
        </div>

        {/* Visual metaphor */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16 text-center"
        >
          <div className="inline-flex items-center gap-4 px-6 py-4 bg-slate-800/50 border-2 border-slate-700">
            <div className="flex gap-2">
              <BuildingIcon type="bank" size={40} />
              <BuildingIcon type="shop" size={40} />
              <BuildingIcon type="lottery" size={40} />
            </div>
            <div className="text-slate-500">=</div>
            <div className="text-slate-300 font-medium">
              <span className="text-emerald-400">Aave</span> +{' '}
              <span className="text-cyan-400">Aerodrome</span> +{' '}
              <span className="text-purple-400">Megapot</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
