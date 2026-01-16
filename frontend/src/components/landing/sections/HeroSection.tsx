'use client'

import { motion } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { PixelButton, BuildingIcon } from '../pixel'

export function HeroSection() {
  const router = useRouter()

  return (
    <section className="relative min-h-screen flex flex-col items-center justify-center px-6 py-20">
      {/* Floating buildings decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute top-1/4 left-[10%]"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
        >
          <BuildingIcon type="bank" size={48} animated={false} />
        </motion.div>
        <motion.div
          className="absolute top-1/3 right-[15%]"
          animate={{ y: [0, -8, 0] }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.5 }}
        >
          <BuildingIcon type="shop" size={56} animated={false} />
        </motion.div>
        <motion.div
          className="absolute bottom-1/4 left-[20%]"
          animate={{ y: [0, -12, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
        >
          <BuildingIcon type="lottery" size={44} animated={false} />
        </motion.div>
        <motion.div
          className="absolute bottom-1/3 right-[10%]"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: 1.5 }}
        >
          <BuildingIcon type="townhall" size={52} animated={false} />
        </motion.div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center space-y-8 max-w-4xl mx-auto">
        {/* Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-block"
        >
          <div
            className="px-4 py-2 border-2 bg-slate-800/80"
            style={{
              borderColor: '#10B981',
              boxShadow: '3px 3px 0px #059669'
            }}
          >
            <span
              className="text-emerald-400 text-xs tracking-wider uppercase"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              Built on Base
            </span>
          </div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          <span className="block text-amber-400 mb-2">DEFI</span>
          <span className="block text-white">CITY</span>
        </motion.h1>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-xl md:text-2xl text-slate-300 max-w-2xl mx-auto leading-relaxed"
        >
          <span className="text-amber-400 font-bold">Build your city.</span>{' '}
          <span className="text-teal-400 font-bold">Manage your crypto.</span>
          <br />
          <span className="text-slate-400">
            Where gaming meets decentralized finance.
          </span>
        </motion.p>

        {/* Sub-description */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-base text-slate-400 max-w-xl mx-auto"
        >
          No wallet needed. Gasless transactions. Just play and grow your portfolio.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-8"
        >
          <PixelButton
            onClick={() => router.push('/app')}
            variant="primary"
            size="lg"
          >
            Start Playing
          </PixelButton>

          <PixelButton
            onClick={() => document.getElementById('concept')?.scrollIntoView({ behavior: 'smooth' })}
            variant="outline"
            size="lg"
          >
            Learn More
          </PixelButton>
        </motion.div>
      </div>

      {/* Central city showcase */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.8 }}
        className="relative mt-16 w-full max-w-3xl"
      >
        <div className="flex justify-center items-end gap-4 md:gap-8">
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <BuildingIcon type="bank" size={80} animated={false} />
          </motion.div>
          <motion.div
            animate={{ y: [0, -6, 0] }}
            transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          >
            <BuildingIcon type="townhall" size={100} animated={false} />
          </motion.div>
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
          >
            <BuildingIcon type="shop" size={80} animated={false} />
          </motion.div>
          <motion.div
            animate={{ y: [0, -7, 0] }}
            transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut', delay: 0.9 }}
          >
            <BuildingIcon type="lottery" size={72} animated={false} />
          </motion.div>
        </div>

        {/* Ground line */}
        <div className="w-full h-4 bg-gradient-to-r from-transparent via-slate-700 to-transparent mt-2" />
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="w-6 h-10 border-2 border-slate-600 rounded-full flex justify-center pt-2"
        >
          <div className="w-1 h-2 bg-slate-500 rounded-full" />
        </motion.div>
      </motion.div>
    </section>
  )
}
