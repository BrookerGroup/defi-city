'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { Building, BUILDING_INFO, BuildingType, GRID_SIZE, TILE_SIZE } from '@/types'
import { BuildingModal } from './BuildingModal'
import { BuildingInfo } from './BuildingInfo'
import { toast } from 'sonner'

// Isometric conversion helpers
const TILE_WIDTH = 64
const TILE_HEIGHT = 32

const gridToScreen = (gridX: number, gridY: number) => ({
  x: (gridX - gridY) * (TILE_WIDTH / 2),
  y: (gridX + gridY) * (TILE_HEIGHT / 2)
})

const screenToGrid = (screenX: number, screenY: number) => {
  const x = (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2
  const y = (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2
  return { x: Math.floor(x), y: Math.floor(y) }
}

// Pixel Art Building Component
function PixelBuilding({ type, size = 48 }: { type: BuildingType; size?: number }) {
  const info = BUILDING_INFO[type]

  // Fallback colors if building type not found
  if (!info) {
    return (
      <svg width={size} height={size} viewBox="0 0 16 16" style={{ imageRendering: 'pixelated' }}>
        <rect x="3" y="6" width="10" height="10" fill="#475569" />
        <rect x="5" y="8" width="2" height="2" fill="#1e293b" />
        <rect x="9" y="8" width="2" height="2" fill="#1e293b" />
      </svg>
    )
  }

  const { colors } = info

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      style={{ imageRendering: 'pixelated' }}
      className="drop-shadow-lg"
    >
      {/* Building base/foundation */}
      <rect x="2" y="14" width="12" height="2" fill={colors.accent} />

      {/* Building wall */}
      <rect x="3" y="6" width="10" height="8" fill={colors.wall} />

      {/* Roof based on type */}
      {type === 'townhall' ? (
        <>
          <rect x="4" y="4" width="8" height="2" fill={colors.roof} />
          <rect x="5" y="2" width="6" height="2" fill={colors.roof} />
          <rect x="7" y="1" width="2" height="1" fill={colors.roof} />
          <rect x="7" y="0" width="1" height="1" fill={colors.accent} />
        </>
      ) : type === 'bank' ? (
        <>
          <rect x="2" y="5" width="12" height="1" fill={colors.roof} />
          <rect x="3" y="4" width="10" height="1" fill={colors.roof} />
          <rect x="4" y="6" width="1" height="8" fill={colors.accent} />
          <rect x="7" y="6" width="2" height="8" fill={colors.accent} />
          <rect x="11" y="6" width="1" height="8" fill={colors.accent} />
        </>
      ) : type === 'shop' ? (
        <>
          <rect x="2" y="5" width="12" height="2" fill={colors.roof} />
          <rect x="2" y="5" width="2" height="2" fill={colors.accent} />
          <rect x="6" y="5" width="2" height="2" fill={colors.accent} />
          <rect x="10" y="5" width="2" height="2" fill={colors.accent} />
          <rect x="5" y="3" width="6" height="2" fill={colors.accent} />
        </>
      ) : (
        <>
          <rect x="3" y="4" width="10" height="2" fill={colors.roof} />
          <rect x="6" y="2" width="4" height="2" fill={colors.roof} />
          <rect x="7" y="1" width="2" height="1" fill={colors.accent} />
          <rect x="7" y="0" width="2" height="1" fill="#FCD34D" />
        </>
      )}

      {/* Windows */}
      <rect x="4" y="7" width="2" height="2" fill={colors.window} />
      <rect x="10" y="7" width="2" height="2" fill={colors.window} />

      {/* Door */}
      <rect x="6" y="10" width="4" height="4" fill={colors.accent} />
      <rect x="7" y="11" width="2" height="3" fill={colors.window} />

      {/* Window lights animation via CSS */}
      <rect x="4" y="7" width="1" height="1" fill="#FCD34D" className="animate-pulse" style={{ opacity: 0.8 }} />
      <rect x="10" y="7" width="1" height="1" fill="#FCD34D" className="animate-pulse" style={{ opacity: 0.8, animationDelay: '0.5s' }} />
    </svg>
  )
}

// Isometric Tile Component
function IsometricTile({
  x,
  y,
  isHovered,
  isOccupied,
  isPlacing,
  onClick
}: {
  x: number
  y: number
  isHovered: boolean
  isOccupied: boolean
  isPlacing: boolean
  onClick: () => void
}) {
  const screen = gridToScreen(x, y)

  let fillColor = 'rgba(30, 41, 59, 0.6)'
  let strokeColor = 'rgba(71, 85, 105, 0.4)'

  if (isHovered && isPlacing) {
    if (isOccupied) {
      fillColor = 'rgba(239, 68, 68, 0.4)'
      strokeColor = 'rgba(239, 68, 68, 0.8)'
    } else {
      fillColor = 'rgba(16, 185, 129, 0.4)'
      strokeColor = 'rgba(16, 185, 129, 0.8)'
    }
  }

  const halfWidth = TILE_WIDTH / 2
  const halfHeight = TILE_HEIGHT / 2

  const points = [
    `${screen.x},${screen.y - halfHeight}`,
    `${screen.x + halfWidth},${screen.y}`,
    `${screen.x},${screen.y + halfHeight}`,
    `${screen.x - halfWidth},${screen.y}`,
  ].join(' ')

  return (
    <polygon
      points={points}
      fill={fillColor}
      stroke={strokeColor}
      strokeWidth="1"
      className={`transition-colors cursor-pointer ${isPlacing ? 'hover:brightness-125' : ''}`}
      onClick={onClick}
    />
  )
}

// Building on Map Component
function BuildingOnMap({
  building,
  onClick
}: {
  building: Building
  onClick: () => void
}) {
  const screen = gridToScreen(building.position.x, building.position.y)
  const info = BUILDING_INFO[building.type]

  // Skip rendering if building type is not recognized
  if (!info) {
    return null
  }

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: screen.x - 24,
        top: screen.y - 56,
        zIndex: building.position.x + building.position.y + 10
      }}
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      whileHover={{ scale: 1.1, y: -4 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
    >
      <motion.div
        animate={{ y: [0, -3, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
      >
        <PixelBuilding type={building.type} size={48} />
      </motion.div>

      {/* Building name label */}
      <div
        className="absolute -bottom-4 left-1/2 -translate-x-1/2 whitespace-nowrap text-[8px] px-1 py-0.5 rounded"
        style={{
          fontFamily: '"Press Start 2P", monospace',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          color: info.colors.roof,
          border: `1px solid ${info.colors.accent}`
        }}
      >
        {info.name}
      </div>
    </motion.div>
  )
}

export function PixelGameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null)
  const [buildModalOpen, setBuildModalOpen] = useState(false)
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [infoModalOpen, setInfoModalOpen] = useState(false)

  const {
    buildings,
    selectedBuildingType,
    isPlacingBuilding,
    addBuilding,
    removeBuilding,
    selectBuildingType,
    isPositionOccupied,
    zoom,
    setZoom,
  } = useGameStore()

  // Calculate center offset
  const centerX = (GRID_SIZE * TILE_WIDTH) / 2
  const centerY = TILE_HEIGHT * 2

  // Handle mouse move for hover
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const scrollX = containerRef.current.scrollLeft
    const scrollY = containerRef.current.scrollTop

    const mouseX = e.clientX - rect.left + scrollX - centerX
    const mouseY = e.clientY - rect.top + scrollY - centerY

    const grid = screenToGrid(mouseX / zoom, mouseY / zoom)

    if (grid.x >= 0 && grid.x < GRID_SIZE && grid.y >= 0 && grid.y < GRID_SIZE) {
      setHoveredTile(grid)
    } else {
      setHoveredTile(null)
    }
  }, [zoom, centerX, centerY])

  // Handle tile click
  const handleTileClick = useCallback((x: number, y: number) => {
    if (!isPlacingBuilding || !selectedBuildingType) return

    if (isPositionOccupied(x, y)) {
      toast.error('Position already occupied!')
      return
    }

    setPendingPosition({ x, y })
    setBuildModalOpen(true)
  }, [isPlacingBuilding, selectedBuildingType, isPositionOccupied])

  // Handle wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(zoom + delta)
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('wheel', handleWheel, { passive: false })
      return () => container.removeEventListener('wheel', handleWheel)
    }
  }, [zoom, setZoom])

  // Confirm building placement
  const handleConfirmBuild = (amount?: string) => {
    if (!pendingPosition || !selectedBuildingType) return

    const newBuilding: Building = {
      id: `${selectedBuildingType}-${Date.now()}`,
      type: selectedBuildingType,
      position: pendingPosition,
      deposited: amount,
      createdAt: Date.now(),
    }

    addBuilding(newBuilding)
    toast.success(`${BUILDING_INFO[selectedBuildingType].name} built!`)
    setPendingPosition(null)
    selectBuildingType(null)
  }

  // Generate grid tiles
  const tiles = []
  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      tiles.push({ x, y })
    }
  }

  // Sort buildings by depth for proper rendering
  const sortedBuildings = [...buildings].sort((a, b) =>
    (a.position.x + a.position.y) - (b.position.x + b.position.y)
  )

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 pt-16 pb-24 overflow-auto"
        style={{
          background: 'linear-gradient(to bottom, #0f172a, #1e1b4b, #0f172a)',
          touchAction: 'none'
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredTile(null)}
      >
        {/* Animated background stars */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        {/* Grid container */}
        <div
          className="relative mx-auto"
          style={{
            width: GRID_SIZE * TILE_WIDTH + 200,
            height: GRID_SIZE * TILE_HEIGHT + 400,
            transform: `scale(${zoom})`,
            transformOrigin: 'center top'
          }}
        >
          {/* SVG Grid */}
          <svg
            className="absolute"
            style={{
              left: centerX,
              top: centerY,
              overflow: 'visible'
            }}
            width={GRID_SIZE * TILE_WIDTH}
            height={GRID_SIZE * TILE_HEIGHT}
          >
            {tiles.map(({ x, y }) => (
              <IsometricTile
                key={`${x}-${y}`}
                x={x}
                y={y}
                isHovered={hoveredTile?.x === x && hoveredTile?.y === y}
                isOccupied={isPositionOccupied(x, y)}
                isPlacing={isPlacingBuilding}
                onClick={() => handleTileClick(x, y)}
              />
            ))}
          </svg>

          {/* Buildings layer */}
          <div
            className="absolute"
            style={{
              left: centerX,
              top: centerY,
            }}
          >
            <AnimatePresence>
              {sortedBuildings.map((building) => (
                <BuildingOnMap
                  key={building.id}
                  building={building}
                  onClick={() => {
                    setSelectedBuilding(building)
                    setInfoModalOpen(true)
                  }}
                />
              ))}
            </AnimatePresence>
          </div>

          {/* Hover indicator when placing */}
          {isPlacingBuilding && selectedBuildingType && hoveredTile && !isPositionOccupied(hoveredTile.x, hoveredTile.y) && (
            <motion.div
              className="absolute pointer-events-none opacity-60"
              style={{
                left: centerX + gridToScreen(hoveredTile.x, hoveredTile.y).x - 24,
                top: centerY + gridToScreen(hoveredTile.x, hoveredTile.y).y - 56,
              }}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 0.6 }}
            >
              <PixelBuilding type={selectedBuildingType} size={48} />
            </motion.div>
          )}
        </div>

        {/* Zoom controls */}
        <div className="fixed bottom-28 right-4 flex flex-col gap-2 z-50">
          <button
            onClick={() => setZoom(zoom + 0.2)}
            className="w-10 h-10 bg-slate-800 border-2 border-slate-600 text-white font-bold rounded hover:bg-slate-700 transition-colors"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}
          >
            +
          </button>
          <button
            onClick={() => setZoom(zoom - 0.2)}
            className="w-10 h-10 bg-slate-800 border-2 border-slate-600 text-white font-bold rounded hover:bg-slate-700 transition-colors"
            style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}
          >
            -
          </button>
        </div>
      </div>

      <BuildingModal
        open={buildModalOpen}
        onClose={() => {
          setBuildModalOpen(false)
          setPendingPosition(null)
        }}
        buildingType={selectedBuildingType}
        onConfirm={handleConfirmBuild}
        // Pass selected grid position so Bank/Town Hall know where to build
        position={pendingPosition}
      />

      <BuildingInfo
        building={selectedBuilding}
        open={infoModalOpen}
        onClose={() => {
          setInfoModalOpen(false)
          setSelectedBuilding(null)
        }}
        onRemove={removeBuilding}
      />
    </>
  )
}
