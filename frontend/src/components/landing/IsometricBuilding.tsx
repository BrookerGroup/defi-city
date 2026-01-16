'use client'

import { motion } from 'framer-motion'
import { useState } from 'react'

interface IsometricBuildingProps {
  type: 'townhall' | 'bank' | 'shop' | 'lottery'
  size?: 'sm' | 'md' | 'lg'
  delay?: number
  floatSpeed?: number
}

const BUILDING_COLORS = {
  townhall: {
    roof: '#F59E0B',
    wall: '#FCD34D',
    accent: '#B45309',
    window: '#7DD3FC',
  },
  bank: {
    roof: '#10B981',
    wall: '#6EE7B7',
    accent: '#047857',
    window: '#A7F3D0',
  },
  shop: {
    roof: '#06B6D4',
    wall: '#67E8F9',
    accent: '#0E7490',
    window: '#CFFAFE',
  },
  lottery: {
    roof: '#A855F7',
    wall: '#D8B4FE',
    accent: '#7C3AED',
    window: '#F3E8FF',
  },
}

export function IsometricBuilding({
  type,
  size = 'md',
  delay = 0,
  floatSpeed = 3
}: IsometricBuildingProps) {
  const [randomFloat] = useState(() => Math.random() * 10)

  const sizeConfig = {
    sm: { width: 80, height: 80 },
    md: { width: 112, height: 112 },
    lg: { width: 144, height: 144 }
  }

  const { width, height } = sizeConfig[size]
  const colors = BUILDING_COLORS[type]

  return (
    <motion.div
      className="relative cursor-pointer group"
      style={{ width, height }}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{
        opacity: 1,
        scale: 1
      }}
      transition={{
        duration: 0.5,
        delay,
        ease: "backOut"
      }}
    >
      {/* Gentle bounce animation */}
      <motion.div
        animate={{
          y: [0, -6, 0],
        }}
        transition={{
          duration: floatSpeed,
          repeat: Infinity,
          ease: "easeInOut",
          delay: randomFloat
        }}
        className="relative w-full h-full flex items-center justify-center"
      >
        <svg
          width={width * 0.9}
          height={height * 0.9}
          viewBox="0 0 100 100"
          className="transition-transform group-hover:scale-110"
        >
          {/* Shadow */}
          <ellipse cx="50" cy="90" rx="35" ry="8" fill="rgba(0,0,0,0.3)" />

          {/* Building base */}
          <rect x="15" y="80" width="70" height="8" fill={colors.accent} />

          {/* Building body */}
          <rect x="18" y="35" width="64" height="45" fill={colors.wall} stroke={colors.accent} strokeWidth="3" />

          {/* Roof based on type */}
          {type === 'townhall' ? (
            <>
              <polygon points="50,5 85,35 15,35" fill={colors.roof} stroke={colors.accent} strokeWidth="2" />
              <rect x="47" y="0" width="6" height="10" fill={colors.accent} />
              <polygon points="53,0 53,6 63,3" fill="#ef4444" />
            </>
          ) : type === 'bank' ? (
            <>
              <rect x="10" y="28" width="80" height="10" fill={colors.roof} />
              <rect x="22" y="38" width="8" height="32" fill={colors.accent} />
              <rect x="70" y="38" width="8" height="32" fill={colors.accent} />
            </>
          ) : type === 'shop' ? (
            <>
              <rect x="5" y="28" width="90" height="14" fill={colors.roof} />
              <rect x="5" y="28" width="22" height="14" fill={colors.accent} />
              <rect x="39" y="28" width="22" height="14" fill={colors.accent} />
              <rect x="73" y="28" width="22" height="14" fill={colors.accent} />
            </>
          ) : (
            <>
              <ellipse cx="50" cy="32" rx="35" ry="15" fill={colors.roof} />
              <circle cx="50" cy="18" r="12" fill={colors.accent} />
              <text x="50" y="24" textAnchor="middle" fill="#fef08a" fontSize="16" fontWeight="bold">$</text>
            </>
          )}

          {/* Windows */}
          <rect x="25" y="45" width="14" height="14" fill={colors.window} rx="2" />
          <rect x="61" y="45" width="14" height="14" fill={colors.window} rx="2" />

          {/* Window glow animation */}
          <motion.rect
            x="25" y="45" width="14" height="14" fill="#FCD34D" rx="2"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: randomFloat }}
          />
          <motion.rect
            x="61" y="45" width="14" height="14" fill="#FCD34D" rx="2"
            animate={{ opacity: [0.3, 0.8, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: randomFloat + 0.5 }}
          />

          {/* Door */}
          <rect x="40" y="62" width="20" height="18" fill={colors.accent} rx="3" />
          <rect x="44" y="66" width="12" height="14" fill={colors.window} rx="2" />
        </svg>

        {/* Glow effect on hover */}
        <motion.div
          className="absolute -inset-4 rounded-full opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${colors.roof}40 0%, transparent 70%)`
          }}
        />
      </motion.div>

      {/* Shadow pulse */}
      <motion.div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3/4 h-3 rounded-full"
        style={{
          backgroundColor: '#00000050',
          filter: 'blur(6px)'
        }}
        animate={{
          scale: [1, 0.9, 1],
          opacity: [0.4, 0.5, 0.4],
        }}
        transition={{
          duration: floatSpeed,
          repeat: Infinity,
          delay: randomFloat
        }}
      />
    </motion.div>
  )
}
