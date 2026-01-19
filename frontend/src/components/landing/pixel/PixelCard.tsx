'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface PixelCardProps {
  children: ReactNode
  className?: string
  variant?: 'default' | 'highlight' | 'dark'
  delay?: number
}

export function PixelCard({
  children,
  className = '',
  variant = 'default',
  delay = 0
}: PixelCardProps) {
  const variantStyles = {
    default: {
      bg: '#1E293B',
      border: '#334155',
      shadow: '#0F172A'
    },
    highlight: {
      bg: '#1E293B',
      border: '#F59E0B',
      shadow: '#78350F'
    },
    dark: {
      bg: '#0F172A',
      border: '#1E293B',
      shadow: '#020617'
    }
  }

  const style = variantStyles[variant]

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -4 }}
      className={`
        relative p-6
        border-4
        transition-all duration-200
        ${className}
      `}
      style={{
        backgroundColor: style.bg,
        borderColor: style.border,
        boxShadow: `6px 6px 0px ${style.shadow}`,
        imageRendering: 'pixelated'
      }}
    >
      {children}
    </motion.div>
  )
}
