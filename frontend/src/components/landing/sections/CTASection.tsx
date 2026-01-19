'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { PixelButton, BuildingIcon } from '../pixel'
import { Mail, Chrome, Wallet } from 'lucide-react'

export function CTASection() {
  const router = useRouter()

  return (
    <section className="relative py-24 px-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative"
        >
          {/* Glow effect */}
          <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 via-teal-500/20 to-purple-500/20 blur-3xl" />

          {/* Card container */}
          <div
            className="relative p-8 md:p-12 border-4 bg-slate-900/90"
            style={{
              borderColor: '#F59E0B',
              boxShadow: '8px 8px 0px #78350F'
            }}
          >
            {/* Buildings decoration */}
            <div className="flex justify-center gap-4 mb-8">
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              >
                <BuildingIcon type="bank" size={48} />
              </motion.div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.2 }}
              >
                <BuildingIcon type="townhall" size={56} />
              </motion.div>
              <motion.div
                animate={{ y: [0, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.4 }}
              >
                <BuildingIcon type="shop" size={48} />
              </motion.div>
            </div>

            {/* Title */}
            <h2
              className="text-2xl md:text-4xl font-bold text-center text-amber-400 mb-4"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              Start Building Today
            </h2>

            {/* Subtitle */}
            <p className="text-center text-slate-300 mb-8 max-w-lg mx-auto">
              Join thousands of players managing their crypto through gaming.
              Free to start. No credit card required.
            </p>

            {/* Main CTA */}
            <div className="flex justify-center mb-8">
              <PixelButton
                onClick={() => router.push('/app')}
                variant="primary"
                size="lg"
              >
                Start Playing Free
              </PixelButton>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4 max-w-md mx-auto mb-6">
              <div className="flex-1 h-px bg-slate-700" />
              <span className="text-slate-500 text-xs uppercase tracking-wider">or sign in with</span>
              <div className="flex-1 h-px bg-slate-700" />
            </div>

            {/* Social login options */}
            <div className="flex justify-center gap-4">
              <button
                onClick={() => router.push('/app')}
                className="flex items-center gap-2 px-4 py-2 border-2 border-slate-600 bg-slate-800 text-slate-300 hover:border-amber-500 hover:text-amber-400 transition-colors"
              >
                <Mail className="w-4 h-4" />
                <span className="text-sm">Email</span>
              </button>
              <button
                onClick={() => router.push('/app')}
                className="flex items-center gap-2 px-4 py-2 border-2 border-slate-600 bg-slate-800 text-slate-300 hover:border-amber-500 hover:text-amber-400 transition-colors"
              >
                <Chrome className="w-4 h-4" />
                <span className="text-sm">Google</span>
              </button>
              <button
                onClick={() => router.push('/app')}
                className="flex items-center gap-2 px-4 py-2 border-2 border-slate-600 bg-slate-800 text-slate-300 hover:border-amber-500 hover:text-amber-400 transition-colors"
              >
                <Wallet className="w-4 h-4" />
                <span className="text-sm">Wallet</span>
              </button>
            </div>

            {/* Terms */}
            <p className="text-center text-xs text-slate-500 mt-8">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
