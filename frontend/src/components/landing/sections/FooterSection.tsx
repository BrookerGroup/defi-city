'use client'

import { motion } from 'framer-motion'

export function FooterSection() {
  return (
    <footer className="relative py-12 px-6 border-t-4 border-slate-800">
      <div className="max-w-6xl mx-auto">
        {/* Trust indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-wrap justify-center gap-4 mb-8"
        >
          {[
            { label: 'Non-Custodial', color: '#10B981' },
            { label: 'Audited Contracts', color: '#06B6D4' },
            { label: 'Built on Base', color: '#A855F7' },
            { label: 'Open Source', color: '#F59E0B' }
          ].map((badge) => (
            <div
              key={badge.label}
              className="px-3 py-1 border-2 text-xs"
              style={{
                borderColor: badge.color,
                color: badge.color,
                backgroundColor: `${badge.color}10`
              }}
            >
              {badge.label}
            </div>
          ))}
        </motion.div>

        {/* Protocol credits */}
        <div className="text-center mb-8">
          <p className="text-slate-400 text-sm">
            Built on the{' '}
            <span className="text-amber-400">Best DeFi Protocols</span>{' '}
            in the Industry
          </p>
        </div>

        {/* Copyright */}
        <div className="text-center space-y-2">
          <p className="text-slate-500 text-sm">
            2025 DefiCity. Building the future of gamified DeFi.
          </p>
        </div>

        {/* Risk warning */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 max-w-2xl mx-auto"
        >
          <p className="text-xs text-slate-600 text-center leading-relaxed">
            Risk Warning: DeFi investments carry risk. Market conditions can change rapidly.
            Only invest what you can afford to lose. Lottery is for entertainment purposes only.
            Always do your own research before participating.
          </p>
        </motion.div>
      </div>
    </footer>
  )
}
