'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { Building, BUILDING_INFO, BuildingType, GRID_SIZE } from '@/types'
import { BuildingModal } from './BuildingModal'
import { BuildingInfo } from './BuildingInfo'
import { toast } from 'sonner'

// Tile dimensions for isometric view
const TILE_WIDTH = 100
const TILE_HEIGHT = 50

// Grid to screen conversion (isometric)
const gridToScreen = (gridX: number, gridY: number) => ({
  x: (gridX - gridY) * (TILE_WIDTH / 2),
  y: (gridX + gridY) * (TILE_HEIGHT / 2)
})

const screenToGrid = (screenX: number, screenY: number) => {
  const x = (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2
  const y = (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2
  return { x: Math.floor(x), y: Math.floor(y) }
}

// SVG Isometric Tile Component
function IsometricTile({
  x,
  y,
  isHovered,
  isOccupied,
  isPlacing,
  onClick,
}: {
  x: number
  y: number
  isHovered: boolean
  isOccupied: boolean
  isPlacing: boolean
  onClick: () => void
}) {
  const screen = gridToScreen(x, y)

  // Determine tile colors
  let fillColor = '#2d5a27'
  let strokeColor = '#1e3d1a'

  if (isHovered && isPlacing) {
    fillColor = isOccupied ? '#dc2626' : '#16a34a'
    strokeColor = isOccupied ? '#991b1b' : '#166534'
  } else if (isHovered) {
    fillColor = '#3d7a37'
  }

  // Add some variation to grass tiles
  const variation = ((x * 7 + y * 13) % 3)
  const grassColors = ['#2d5a27', '#2a5424', '#305e2a']
  if (!isHovered) {
    fillColor = grassColors[variation]
  }

  return (
    <g
      transform={`translate(${screen.x}, ${screen.y})`}
      onClick={onClick}
      style={{ cursor: isPlacing ? 'pointer' : 'default' }}
    >
      {/* Isometric diamond tile */}
      <polygon
        points={`0,-${TILE_HEIGHT / 2} ${TILE_WIDTH / 2},0 0,${TILE_HEIGHT / 2} -${TILE_WIDTH / 2},0`}
        fill={fillColor}
        stroke={strokeColor}
        strokeWidth="1"
        className="transition-colors duration-150"
      />
      {/* Grass texture details */}
      {!isHovered && (
        <>
          <line
            x1={-15 + variation * 5}
            y1={-5 + variation * 2}
            x2={-10 + variation * 5}
            y2={-10 + variation * 2}
            stroke="#3d7a37"
            strokeWidth="2"
            strokeLinecap="round"
          />
          <line
            x1={10 - variation * 3}
            y1={5 - variation * 2}
            x2={15 - variation * 3}
            y2={0 - variation * 2}
            stroke="#3d7a37"
            strokeWidth="2"
            strokeLinecap="round"
          />
        </>
      )}
    </g>
  )
}

// SVG Pixel Art Building Component
function PixelBuilding({
  building,
  onClick
}: {
  building: Building
  onClick: () => void
}) {
  const screen = gridToScreen(building.position.x, building.position.y)
  const info = BUILDING_INFO[building.type]

  if (!info) return null

  const { colors } = info
  const buildingHeight = 80
  const buildingWidth = 60

  return (
    <motion.g
      transform={`translate(${screen.x}, ${screen.y - buildingHeight / 2})`}
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
      style={{ cursor: 'pointer' }}
    >
      {/* Building shadow */}
      <ellipse
        cx="0"
        cy={buildingHeight / 2 + 5}
        rx={buildingWidth / 2}
        ry={10}
        fill="rgba(0,0,0,0.3)"
      />

      {/* Building base/foundation */}
      <rect
        x={-buildingWidth / 2}
        y={buildingHeight / 2 - 8}
        width={buildingWidth}
        height={8}
        fill={colors.accent}
      />

      {/* Building main body */}
      <rect
        x={-buildingWidth / 2 + 4}
        y={-buildingHeight / 2 + 20}
        width={buildingWidth - 8}
        height={buildingHeight - 28}
        fill={colors.wall}
        stroke={colors.accent}
        strokeWidth="2"
      />

      {/* Roof */}
      {building.type === 'townhall' ? (
        // Town Hall - pointed roof with flag
        <>
          <polygon
            points={`0,-${buildingHeight / 2 + 10} ${buildingWidth / 2 - 4},${-buildingHeight / 2 + 20} -${buildingWidth / 2 - 4},${-buildingHeight / 2 + 20}`}
            fill={colors.roof}
            stroke={colors.accent}
            strokeWidth="2"
          />
          <rect x="-2" y={-buildingHeight / 2 - 20} width="4" height="15" fill={colors.accent} />
          <polygon
            points={`2,-${buildingHeight / 2 - 20} 2,-${buildingHeight / 2 - 10} 12,-${buildingHeight / 2 - 15}`}
            fill="#ef4444"
          />
        </>
      ) : building.type === 'bank' ? (
        // Bank - flat roof with columns
        <>
          <rect
            x={-buildingWidth / 2}
            y={-buildingHeight / 2 + 15}
            width={buildingWidth}
            height={8}
            fill={colors.roof}
          />
          {/* Columns */}
          <rect x={-buildingWidth / 2 + 8} y={-buildingHeight / 2 + 23} width={6} height={buildingHeight - 38} fill={colors.accent} />
          <rect x={buildingWidth / 2 - 14} y={-buildingHeight / 2 + 23} width={6} height={buildingHeight - 38} fill={colors.accent} />
        </>
      ) : building.type === 'shop' ? (
        // Shop - awning
        <>
          <rect
            x={-buildingWidth / 2 - 5}
            y={-buildingHeight / 2 + 15}
            width={buildingWidth + 10}
            height={12}
            fill={colors.roof}
          />
          {/* Stripes on awning */}
          <rect x={-buildingWidth / 2 - 5} y={-buildingHeight / 2 + 15} width={12} height={12} fill={colors.accent} />
          <rect x={-buildingWidth / 2 + 19} y={-buildingHeight / 2 + 15} width={12} height={12} fill={colors.accent} />
          <rect x={buildingWidth / 2 - 7} y={-buildingHeight / 2 + 15} width={12} height={12} fill={colors.accent} />
        </>
      ) : (
        // Lottery - dome roof
        <>
          <ellipse
            cx="0"
            cy={-buildingHeight / 2 + 20}
            rx={buildingWidth / 2 - 4}
            ry={15}
            fill={colors.roof}
          />
          <circle cx="0" cy={-buildingHeight / 2 + 5} r="8" fill={colors.accent} />
          <text
            x="0"
            y={-buildingHeight / 2 + 9}
            textAnchor="middle"
            fill="#fef08a"
            fontSize="10"
            fontWeight="bold"
          >
            $
          </text>
        </>
      )}

      {/* Windows */}
      <rect x={-buildingWidth / 2 + 10} y={-buildingHeight / 2 + 30} width={12} height={12} fill={colors.window} rx="1" />
      <rect x={buildingWidth / 2 - 22} y={-buildingHeight / 2 + 30} width={12} height={12} fill={colors.window} rx="1" />

      {/* Door */}
      <rect
        x={-8}
        y={buildingHeight / 2 - 30}
        width={16}
        height={22}
        fill={colors.accent}
        rx="2"
      />
      <rect
        x={-5}
        y={buildingHeight / 2 - 27}
        width={10}
        height={19}
        fill={colors.window}
        rx="1"
      />

      {/* Building label */}
      <rect
        x={-30}
        y={buildingHeight / 2 + 12}
        width={60}
        height={16}
        fill="rgba(15, 23, 42, 0.9)"
        stroke={colors.accent}
        strokeWidth="1"
        rx="2"
      />
      <text
        x="0"
        y={buildingHeight / 2 + 23}
        textAnchor="middle"
        fill={colors.roof}
        fontSize="8"
        fontFamily="'Press Start 2P', monospace"
      >
        {info.name}
      </text>
    </motion.g>
  )
}

// Ghost building preview when placing
function GhostBuilding({
  type,
  position
}: {
  type: BuildingType
  position: { x: number; y: number }
}) {
  const screen = gridToScreen(position.x, position.y)
  const info = BUILDING_INFO[type]
  if (!info) return null

  const { colors } = info
  const buildingHeight = 80
  const buildingWidth = 60

  return (
    <g
      transform={`translate(${screen.x}, ${screen.y - buildingHeight / 2})`}
      style={{ opacity: 0.6 }}
    >
      {/* Simplified ghost preview */}
      <rect
        x={-buildingWidth / 2 + 4}
        y={-buildingHeight / 2 + 20}
        width={buildingWidth - 8}
        height={buildingHeight - 20}
        fill={colors.wall}
        stroke={colors.roof}
        strokeWidth="2"
        strokeDasharray="5,3"
      />
      <polygon
        points={`0,-${buildingHeight / 2 + 5} ${buildingWidth / 2 - 4},${-buildingHeight / 2 + 20} -${buildingWidth / 2 - 4},${-buildingHeight / 2 + 20}`}
        fill={colors.roof}
        opacity="0.8"
      />
    </g>
  )
}

export function IsometricGameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null)
  const [buildModalOpen, setBuildModalOpen] = useState(false)
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 })

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

  // Update viewport size on mount and resize
  useEffect(() => {
    const updateSize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // Calculate SVG viewBox to center the grid
  const gridPixelWidth = GRID_SIZE * TILE_WIDTH
  const gridPixelHeight = GRID_SIZE * TILE_HEIGHT
  const padding = 200

  // Handle mouse move for hover
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget
    const rect = svg.getBoundingClientRect()
    const svgX = ((e.clientX - rect.left) / rect.width) * (gridPixelWidth + padding * 2) - padding - gridPixelWidth / 2
    const svgY = ((e.clientY - rect.top) / rect.height) * (gridPixelHeight + padding * 2) - padding

    const grid = screenToGrid(svgX, svgY)

    if (grid.x >= 0 && grid.x < GRID_SIZE && grid.y >= 0 && grid.y < GRID_SIZE) {
      setHoveredTile(grid)
    } else {
      setHoveredTile(null)
    }
  }, [gridPixelWidth, gridPixelHeight])

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
      if (containerRef.current?.contains(e.target as Node)) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setZoom(Math.max(0.5, Math.min(2, zoom + delta)))
      }
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
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
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      tiles.push({ x, y })
    }
  }

  // Sort buildings by depth (y position for proper overlapping)
  const sortedBuildings = [...buildings].sort((a, b) =>
    (a.position.x + a.position.y) - (b.position.x + b.position.y)
  )

  const viewBoxWidth = (gridPixelWidth + padding * 2) / zoom
  const viewBoxHeight = (gridPixelHeight + padding * 2) / zoom
  const viewBoxX = -padding / zoom - (gridPixelWidth / 2) / zoom + (gridPixelWidth / 2 - viewBoxWidth / 2)
  const viewBoxY = -padding / zoom

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0"
        style={{
          background: 'linear-gradient(180deg, #0f172a 0%, #1e1b4b 40%, #0f172a 100%)',
        }}
      >
        {/* Animated stars background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 50}%`,
                width: Math.random() * 2 + 1,
                height: Math.random() * 2 + 1,
              }}
              animate={{ opacity: [0.2, 0.8, 0.2] }}
              transition={{
                duration: 2 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
            />
          ))}
        </div>

        {/* SVG Game Canvas - Full Screen */}
        <svg
          width="100%"
          height="100%"
          viewBox={`${viewBoxX} ${viewBoxY} ${viewBoxWidth} ${viewBoxHeight}`}
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoveredTile(null)}
          className="absolute inset-0"
          style={{ touchAction: 'none' }}
        >
          {/* Grid tiles */}
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

          {/* Buildings */}
          <AnimatePresence>
            {sortedBuildings.map((building) => (
              <PixelBuilding
                key={building.id}
                building={building}
                onClick={() => {
                  setSelectedBuilding(building)
                  setInfoModalOpen(true)
                }}
              />
            ))}
          </AnimatePresence>

          {/* Ghost building when placing */}
          {isPlacingBuilding && selectedBuildingType && hoveredTile && !isPositionOccupied(hoveredTile.x, hoveredTile.y) && (
            <GhostBuilding type={selectedBuildingType} position={hoveredTile} />
          )}
        </svg>

        {/* Zoom controls */}
        <div className="fixed bottom-28 right-4 flex flex-col gap-2 z-50">
          <button
            onClick={() => setZoom(Math.min(2, zoom + 0.2))}
            className="w-10 h-10 border-2 text-white font-bold transition-colors hover:bg-slate-700"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '14px',
              backgroundColor: '#1e293b',
              borderColor: '#475569',
            }}
          >
            +
          </button>
          <button
            onClick={() => setZoom(Math.max(0.5, zoom - 0.2))}
            className="w-10 h-10 border-2 text-white font-bold transition-colors hover:bg-slate-700"
            style={{
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '14px',
              backgroundColor: '#1e293b',
              borderColor: '#475569',
            }}
          >
            -
          </button>
        </div>

        {/* Instructions overlay */}
        {isPlacingBuilding && selectedBuildingType && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded"
            style={{
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              border: '2px solid #F59E0B',
              fontFamily: '"Press Start 2P", monospace',
              fontSize: '10px',
              color: '#F59E0B'
            }}
          >
            Click a tile to place {BUILDING_INFO[selectedBuildingType]?.name}
          </motion.div>
        )}
      </div>

      <BuildingModal
        open={buildModalOpen}
        onClose={() => {
          setBuildModalOpen(false)
          setPendingPosition(null)
        }}
        buildingType={selectedBuildingType}
        onConfirm={handleConfirmBuild}
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
