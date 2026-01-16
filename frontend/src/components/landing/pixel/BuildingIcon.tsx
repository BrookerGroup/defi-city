'use client'

import { motion } from 'framer-motion'

interface BuildingIconProps {
  type: 'townhall' | 'bank' | 'shop' | 'lottery'
  size?: number
  animated?: boolean
}

export function BuildingIcon({ type, size = 64, animated = true }: BuildingIconProps) {
  const buildings = {
    townhall: {
      colors: { roof: '#F59E0B', wall: '#FCD34D', accent: '#B45309', window: '#0F172A' },
      label: 'Town Hall'
    },
    bank: {
      colors: { roof: '#10B981', wall: '#34D399', accent: '#059669', window: '#0F172A' },
      label: 'Bank'
    },
    shop: {
      colors: { roof: '#06B6D4', wall: '#67E8F9', accent: '#0891B2', window: '#0F172A' },
      label: 'Shop'
    },
    lottery: {
      colors: { roof: '#A855F7', wall: '#C084FC', accent: '#7C3AED', window: '#0F172A' },
      label: 'Lottery'
    }
  }

  const { colors } = buildings[type]
  const pixelSize = size / 16

  const Wrapper = animated ? motion.svg : 'svg'
  const animationProps = animated ? {
    animate: { y: [0, -3, 0] },
    transition: { duration: 2, repeat: Infinity, ease: 'easeInOut' }
  } : {}

  return (
    <Wrapper
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ imageRendering: 'pixelated' }}
      {...animationProps}
    >
      {/* Building base/foundation */}
      <rect x="2" y="14" width="12" height="2" fill={colors.accent} />

      {/* Building wall */}
      <rect x="3" y="6" width="10" height="8" fill={colors.wall} />

      {/* Roof */}
      {type === 'townhall' ? (
        <>
          {/* Dome roof for townhall */}
          <rect x="4" y="4" width="8" height="2" fill={colors.roof} />
          <rect x="5" y="2" width="6" height="2" fill={colors.roof} />
          <rect x="7" y="1" width="2" height="1" fill={colors.roof} />
          {/* Flag */}
          <rect x="7" y="0" width="1" height="1" fill={colors.accent} />
        </>
      ) : type === 'bank' ? (
        <>
          {/* Flat roof with columns look */}
          <rect x="2" y="5" width="12" height="1" fill={colors.roof} />
          <rect x="3" y="4" width="10" height="1" fill={colors.roof} />
          {/* Columns */}
          <rect x="4" y="6" width="1" height="8" fill={colors.accent} />
          <rect x="7" y="6" width="2" height="8" fill={colors.accent} />
          <rect x="11" y="6" width="1" height="8" fill={colors.accent} />
        </>
      ) : type === 'shop' ? (
        <>
          {/* Awning */}
          <rect x="2" y="5" width="12" height="2" fill={colors.roof} />
          <rect x="2" y="5" width="2" height="2" fill={colors.accent} />
          <rect x="6" y="5" width="2" height="2" fill={colors.accent} />
          <rect x="10" y="5" width="2" height="2" fill={colors.accent} />
          {/* Sign */}
          <rect x="5" y="3" width="6" height="2" fill={colors.accent} />
        </>
      ) : (
        <>
          {/* Star/casino roof */}
          <rect x="3" y="4" width="10" height="2" fill={colors.roof} />
          <rect x="6" y="2" width="4" height="2" fill={colors.roof} />
          <rect x="7" y="1" width="2" height="1" fill={colors.accent} />
          {/* Star decoration */}
          <rect x="7" y="0" width="2" height="1" fill="#FCD34D" />
        </>
      )}

      {/* Windows */}
      <rect x="4" y="7" width="2" height="2" fill={colors.window} />
      <rect x="10" y="7" width="2" height="2" fill={colors.window} />

      {/* Door */}
      <rect x="6" y="10" width="4" height="4" fill={colors.accent} />
      <rect x="7" y="11" width="2" height="3" fill={colors.window} />

      {/* Window lights */}
      <motion.rect
        x="4" y="7" width="1" height="1"
        fill="#FCD34D"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0 }}
      />
      <motion.rect
        x="10" y="7" width="1" height="1"
        fill="#FCD34D"
        animate={{ opacity: [0.3, 1, 0.3] }}
        transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
      />
    </Wrapper>
  )
}
