'use client'

import { useGameStore } from '@/store/gameStore'
import { BUILDING_INFO, BuildingType } from '@/types'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

const AVAILABLE_BUILDINGS: BuildingType[] = ['bank', 'shop', 'lottery']

// Base path for assets
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''
const ASSET_PATH = `${BASE_PATH}/assets`

// Building sprite sheet: 400x400, 2x2 grid
const SHEET_WIDTH = 400
const SHEET_HEIGHT = 400
const SPRITE_COLS = 2
const SPRITE_ROWS = 2
const SPRITE_WIDTH = SHEET_WIDTH / SPRITE_COLS   // 200
const SPRITE_HEIGHT = SHEET_HEIGHT / SPRITE_ROWS // 200

// Building sprite configuration - position in 2x2 grid
interface SpriteConfig {
  col: number
  row: number
}

const BUILDING_SPRITE_CONFIG: Record<BuildingType, SpriteConfig> = {
  townhall: { col: 0, row: 0 },  // Brown house (top-left)
  bank: { col: 1, row: 0 },      // Gray apartment (top-right)
  shop: { col: 0, row: 1 },      // Coffee shop (bottom-left)
  lottery: { col: 1, row: 1 },   // Office building (bottom-right)
}

// Large Sprite Building Icon for toolbar
function SpriteBuildingIcon({ type, size = 80, isSelected = false }: { type: BuildingType; size?: number; isSelected?: boolean }) {
  const info = BUILDING_INFO[type]
  if (!info) return null

  const config = BUILDING_SPRITE_CONFIG[type]
  const spriteX = config.col * SPRITE_WIDTH
  const spriteY = config.row * SPRITE_HEIGHT

  // Scale factor to fit sprite into the icon size
  const scale = size / SPRITE_WIDTH
  const bgWidth = SHEET_WIDTH * scale
  const bgHeight = SHEET_HEIGHT * scale

  return (
    <motion.div
      className="relative"
      style={{
        width: size,
        height: size,
        backgroundImage: `url(${ASSET_PATH}/buildings-1.png)`,
        backgroundPosition: `-${spriteX * scale}px -${spriteY * scale}px`,
        backgroundSize: `${bgWidth}px ${bgHeight}px`,
        filter: isSelected ? 'drop-shadow(0 0 12px rgba(255, 255, 255, 0.5))' : 'none',
      }}
      animate={isSelected ? {
        scale: [1, 1.05, 1],
        y: [0, -4, 0]
      } : {}}
      transition={{ duration: 1, repeat: isSelected ? Infinity : 0, ease: 'easeInOut' }}
    />
  )
}

export function BottomBar() {
  const { selectedBuildingType, selectBuildingType, isPlacingBuilding, buildings } = useGameStore()

  const handleSelectBuilding = (type: BuildingType) => {
    console.log('Building button clicked:', type)
    // Toggle placing mode for the selected building type
    if (isPlacingBuilding && selectedBuildingType === type) {
      // Clicking the same building again cancels placement
      console.log('Canceling placement')
      selectBuildingType(null)
      toast.info('Building placement canceled')
    } else {
      // Select this building type for placement
      console.log('Selecting building for placement:', type)
      selectBuildingType(type)
      toast.info(`Click on the map to place ${BUILDING_INFO[type].name}`)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50">
      {/* Glass effect background */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.7) 0%, rgba(15, 23, 42, 0.95) 100%)',
          backdropFilter: 'blur(12px)',
          borderTop: '1px solid rgba(148, 163, 184, 0.2)',
        }}
      />

      {/* Content */}
      <div className="relative h-36 max-w-screen-xl mx-auto px-6 flex items-center justify-center gap-4">

        {/* Building Cards */}
        {AVAILABLE_BUILDINGS.map((type) => {
          const info = BUILDING_INFO[type]
          const count = buildings.filter(b => b.type === type).length
          const isSelected = isPlacingBuilding && selectedBuildingType === type

          return (
            <motion.button
              key={type}
              className="relative flex flex-col items-center justify-center rounded-2xl overflow-hidden cursor-pointer"
              style={{
                width: 130,
                height: 120,
                background: isSelected
                  ? `linear-gradient(145deg, ${info.colors.roof}40, ${info.colors.accent}50)`
                  : `linear-gradient(145deg, rgba(30, 41, 59, 0.8), rgba(15, 23, 42, 0.9))`,
                border: isSelected
                  ? `2px solid ${info.colors.roof}`
                  : '2px solid rgba(71, 85, 105, 0.3)',
                boxShadow: isSelected
                  ? `0 4px 25px ${info.colors.roof}50, inset 0 1px 0 rgba(255, 255, 255, 0.1)`
                  : '0 4px 15px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.05)',
              }}
              onClick={() => handleSelectBuilding(type)}
              whileHover={{ scale: 1.05, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Selected glow effect */}
              {isSelected && (
                <motion.div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(circle at 50% 30%, ${info.colors.roof}60 0%, transparent 70%)`,
                  }}
                  animate={{ opacity: [0.5, 0.8, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              )}

              <SpriteBuildingIcon type={type} size={70} isSelected={isSelected} />

              <span
                className="mt-1 font-bold tracking-wide uppercase"
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: '8px',
                  color: isSelected ? info.colors.roof : '#94a3b8',
                  textShadow: isSelected ? `0 0 10px ${info.colors.roof}80` : 'none',
                }}
              >
                {info.name}
              </span>

              {/* Selection indicator */}
              <AnimatePresence>
                {isSelected && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: info.colors.roof,
                      boxShadow: `0 0 10px ${info.colors.roof}`,
                    }}
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0, opacity: 0 }}
                  >
                    <span className="text-white text-xs font-bold">✓</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          )
        })}

        {/* Placing Mode Indicator */}
        <AnimatePresence>
          {isPlacingBuilding && selectedBuildingType && (
            <motion.div
              className="ml-6 px-5 py-3 rounded-xl"
              style={{
                background: 'linear-gradient(145deg, rgba(16, 185, 129, 0.2), rgba(5, 150, 105, 0.3))',
                border: '2px solid rgba(16, 185, 129, 0.5)',
                boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)',
              }}
              initial={{ opacity: 0, x: -20, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -20, scale: 0.9 }}
            >
              <div className="flex items-center gap-3">
                <motion.div
                  className="w-3 h-3 rounded-full bg-emerald-400"
                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <span
                  className="text-emerald-400 font-bold"
                  style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '9px' }}
                >
                  CLICK TO PLACE
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
