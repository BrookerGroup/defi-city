'use client'

import { motion } from 'framer-motion'
import { ReactNode } from 'react'

interface PixelButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  className?: string
  disabled?: boolean
}

export function PixelButton({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false
}: PixelButtonProps) {
  const sizeClasses = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg'
  }

  const variantClasses = {
    primary: 'bg-amber-500 text-slate-900 hover:bg-amber-400',
    secondary: 'bg-teal-500 text-white hover:bg-teal-400',
    outline: 'bg-transparent text-amber-400 border-amber-500 hover:bg-amber-500/10'
  }

  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98, y: 0 }}
      className={`
        relative font-bold tracking-wide uppercase
        border-4 border-b-8 border-r-8
        transition-colors duration-150
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${className}
      `}
      style={{
        borderColor: variant === 'primary'
          ? '#B45309'
          : variant === 'secondary'
            ? '#0D9488'
            : '#F59E0B',
        imageRendering: 'pixelated',
        fontFamily: '"Press Start 2P", monospace',
        boxShadow: `
          4px 4px 0px ${variant === 'primary' ? '#78350F' : variant === 'secondary' ? '#115E59' : '#92400E'}
        `
      }}
    >
      {children}
    </motion.button>
  )
}
