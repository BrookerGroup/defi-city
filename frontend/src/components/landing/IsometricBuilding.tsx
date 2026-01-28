'use client'

import { motion } from 'framer-motion'
import { useState, useMemo } from 'react'

interface IsometricBuildingProps {
  type: 'townhall' | 'bank' | 'shop' | 'lottery'
  size?: 'sm' | 'md' | 'lg'
  level?: number  // 1-5, affects building height
  apy?: number    // Supply APY to display on badge
  delay?: number
  floatSpeed?: number
  asset?: string  // USDC, USDT, ETH, etc.
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
  // Asset-specific colors
  usdc: {
    roof: '#0EA5E9', // Sky Blue (ฟ้า)
    wall: '#7DD3FC',
    accent: '#0369A1',
    window: '#E0F2FE',
  },
  usdt: {
    roof: '#10B981', // Green (เขียว)
    wall: '#6EE7B7',
    accent: '#059669',
    window: '#D1FAE5',
  },
  eth: {
    roof: '#4F46E5', // Indigo/Blue (น้ำเงิน)
    wall: '#818CF8',
    accent: '#3730A3',
    window: '#E0E7FF',
  },
  wbtc: {
    roof: '#F7931A', // Bitcoin Orange
    wall: '#FCD34D',
    accent: '#B45309',
    window: '#FEF3C7',
  },
  link: {
    roof: '#2A5ADA', // Chainlink Blue
    wall: '#60A5FA',
    accent: '#1E40AF',
    window: '#DBEAFE',
  },
}

export function IsometricBuilding({
  type,
  size = 'md',
  level = 1,
  apy,
  delay = 0,
  floatSpeed = 3,
  asset
}: IsometricBuildingProps) {
  const [randomFloat] = useState(() => Math.random() * 10)

  // Scale height based on level
  const heightMultiplier = useMemo(() => {
    if (level >= 5) return 1.6
    if (level >= 4) return 1.4
    if (level >= 3) return 1.2
    if (level >= 2) return 1.1
    return 1.0
  }, [level])

  const sizeConfig = {
    sm: { width: 80, height: 80 * heightMultiplier },
    md: { width: 112, height: 112 * heightMultiplier },
    lg: { width: 144, height: 144 * heightMultiplier }
  }

  const { width, height } = sizeConfig[size]
  
  // Determine color based on asset if provided, otherwise fallback to type
  const colorKey = (asset?.toLowerCase() as keyof typeof BUILDING_COLORS) || type
  const colors = BUILDING_COLORS[colorKey as keyof typeof BUILDING_COLORS] || BUILDING_COLORS[type]

  // Calculate number of floors based on level
  const floors = Math.min(level, 3)
  const buildingHeight = 45 + (floors - 1) * 25
  const viewBoxHeight = 100 + (floors - 1) * 25

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
      {/* Static container - no bounce animation */}
      <div
        className="relative w-full h-full flex items-end justify-center"
      >
        <svg
          width={width * 0.9}
          height={height * 0.9}
          viewBox={`0 0 100 ${viewBoxHeight}`}
          className="transition-transform group-hover:scale-110"
          style={{ overflow: 'visible' }}
        >
          {/* Shadow */}
          <ellipse cx="50" cy={viewBoxHeight - 10} rx="35" ry="8" fill="rgba(0,0,0,0.3)" />

          {/* Building base */}
          <rect x="15" y={viewBoxHeight - 20} width="70" height="8" fill={colors.accent} />

          {/* Building body - extends up based on floors */}
          <rect 
            x="18" 
            y={viewBoxHeight - 20 - buildingHeight} 
            width="64" 
            height={buildingHeight} 
            fill={colors.wall} 
            stroke={colors.accent} 
            strokeWidth="3" 
          />

          {/* Additional floors indicators */}
          {floors >= 2 && (
            <line 
              x1="18" 
              y1={viewBoxHeight - 50} 
              x2="82" 
              y2={viewBoxHeight - 50} 
              stroke={colors.accent} 
              strokeWidth="2"
            />
          )}
          {floors >= 3 && (
            <line 
              x1="18" 
              y1={viewBoxHeight - 75} 
              x2="82" 
              y2={viewBoxHeight - 75} 
              stroke={colors.accent} 
              strokeWidth="2"
            />
          )}

          {/* Roof based on type */}
          {type === 'townhall' ? (
            <>
              <polygon 
                points={`50,${viewBoxHeight - 20 - buildingHeight - 30} 85,${viewBoxHeight - 20 - buildingHeight} 15,${viewBoxHeight - 20 - buildingHeight}`} 
                fill={colors.roof} 
                stroke={colors.accent} 
                strokeWidth="2" 
              />
              <rect x="47" y={viewBoxHeight - 20 - buildingHeight - 40} width="6" height="10" fill={colors.accent} />
              <polygon points={`53,${viewBoxHeight - 20 - buildingHeight - 40} 53,${viewBoxHeight - 20 - buildingHeight - 34} 63,${viewBoxHeight - 20 - buildingHeight - 37}`} fill="#ef4444" />
            </>
          ) : type === 'bank' ? (
            <>
              <rect x="10" y={viewBoxHeight - 20 - buildingHeight - 7} width="80" height="10" fill={colors.roof} />
              <rect x="22" y={viewBoxHeight - 20 - buildingHeight + 3} width="8" height="32" fill={colors.accent} />
              <rect x="70" y={viewBoxHeight - 20 - buildingHeight + 3} width="8" height="32" fill={colors.accent} />
              {/* Dollar sign for bank */}
              <circle cx="50" cy={viewBoxHeight - 20 - buildingHeight - 15} r="10" fill={colors.accent} />
              <text x="50" y={viewBoxHeight - 20 - buildingHeight - 10} textAnchor="middle" fill="#fef08a" fontSize="12" fontWeight="bold">$</text>
            </>
          ) : type === 'shop' ? (
            <>
              <rect x="5" y={viewBoxHeight - 20 - buildingHeight - 7} width="90" height="14" fill={colors.roof} />
              <rect x="5" y={viewBoxHeight - 20 - buildingHeight - 7} width="22" height="14" fill={colors.accent} />
              <rect x="39" y={viewBoxHeight - 20 - buildingHeight - 7} width="22" height="14" fill={colors.accent} />
              <rect x="73" y={viewBoxHeight - 20 - buildingHeight - 7} width="22" height="14" fill={colors.accent} />
            </>
          ) : (
            <>
              <ellipse cx="50" cy={viewBoxHeight - 20 - buildingHeight - 3} rx="35" ry="15" fill={colors.roof} />
              <circle cx="50" cy={viewBoxHeight - 20 - buildingHeight - 17} r="12" fill={colors.accent} />
              <text x="50" y={viewBoxHeight - 20 - buildingHeight - 11} textAnchor="middle" fill="#fef08a" fontSize="16" fontWeight="bold">$</text>
            </>
          )}

          {/* Windows for each floor */}
          {Array.from({ length: floors }).map((_, floorIndex) => (
            <g key={floorIndex}>
              <rect 
                x="25" 
                y={viewBoxHeight - 35 - (floorIndex * 25)} 
                width="14" 
                height="14" 
                fill={colors.window} 
                rx="2" 
              />
              <rect 
                x="61" 
                y={viewBoxHeight - 35 - (floorIndex * 25)} 
                width="14" 
                height="14" 
                fill={colors.window} 
                rx="2" 
              />
              {/* Window glow animation */}
              <motion.rect
                x="25" 
                y={viewBoxHeight - 35 - (floorIndex * 25)} 
                width="14" 
                height="14" 
                fill="#FCD34D" 
                rx="2"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: randomFloat + floorIndex * 0.3 }}
              />
              <motion.rect
                x="61" 
                y={viewBoxHeight - 35 - (floorIndex * 25)} 
                width="14" 
                height="14" 
                fill="#FCD34D" 
                rx="2"
                animate={{ opacity: [0.3, 0.8, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, delay: randomFloat + 0.5 + floorIndex * 0.3 }}
              />
            </g>
          ))}

          {/* Door */}
          <rect x="40" y={viewBoxHeight - 38} width="20" height="18" fill={colors.accent} rx="3" />
          <rect x="44" y={viewBoxHeight - 34} width="12" height="14" fill={colors.window} rx="2" />

          {/* APY indicator (always show for bank buildings, not townhall) */}
          {apy !== undefined && type !== 'townhall' && (
            <g>
              <rect x="60" y={viewBoxHeight - 20 - buildingHeight + 8} width="35" height="14" rx="3" fill="#1e293b" stroke={colors.accent} strokeWidth="2" />
              <text 
                x="78" 
                y={viewBoxHeight - 20 - buildingHeight + 18} 
                textAnchor="middle" 
                fill="#4ade80" 
                fontSize="6" 
                fontWeight="bold"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                {apy === 0 ? '0%' : apy < 0.01 ? '<.01%' : apy >= 10 ? `${Math.round(apy)}%` : `${apy.toFixed(2)}%`}
              </text>
            </g>
          )}
        </svg>

        {/* Glow effect on hover */}
        <motion.div
          className="absolute -inset-4 rounded-full opacity-0 group-hover:opacity-60 transition-opacity pointer-events-none"
          style={{
            background: `radial-gradient(circle, ${colors.roof}40 0%, transparent 70%)`
          }}
        />
      </div>

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
