'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface FeatureCardProps {
  icon: ReactNode
  title: string
  description: string
  gradient: string
  delay?: number
}

export function FeatureCard({
  icon,
  title,
  description,
  gradient,
  delay = 0
}: FeatureCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30, rotateX: -20 }}
      whileInView={{
        opacity: 1,
        y: 0,
        rotateX: 0
      }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{
        duration: 0.6,
        delay,
        ease: [0.25, 0.46, 0.45, 0.94]
      }}
      whileHover={{
        y: -8,
        rotateX: 5,
        transition: { duration: 0.3 }
      }}
      className="group relative"
      style={{ transformStyle: 'preserve-3d', perspective: 1000 }}
    >
      {/* Glow effect on hover */}
      <motion.div
        className={`absolute -inset-0.5 bg-gradient-to-r ${gradient} rounded-2xl blur-xl opacity-0 group-hover:opacity-75 transition-opacity duration-500`}
      />

      {/* Card container */}
      <div className="relative bg-slate-900/90 backdrop-blur-xl rounded-2xl p-8 border border-white/10 overflow-hidden">
        {/* Animated gradient overlay */}
        <motion.div
          className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`}
        />

        {/* Content */}
        <div className="relative z-10 space-y-4">
          {/* Icon with floating animation */}
          <motion.div
            className="inline-block"
            whileHover={{
              scale: 1.1,
              rotate: [0, -5, 5, -5, 0],
              transition: { duration: 0.5 }
            }}
          >
            <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${gradient} p-3 shadow-lg flex items-center justify-center text-3xl`}>
              {icon}
            </div>
          </motion.div>

          {/* Title */}
          <h3 className="text-2xl font-bold text-white tracking-tight">
            {title}
          </h3>

          {/* Description */}
          <p className="text-slate-300 leading-relaxed">
            {description}
          </p>

          {/* Animated corner accent */}
          <motion.div
            className="absolute top-0 right-0 w-32 h-32 opacity-20"
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 20,
              repeat: Infinity,
              ease: "linear"
            }}
          >
            <div className={`w-full h-full bg-gradient-to-br ${gradient} rounded-full blur-3xl`} />
          </motion.div>
        </div>

        {/* Decorative grid pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="w-full h-full" style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }} />
        </div>
      </div>
    </motion.div>
  )
}
