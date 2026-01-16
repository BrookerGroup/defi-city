'use client'

import { useGameStore } from '@/store/gameStore'
import { BUILDING_INFO, BuildingType } from '@/types'
import { motion } from 'framer-motion'

const AVAILABLE_BUILDINGS: BuildingType[] = ['bank', 'shop', 'lottery']

// SVG Building Icon for toolbar
function SVGBuildingIcon({ type, size = 48, isSelected = false }: { type: BuildingType; size?: number; isSelected?: boolean }) {
  const info = BUILDING_INFO[type]
  if (!info) return null

  const { colors } = info

  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      animate={isSelected ? { scale: [1, 1.1, 1] } : {}}
      transition={{ duration: 0.5, repeat: isSelected ? Infinity : 0 }}
    >
      {/* Building base */}
      <rect x="8" y="40" width="32" height="4" fill={colors.accent} />

      {/* Building body */}
      <rect x="10" y="18" width="28" height="22" fill={colors.wall} stroke={colors.accent} strokeWidth="2" />

      {/* Roof based on type */}
      {type === 'townhall' ? (
        <>
          <polygon points="24,4 40,18 8,18" fill={colors.roof} stroke={colors.accent} strokeWidth="1" />
          <rect x="22" y="0" width="4" height="6" fill={colors.accent} />
          <polygon points="26,0 26,4 32,2" fill="#ef4444" />
        </>
      ) : type === 'bank' ? (
        <>
          <rect x="6" y="14" width="36" height="6" fill={colors.roof} />
          <rect x="12" y="20" width="4" height="16" fill={colors.accent} />
          <rect x="32" y="20" width="4" height="16" fill={colors.accent} />
        </>
      ) : type === 'shop' ? (
        <>
          <rect x="4" y="14" width="40" height="8" fill={colors.roof} />
          <rect x="4" y="14" width="10" height="8" fill={colors.accent} />
          <rect x="19" y="14" width="10" height="8" fill={colors.accent} />
          <rect x="34" y="14" width="10" height="8" fill={colors.accent} />
        </>
      ) : (
        <>
          <ellipse cx="24" cy="16" rx="16" ry="8" fill={colors.roof} />
          <circle cx="24" cy="10" r="6" fill={colors.accent} />
          <text x="24" y="14" textAnchor="middle" fill="#fef08a" fontSize="8" fontWeight="bold">$</text>
        </>
      )}

      {/* Windows */}
      <rect x="14" y="22" width="6" height="6" fill={colors.window} rx="1" />
      <rect x="28" y="22" width="6" height="6" fill={colors.window} rx="1" />

      {/* Door */}
      <rect x="20" y="32" width="8" height="8" fill={colors.accent} rx="1" />
      <rect x="22" y="34" width="4" height="6" fill={colors.window} rx="1" />
    </motion.svg>
  )
}

export function BottomBar() {
  const { selectedBuildingType, selectBuildingType, isPlacingBuilding, buildings } = useGameStore()

  const hasTownHall = buildings.some(b => b.type === 'townhall')

  const handleSelectBuilding = (type: BuildingType) => {
    if (selectedBuildingType === type) {
      selectBuildingType(null)
    } else {
      selectBuildingType(type)
    }
  }

  return (
    <div
      className="fixed bottom-0 left-0 right-0 h-24 z-50 border-t-2"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.95)',
        borderColor: '#475569',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="h-full max-w-screen-2xl mx-auto px-4 flex items-center justify-center gap-3">
        {/* Town Hall (not selectable if already placed) */}
        <motion.button
          className={`flex flex-col items-center justify-center p-3 border-2 transition-all ${hasTownHall ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
          style={{
            borderColor: hasTownHall ? '#475569' : BUILDING_INFO.townhall.colors.accent,
            backgroundColor: hasTownHall ? 'rgba(71, 85, 105, 0.2)' : 'rgba(245, 158, 11, 0.1)',
            boxShadow: hasTownHall ? 'none' : '3px 3px 0px #B45309'
          }}
          disabled={hasTownHall}
          whileHover={!hasTownHall ? { scale: 1.05, y: -2 } : {}}
          whileTap={!hasTownHall ? { scale: 0.95 } : {}}
        >
          <SVGBuildingIcon type="townhall" size={48} />
          <span
            className="text-xs mt-1"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '6px',
              color: hasTownHall ? '#64748b' : '#F59E0B'
            }}
          >
            Town Hall
          </span>
        </motion.button>

        {/* Divider */}
        <div className="w-px h-12 bg-slate-600 mx-1" />

        {/* Available buildings */}
        {AVAILABLE_BUILDINGS.map((type) => {
          const info = BUILDING_INFO[type]
          const isSelected = selectedBuildingType === type

          return (
            <motion.button
              key={type}
              className="flex flex-col items-center justify-center p-3 border-2 transition-all"
              style={{
                borderColor: isSelected ? info.colors.roof : info.colors.accent,
                backgroundColor: isSelected ? `${info.colors.roof}30` : `${info.colors.wall}15`,
                boxShadow: isSelected ? `0 0 12px ${info.colors.roof}50` : `3px 3px 0px ${info.colors.accent}`
              }}
              onClick={() => handleSelectBuilding(type)}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              <SVGBuildingIcon type={type} size={48} isSelected={isSelected} />
              <span
                className="text-xs mt-1"
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: '6px',
                  color: info.colors.roof
                }}
              >
                {info.name}
              </span>
              {isSelected && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 rounded-full"
                  style={{ backgroundColor: info.colors.roof }}
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                />
              )}
            </motion.button>
          )
        })}

        {/* Placing indicator */}
        {isPlacingBuilding && selectedBuildingType && (
          <motion.div
            className="ml-4 px-3 py-2 border-2"
            style={{
              borderColor: '#10B981',
              backgroundColor: 'rgba(16, 185, 129, 0.1)'
            }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <span
              className="text-emerald-400"
              style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
            >
              Click grid to place
            </span>
          </motion.div>
        )}
      </div>
    </div>
  )
}
