/**
 * CityGrid Component
 * Renders a 13x13 isometric-style grid for building placement
 * With drag-to-rotate camera controls and drag-to-move buildings
 */

'use client'

import { useState, useMemo, useCallback, useRef } from 'react'
import { motion } from 'framer-motion'
import { IsometricBuilding } from '../landing/IsometricBuilding'
import { Building } from '@/hooks/useCityBuildings'
import { GRID_SIZE } from '@/lib/constants'

interface CityGridProps {
  buildings: Building[]
  selectedCoords: { x: number; y: number } | null
  onSelectTile: (x: number, y: number) => void
  isLoading?: boolean
  onMoveBuilding?: (building: Building, newX: number, newY: number) => void
  isMoving?: boolean
}

const DRAG_THRESHOLD = 5

export function CityGrid({ buildings, selectedCoords, onSelectTile, isLoading, onMoveBuilding, isMoving }: CityGridProps) {
  const centerCoord = Math.ceil(GRID_SIZE / 2)

  // Camera rotation state
  const [rotateX, setRotateX] = useState(60)
  const [rotateZ, setRotateZ] = useState(45)
  const [isCameraDragging, setIsCameraDragging] = useState(false)
  const lastMousePos = useRef({ x: 0, y: 0 })

  // Building drag state
  const [dragBuilding, setDragBuilding] = useState<Building | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null)
  const [mouseClientPos, setMouseClientPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 })
  const dragStartPos = useRef<{ x: number; y: number } | null>(null)
  const hasDraggedRef = useRef(false)
  const mouseDownBuildingRef = useRef<Building | null>(null)

  // Create a map for quick building lookup
  const buildingMap = useMemo(() => {
    console.log(`[Grid] Recalculating buildingMap for ${buildings.length} buildings`, buildings)
    const map = new Map<string, Building>()
    buildings.forEach(b => {
      map.set(`${b.x},${b.y}`, b)
    })
    return map
  }, [buildings])

  // Check if a tile is a valid drop target
  const isValidDrop = useCallback((x: number, y: number): boolean => {
    if (!dragBuilding) return false
    // Can't drop on same position
    if (x === dragBuilding.x && y === dragBuilding.y) return false
    // Can't drop on Town Hall position
    if (x === centerCoord && y === centerCoord) return false
    // Can't drop on occupied tiles
    if (buildingMap.has(`${x},${y}`)) return false
    // Must be within grid bounds
    if (x < 1 || x > GRID_SIZE || y < 1 || y > GRID_SIZE) return false
    return true
  }, [dragBuilding, centerCoord, buildingMap])

  // Get tile coords from screen position using elementFromPoint
  const getTileFromPoint = useCallback((clientX: number, clientY: number): { x: number; y: number } | null => {
    const el = document.elementFromPoint(clientX, clientY)
    if (!el) return null
    // Walk up to find element with data-tile attribute
    let target: Element | null = el
    while (target && !target.getAttribute('data-tile')) {
      target = target.parentElement
    }
    if (!target) return null
    const tx = parseInt(target.getAttribute('data-tile-x') || '', 10)
    const ty = parseInt(target.getAttribute('data-tile-y') || '', 10)
    if (isNaN(tx) || isNaN(ty)) return null
    return { x: tx, y: ty }
  }, [])

  // Mouse handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button !== 0) return
    e.preventDefault()

    const pos = { x: e.clientX, y: e.clientY }
    lastMousePos.current = pos

    // Check if we clicked on a building tile
    const tile = getTileFromPoint(e.clientX, e.clientY)
    if (tile) {
      const building = buildingMap.get(`${tile.x},${tile.y}`)
      if (building && building.type !== 'townhall' && onMoveBuilding) {
        // Potential building drag - store candidate
        mouseDownBuildingRef.current = building
        dragStartPos.current = pos
        hasDraggedRef.current = false
        return
      }
    }

    // No building under cursor -> camera rotation
    mouseDownBuildingRef.current = null
    dragStartPos.current = null
    setIsCameraDragging(true)
  }, [buildingMap, getTileFromPoint, onMoveBuilding])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const pos = { x: e.clientX, y: e.clientY }

    // Building drag candidate - check threshold
    if (mouseDownBuildingRef.current && dragStartPos.current && !isDragActive) {
      const dx = pos.x - dragStartPos.current.x
      const dy = pos.y - dragStartPos.current.y
      if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        setDragBuilding(mouseDownBuildingRef.current)
        setIsDragActive(true)
        hasDraggedRef.current = true
      }
      return
    }

    // Active building drag
    if (isDragActive && dragBuilding) {
      setMouseClientPos(pos)
      const tile = getTileFromPoint(e.clientX, e.clientY)
      setHoveredTile(tile)
      return
    }

    // Camera rotation
    if (isCameraDragging) {
      const deltaX = pos.x - lastMousePos.current.x
      const deltaY = pos.y - lastMousePos.current.y
      setRotateZ(prev => prev + deltaX * 0.3)
      setRotateX(prev => Math.max(20, Math.min(80, prev - deltaY * 0.3)))
      lastMousePos.current = pos
    }
  }, [isDragActive, dragBuilding, isCameraDragging, getTileFromPoint])

  const handleMouseUp = useCallback(() => {
    // Complete a building drop
    if (isDragActive && dragBuilding && hoveredTile && onMoveBuilding) {
      if (isValidDrop(hoveredTile.x, hoveredTile.y)) {
        onMoveBuilding(dragBuilding, hoveredTile.x, hoveredTile.y)
      }
    }

    // Reset all drag state
    setIsCameraDragging(false)
    setDragBuilding(null)
    setIsDragActive(false)
    setHoveredTile(null)
    mouseDownBuildingRef.current = null
    dragStartPos.current = null
  }, [isDragActive, dragBuilding, hoveredTile, onMoveBuilding, isValidDrop])

  const handleMouseLeave = useCallback(() => {
    setIsCameraDragging(false)
    setDragBuilding(null)
    setIsDragActive(false)
    setHoveredTile(null)
    mouseDownBuildingRef.current = null
    dragStartPos.current = null
  }, [])

  const handleTileClick = useCallback((x: number, y: number) => {
    // Suppress click after drag
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false
      return
    }
    if (!isCameraDragging) {
      onSelectTile(x, y)
    }
  }, [isCameraDragging, onSelectTile])

  // Reset camera
  const resetCamera = useCallback(() => {
    setRotateX(60)
    setRotateZ(45)
  }, [])

  // Helper to determine tile style
  const getTileStyle = (x: number, y: number) => {
    const isSelected = selectedCoords?.x === x && selectedCoords?.y === y
    const hasBuilding = buildingMap.has(`${x},${y}`)
    const isTownHallPos = x === centerCoord && y === centerCoord

    // Drag source tile
    if (isDragActive && dragBuilding && x === dragBuilding.x && y === dragBuilding.y) {
      return 'bg-orange-900/40 border-orange-400 border-dashed'
    }

    // Hovered tile during drag
    if (isDragActive && hoveredTile?.x === x && hoveredTile?.y === y) {
      if (isValidDrop(x, y)) {
        return 'bg-green-500/40 border-green-400 shadow-lg shadow-green-500/30'
      } else {
        return 'bg-red-500/40 border-red-400 shadow-lg shadow-red-500/30'
      }
    }

    if (isSelected) return 'bg-blue-500/40 border-blue-400 shadow-lg shadow-blue-500/30'
    if (isTownHallPos) return 'bg-amber-900/30 border-amber-600/50'
    if (hasBuilding) return 'bg-emerald-900/40 border-emerald-600/60'

    return 'bg-slate-800/50 border-slate-700/50 hover:bg-slate-700/60 hover:border-slate-500'
  }

  const cursorStyle = isDragActive ? 'cursor-grabbing' : isCameraDragging ? 'cursor-grabbing' : 'cursor-grab'

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Camera Controls */}
      <div className="absolute top-2 left-2 z-40 flex gap-2">
        <button
          onClick={resetCamera}
          className="px-2 py-1 bg-slate-800 border border-slate-600 text-slate-400 text-[8px] hover:bg-slate-700 hover:text-white transition-colors"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          RESET
        </button>
        <span className="px-2 py-1 bg-slate-900/80 border border-slate-700 text-slate-500 text-[6px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
          DRAG TO ROTATE
        </span>
      </div>

      {/* Isometric container with proper perspective */}
      <div
        className={`relative overflow-visible py-20 ${cursorStyle}`}
        style={{
          perspective: '1200px',
          perspectiveOrigin: '50% 50%',
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* 3D transformed grid */}
        <motion.div
          className="mx-auto"
          animate={{
            rotateX: rotateX,
            rotateZ: rotateZ,
          }}
          transition={{ type: 'spring', stiffness: 100, damping: 20 }}
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${GRID_SIZE}, 48px)`,
            gridTemplateRows: `repeat(${GRID_SIZE}, 48px)`,
            gap: '2px',
            transformStyle: 'preserve-3d',
            transformOrigin: 'center center',
            width: 'fit-content',
          }}
        >
          {Array.from({ length: GRID_SIZE * GRID_SIZE }).map((_, i) => {
            const x = (i % GRID_SIZE) + 1
            const y = Math.floor(i / GRID_SIZE) + 1
            const building = buildingMap.get(`${x},${y}`)
            const isSelected = selectedCoords?.x === x && selectedCoords?.y === y
            const isDragSource = isDragActive && dragBuilding && x === dragBuilding.x && y === dragBuilding.y

            return (
              <motion.div
                key={`${x}-${y}`}
                data-tile="true"
                data-tile-x={x}
                data-tile-y={y}
                onClick={() => handleTileClick(x, y)}
                className={`relative border-2 cursor-pointer transition-all duration-200 ${getTileStyle(x, y)}`}
                style={{
                  width: '48px',
                  height: '48px',
                  transformStyle: 'preserve-3d',
                }}
                whileHover={!isDragActive ? {
                  scale: building ? 1 : 1.05,
                  boxShadow: building ? 'none' : '0 0 20px rgba(59, 130, 246, 0.5)',
                } : undefined}
                whileTap={!isDragActive ? { scale: building ? 1 : 0.95 } : undefined}
              >
                {/* Building Rendering - Counter-rotate to stand upright */}
                {building && !isDragSource && (
                  <div
                    className="absolute flex items-end justify-center pointer-events-none"
                    style={{
                      width: '100%',
                      height: '100%',
                      transform: `rotateZ(${-rotateZ}deg) rotateX(${-rotateX}deg)`,
                      transformOrigin: 'center center',
                      bottom: '0',
                    }}
                  >
                    <div style={{ transform: `scaleY(${0.8 + Math.log10(Math.max(building.amountUSD, 1) + 1) * 0.4})`, transformOrigin: 'bottom center' }}>
                      <IsometricBuilding
                        type={building.type.toLowerCase() as any}
                        size="sm"
                        level={building.level}
                        floatSpeed={3}
                        asset={building.asset}
                      />
                    </div>
                  </div>
                )}

                {/* Selection Indicator */}
                {isSelected && !building && (
                  <motion.div
                    className="absolute inset-0 border-2 border-blue-400 bg-blue-500/20 flex items-center justify-center"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                  </motion.div>
                )}

                {/* Town Hall Preview (if not built yet but this is the center) */}
                {x === centerCoord && y === centerCoord && !building && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-30">
                    <span
                      className="text-[8px] text-amber-500 font-bold"
                      style={{ transform: `rotateZ(${-rotateZ}deg) rotateX(${-rotateX}deg)` }}
                    >
                      CORE
                    </span>
                  </div>
                )}

                {/* Coordinate Label (Selected tile only) */}
                {isSelected && (
                  <div
                    className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-700 px-2 py-0.5 rounded text-[8px] text-white whitespace-nowrap z-50 pointer-events-none"
                    style={{ transform: `rotateZ(${-rotateZ}deg) rotateX(${-rotateX}deg)` }}
                  >
                    {x}, {y}
                  </div>
                )}
              </motion.div>
            )
          })}
        </motion.div>
      </div>

      {/* Ghost building that follows cursor during drag */}
      {isDragActive && dragBuilding && (
        <div
          className="fixed pointer-events-none z-[200]"
          style={{
            left: mouseClientPos.x - 24,
            top: mouseClientPos.y - 48,
            opacity: 0.7,
          }}
        >
          <IsometricBuilding
            type={dragBuilding.type.toLowerCase() as any}
            size="sm"
            level={dragBuilding.level}
            floatSpeed={0}
            asset={dragBuilding.asset}
          />
        </div>
      )}

      {/* Moving Overlay */}
      {isMoving && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-3 h-3 bg-orange-400 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
            <p className="text-orange-400 text-[8px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              MOVING BUILDING...
            </p>
          </div>
        </div>
      )}

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 rounded-xl">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[0, 1, 2].map(i => (
                <div key={i} className="w-3 h-3 bg-amber-400 animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
              ))}
            </div>
            <p className="text-amber-400 text-[8px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              SYNCING GRID...
            </p>
          </div>
        </div>
      )}


    </div>
  )
}
