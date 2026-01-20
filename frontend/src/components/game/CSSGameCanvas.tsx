'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import { useGameStore } from '@/store/gameStore'
import { Building, BUILDING_INFO, BuildingType } from '@/types'
import { BuildingModal } from './BuildingModal'
import { BuildingInfo } from './BuildingInfo'
import { useCreateTownHall } from '@/hooks/useContracts'
import { useWallets } from '@privy-io/react-auth'
import { toast } from 'sonner'
import { motion, AnimatePresence } from 'framer-motion'

// Base path for assets
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || ''
const ASSET_PATH = `${BASE_PATH}/assets`

// Isometric constants
const TILE_WIDTH = 128
const TILE_HEIGHT = 64
const GRID_SIZE = 12

// Building sprite sheet configuration
const BUILDING_SHEET_WIDTH = 400
const BUILDING_SHEET_HEIGHT = 400
const BUILDING_COLS = 2
const BUILDING_ROWS = 2
const BUILDING_SPRITE_WIDTH = BUILDING_SHEET_WIDTH / BUILDING_COLS
const BUILDING_SPRITE_HEIGHT = BUILDING_SHEET_HEIGHT / BUILDING_ROWS

interface SpriteConfig {
  col: number
  row: number
}

const BUILDING_SPRITES: Record<BuildingType, SpriteConfig> = {
  townhall: { col: 0, row: 0 },
  bank: { col: 1, row: 0 },
  shop: { col: 0, row: 1 },
  lottery: { col: 1, row: 1 },
}

// Convert grid coordinates to screen (isometric)
function gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: (gridX - gridY) * (TILE_WIDTH / 2),
    y: (gridX + gridY) * (TILE_HEIGHT / 2),
  }
}

export function CSSGameCanvas() {
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null)
  const [buildModalOpen, setBuildModalOpen] = useState(false)
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [isCreatingTownHall, setIsCreatingTownHall] = useState(false)
  const [cameraOffset, setCameraOffset] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const worldRef = useRef<HTMLDivElement>(null)

  // Generate stars once to prevent jumping on re-render
  const starfield = useRef(Array.from({ length: 200 }).map(() => ({
    size: Math.random() * 3 + 1,
    duration: Math.random() * 3 + 2,
    delay: Math.random() * 5,
    top: Math.random() * 100,
    left: Math.random() * 100,
    color: Math.random() > 0.95 ? '#add8e6' : Math.random() > 0.9 ? '#ffd700' : '#ffffff'
  })))

  const shootingStars = useRef(Array.from({ length: 3 }).map((_, i) => ({
    startY: Math.random() * 50,
    startX: Math.random() * 100,
    duration: Math.random() * 2 + 3,
    delay: i * 8
  })))

  const nebulas = useRef(Array.from({ length: 5 }).map(() => ({
    color: ['#1e3a8a', '#581c87', '#064e3b', '#7c2d12'][Math.floor(Math.random() * 4)],
    size: Math.random() * 150 + 100,
    duration: Math.random() * 10 + 15,
    top: Math.random() * 100,
    left: Math.random() * 100
  })))

  const { wallets } = useWallets()
  const { createTownHall, loading: townHallLoading, error: townHallError } = useCreateTownHall()

  const buildings = useGameStore((state) => state.buildings)
  const selectedBuildingType = useGameStore((state) => state.selectedBuildingType)
  const isPlacingBuilding = useGameStore((state) => state.isPlacingBuilding)
  const addBuilding = useGameStore((state) => state.addBuilding)
  const removeBuilding = useGameStore((state) => state.removeBuilding)
  const selectBuildingType = useGameStore((state) => state.selectBuildingType)
  const isPositionOccupied = useGameStore((state) => state.isPositionOccupied)
  const zoom = useGameStore((state) => state.zoom)
  const setZoom = useGameStore((state) => state.setZoom)

  // Get user's wallet address
  const getUserAddress = () => {
    const privyWallet = wallets.find(w => w.walletClientType === 'privy')
    if (privyWallet) return privyWallet.address
    if (wallets.length > 0) return wallets[0].address
    return null
  }

  // Auto-center on Town Hall when buildings load
  useEffect(() => {
    const townHall = buildings.find(b => b.type === 'townhall')
    if (townHall) {
      const screen = gridToScreen(townHall.position.x, townHall.position.y)
      setCameraOffset({
        x: -screen.x,
        y: -screen.y + 50, // Offset up slightly
      })
    }
  }, [buildings])

  // Handle tile click
  const handleTileClick = useCallback((x: number, y: number) => {
    const state = useGameStore.getState()
    if (!state.isPlacingBuilding || !state.selectedBuildingType) return

    if (state.isPositionOccupied(x, y)) {
      toast.error('Position already occupied!')
      return
    }

    setPendingPosition({ x, y })
    setBuildModalOpen(true)
  }, [])

  // Handle mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0 && (e.altKey || e.ctrlKey)) {
      setIsDragging(true)
      setDragStart({ x: e.clientX - cameraOffset.x, y: e.clientY - cameraOffset.y })
    }
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setCameraOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  // Handle wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault()
    const delta = e.deltaY > 0 ? -0.1 : 0.1
    setZoom(Math.max(0.5, Math.min(2, zoom + delta)))
  }

  // Confirm building placement
  const handleConfirmBuild = async (amount?: string) => {
    if (!pendingPosition || !selectedBuildingType) return

    // For Town Hall, call the smart contract
    if (selectedBuildingType === 'townhall') {
      const userAddress = getUserAddress()
      if (!userAddress) {
        toast.error('Please connect your wallet first')
        return
      }

      setIsCreatingTownHall(true)
      setBuildModalOpen(false)

      try {
        toast.loading('Creating Town Hall on-chain...', { id: 'townhall-create' })
        const result = await createTownHall(userAddress, pendingPosition.x, pendingPosition.y)

        if (result.success) {
          const newBuilding: Building = {
            id: `townhall-${result.buildingId || Date.now()}`,
            type: 'townhall',
            position: pendingPosition,
            createdAt: Date.now(),
          }
          addBuilding(newBuilding)
          toast.success('Town Hall created successfully!', { id: 'townhall-create' })
        } else {
          toast.error(townHallError || 'Failed to create Town Hall', { id: 'townhall-create' })
        }
      } catch (err: any) {
        toast.error(err.message || 'Failed to create Town Hall', { id: 'townhall-create' })
      } finally {
        setIsCreatingTownHall(false)
        setPendingPosition(null)
        selectBuildingType(null)
      }
      return
    }

    // For other buildings
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

  // Get building sprite position
  const getBuildingSpritePosition = (type: BuildingType) => {
    const config = BUILDING_SPRITES[type]
    return {
      backgroundPosition: `-${config.col * BUILDING_SPRITE_WIDTH}px -${config.row * BUILDING_SPRITE_HEIGHT}px`,
    }
  }

  return (
    <>
      {/* Starfield Background Layer - Fixed, doesn't move with camera */}
      <div
        className="fixed overflow-hidden pointer-events-none"
        style={{
          background: 'linear-gradient(180deg, #0f0f23 0%, #1a1a2e 40%, #16213e 100%)',
          top: '64px',
          left: 0,
          right: 0,
          bottom: '144px',
          zIndex: 0,
        }}
      >
        {/* Twinkling Stars */}
        {starfield.current.map((star, i) => (
          <motion.div
            key={`star-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${star.left}%`,
              top: `${star.top}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              backgroundColor: star.color,
              boxShadow: `0 0 ${star.size * 2}px ${star.color}`,
            }}
            animate={{
              opacity: [0.2, 1, 0.2],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}

        {/* Shooting Stars */}
        {shootingStars.current.map((star, i) => (
          <motion.div
            key={`shooting-star-${i}`}
            className="absolute"
            style={{
              left: `${star.startX}%`,
              top: `${star.startY}%`,
              width: '2px',
              height: '2px',
              backgroundColor: '#ffffff',
              boxShadow: '0 0 6px 2px rgba(255, 255, 255, 0.8)',
              borderRadius: '50%',
            }}
            animate={{
              x: [0, 300, 600],
              y: [0, 200, 400],
              opacity: [0, 1, 1, 0],
              scale: [0, 1, 1, 0],
            }}
            transition={{
              duration: star.duration,
              delay: star.delay,
              repeat: Infinity,
              repeatDelay: 15,
              ease: 'easeOut',
            }}
          >
            <motion.div
              className="absolute"
              style={{
                width: '80px',
                height: '2px',
                background: 'linear-gradient(90deg, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 100%)',
                transformOrigin: 'left center',
                left: '-80px',
                top: 0,
              }}
              animate={{
                opacity: [0, 1, 1, 0],
              }}
              transition={{
                duration: star.duration,
                delay: star.delay,
                repeat: Infinity,
                repeatDelay: 15,
                ease: 'easeOut',
              }}
            />
          </motion.div>
        ))}

        {/* Nebula-like glow effects */}
        {nebulas.current.map((nebula, i) => (
          <motion.div
            key={`nebula-${i}`}
            className="absolute rounded-full"
            style={{
              left: `${nebula.left}%`,
              top: `${nebula.top}%`,
              width: `${nebula.size}px`,
              height: `${nebula.size}px`,
              background: `radial-gradient(circle, ${nebula.color}40 0%, transparent 70%)`,
              filter: 'blur(40px)',
            }}
            animate={{
              opacity: [0.03, 0.08, 0.03],
              scale: [1, 1.2, 1],
            }}
            transition={{
              duration: nebula.duration,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        ))}
      </div>


      {/* Game Canvas Layer - Interactive, moves with camera */}
      <div
        className="fixed overflow-hidden select-none"
        style={{
          background: 'transparent',
          top: '64px',
          left: 0,
          right: 0,
          bottom: '144px',
          cursor: isDragging ? 'grabbing' : 'grab',
          zIndex: 1,
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        {/* Game World Container - This is what actually moves */}
        <div
          ref={worldRef}
          className="absolute"
          style={{
            left: '50%',
            top: '50%',
            transform: `translate(-50%, -50%) translate(${cameraOffset.x}px, ${cameraOffset.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.3s ease-out',
          }}
        >
          {/* Grid Tiles */}
          {Array.from({ length: GRID_SIZE }).map((_, y) =>
            Array.from({ length: GRID_SIZE }).map((_, x) => {
              const screen = gridToScreen(x, y)
              const isHovered = hoveredTile?.x === x && hoveredTile?.y === y
              const occupied = isPositionOccupied(x, y)
              const isEvenTile = (x + y) % 2 === 0

              return (
                <div
                  key={`${x}-${y}`}
                  className="absolute cursor-pointer transition-all duration-200"
                  style={{
                    left: `${screen.x}px`,
                    top: `${screen.y}px`,
                    width: `${TILE_WIDTH}px`,
                    height: `${TILE_HEIGHT}px`,
                    transform: 'translate(-50%, -50%)',
                    zIndex: x + y,
                  }}
                  onMouseEnter={() => setHoveredTile({ x, y })}
                  onMouseLeave={() => setHoveredTile(null)}
                  onClick={() => handleTileClick(x, y)}
                >
                  {/* Isometric Tile */}
                  <svg
                    width={TILE_WIDTH}
                    height={TILE_HEIGHT}
                    viewBox={`0 0 ${TILE_WIDTH} ${TILE_HEIGHT}`}
                    style={{ overflow: 'visible' }}
                  >
                    <defs>
                      <linearGradient id={`tile-grad-${x}-${y}`} x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor={isEvenTile ? '#3a6b1f' : '#2d5016'} />
                        <stop offset="100%" stopColor={isEvenTile ? '#2d5016' : '#234012'} />
                      </linearGradient>
                    </defs>
                    <polygon
                      points={`${TILE_WIDTH / 2},0 ${TILE_WIDTH},${TILE_HEIGHT / 2} ${TILE_WIDTH / 2},${TILE_HEIGHT} 0,${TILE_HEIGHT / 2}`}
                      fill={
                        isHovered && isPlacingBuilding
                          ? occupied
                            ? '#ef4444'
                            : '#10b981'
                          : isHovered
                          ? '#4a7e28'
                          : `url(#tile-grad-${x}-${y})`
                      }
                      stroke={isHovered ? '#5a9e32' : '#4a7e28'}
                      strokeWidth="2"
                      opacity={isHovered && isPlacingBuilding ? 0.8 : 1}
                    />
                  </svg>

                  {/* Grid Lines (when placing) */}
                  {isPlacingBuilding && (
                    <svg
                      width={TILE_WIDTH}
                      height={TILE_HEIGHT}
                      viewBox={`0 0 ${TILE_WIDTH} ${TILE_HEIGHT}`}
                      style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}
                    >
                      <polygon
                        points={`${TILE_WIDTH / 2},0 ${TILE_WIDTH},${TILE_HEIGHT / 2} ${TILE_WIDTH / 2},${TILE_HEIGHT} 0,${TILE_HEIGHT / 2}`}
                        fill="none"
                        stroke="#4ade80"
                        strokeWidth="1"
                        opacity="0.6"
                      />
                    </svg>
                  )}
                </div>
              )
            })
          )}

          {/* Buildings */}
          {buildings.map((building) => {
            const screen = gridToScreen(building.position.x, building.position.y)
            const spriteStyle = getBuildingSpritePosition(building.type)

            return (
              <motion.div
                key={building.id}
                className="absolute cursor-pointer"
                style={{
                  left: `${screen.x}px`,
                  top: `${screen.y}px`,
                  width: '140px',
                  height: '140px',
                  transform: 'translate(-50%, -100%)',
                  zIndex: (building.position.x + building.position.y) * 10 + 100,
                  backgroundImage: `url(${ASSET_PATH}/buildings-1.png)`,
                  backgroundSize: '400px 400px',
                  ...spriteStyle,
                  filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
                }}
                onClick={() => {
                  setSelectedBuilding(building)
                  setInfoModalOpen(true)
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              />
            )
          })}

          {/* Ghost Building Preview */}
          {isPlacingBuilding && selectedBuildingType && hoveredTile && !isPositionOccupied(hoveredTile.x, hoveredTile.y) && (
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${gridToScreen(hoveredTile.x, hoveredTile.y).x}px`,
                top: `${gridToScreen(hoveredTile.x, hoveredTile.y).y}px`,
                width: '140px',
                height: '140px',
                transform: 'translate(-50%, -100%)',
                zIndex: 9999,
                backgroundImage: `url(${ASSET_PATH}/buildings-1.png)`,
                backgroundSize: '400px 400px',
                ...getBuildingSpritePosition(selectedBuildingType),
                opacity: 0.6,
                filter: 'brightness(1.3) drop-shadow(0 0 20px #88ff88)',
              }}
            />
          )}
        </div>
      </div>

      {/* Zoom controls */}
      <div className="fixed bottom-40 right-4 flex flex-col gap-2 z-50">
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
          className="fixed top-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.9)',
            border: '2px solid #F59E0B',
            fontFamily: '"Press Start 2P", monospace',
            fontSize: '10px',
            color: '#F59E0B',
          }}
        >
          Click a tile to place {BUILDING_INFO[selectedBuildingType]?.name}
        </motion.div>
      )}

      <BuildingModal
        open={buildModalOpen}
        onClose={() => {
          setBuildModalOpen(false)
          setPendingPosition(null)
        }}
        buildingType={selectedBuildingType}
        position={pendingPosition}
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

      {/* Town Hall Creation Loading Overlay */}
      <AnimatePresence>
        {(isCreatingTownHall || townHallLoading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80"
          >
            <div className="text-center">
              <motion.div
                className="w-24 h-24 mx-auto mb-4"
                style={{
                  backgroundImage: `url(${ASSET_PATH}/buildings-1.png)`,
                  backgroundPosition: '0px 0px',
                  backgroundSize: '192px 192px',
                }}
                animate={{ rotate: [0, 5, -5, 0], y: [0, -10, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              />
              <div
                className="text-amber-400 mb-2"
                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '12px' }}
              >
                Building Town Hall...
              </div>
              <div className="text-slate-400 text-sm">Please confirm the transaction in your wallet</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
