'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/store/gameStore'
import { Building, BUILDING_INFO, BuildingType, GRID_SIZE } from '@/types'
import { BuildingModal } from './BuildingModal'
import { BuildingInfo } from './BuildingInfo'
import { useCreateTownHall } from '@/hooks/useContracts'
import { useWallets } from '@privy-io/react-auth'
import { toast } from 'sonner'

// Sprite sheet dimensions
const SPRITE_SIZE = 200 // Each building is 200x200 in the sprite sheet
const TILE_DISPLAY_WIDTH = 128
const TILE_DISPLAY_HEIGHT = 64

// Building positions in sprite sheet (2x2 grid, each 200x200)
const BUILDING_SPRITES: Record<BuildingType, { col: number; row: number }> = {
  townhall: { col: 0, row: 0 }, // Top-left: House
  bank: { col: 1, row: 0 },     // Top-right: Apartment
  shop: { col: 0, row: 1 },     // Bottom-left: Coffee shop
  lottery: { col: 1, row: 1 },  // Bottom-right: Office
}

// Grid to screen conversion (isometric)
const gridToScreen = (gridX: number, gridY: number) => ({
  x: (gridX - gridY) * (TILE_DISPLAY_WIDTH / 2),
  y: (gridX + gridY) * (TILE_DISPLAY_HEIGHT / 2)
})

const screenToGrid = (screenX: number, screenY: number) => {
  const x = (screenX / (TILE_DISPLAY_WIDTH / 2) + screenY / (TILE_DISPLAY_HEIGHT / 2)) / 2
  const y = (screenY / (TILE_DISPLAY_HEIGHT / 2) - screenX / (TILE_DISPLAY_WIDTH / 2)) / 2
  return { x: Math.floor(x), y: Math.floor(y) }
}

// Isometric Grass Tile Component using sprite
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

  return (
    <div
      className="absolute cursor-pointer"
      style={{
        left: screen.x - TILE_DISPLAY_WIDTH / 2,
        top: screen.y - TILE_DISPLAY_HEIGHT / 2,
        width: TILE_DISPLAY_WIDTH,
        height: TILE_DISPLAY_HEIGHT,
        zIndex: x + y,
      }}
      onClick={onClick}
    >
      {/* Grass tile from sprite sheet - using bottom-left tile (plain grass) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/assets/grass-tiles.png)',
          backgroundPosition: '0px -266px', // Bottom-left tile (row 2, col 0)
          backgroundSize: '256px 400px',
          imageRendering: 'pixelated',
        }}
      />

      {/* Hover/placement overlay */}
      {isHovered && isPlacing && (
        <div
          className="absolute inset-0 transition-opacity"
          style={{
            backgroundColor: isOccupied ? 'rgba(239, 68, 68, 0.5)' : 'rgba(16, 185, 129, 0.5)',
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          }}
        />
      )}

      {/* Subtle hover effect when not placing */}
      {isHovered && !isPlacing && (
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: 'rgba(255, 255, 255, 0.1)',
            clipPath: 'polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)',
          }}
        />
      )}
    </div>
  )
}

// Building Sprite Component
function BuildingSprite({
  building,
  onClick
}: {
  building: Building
  onClick: () => void
}) {
  const screen = gridToScreen(building.position.x, building.position.y)
  const info = BUILDING_INFO[building.type]

  if (!info) return null

  const sprite = BUILDING_SPRITES[building.type]
  const spriteX = sprite.col * SPRITE_SIZE
  const spriteY = sprite.row * SPRITE_SIZE

  return (
    <motion.div
      className="absolute cursor-pointer"
      style={{
        left: screen.x - 80,
        top: screen.y - 140,
        width: 160,
        height: 160,
        zIndex: (building.position.x + building.position.y) * 10 + 100,
      }}
      initial={{ scale: 0, y: 20 }}
      animate={{ scale: 1, y: 0 }}
      whileHover={{ scale: 1.05, y: -5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      onClick={onClick}
    >
      {/* Building sprite from sprite sheet */}
      <div
        className="w-full h-full"
        style={{
          backgroundImage: 'url(/assets/buildings-1.png)',
          backgroundPosition: `-${spriteX * 0.8}px -${spriteY * 0.8}px`,
          backgroundSize: '320px 320px', // Scale 400px to 320px (0.8x)
          imageRendering: 'pixelated',
        }}
      />

      {/* Building name label */}
      <div
        className="absolute -bottom-2 left-1/2 -translate-x-1/2 whitespace-nowrap px-2 py-1"
        style={{
          fontFamily: '"Press Start 2P", monospace',
          fontSize: '7px',
          backgroundColor: 'rgba(15, 23, 42, 0.95)',
          color: info.colors.roof,
          border: `2px solid ${info.colors.accent}`,
          boxShadow: `2px 2px 0px ${info.colors.accent}40`
        }}
      >
        {info.name}
      </div>
    </motion.div>
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
  const sprite = BUILDING_SPRITES[type]
  const spriteX = sprite.col * SPRITE_SIZE
  const spriteY = sprite.row * SPRITE_SIZE

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        left: screen.x - 80,
        top: screen.y - 140,
        width: 160,
        height: 160,
        zIndex: 9999,
        opacity: 0.7,
      }}
      initial={{ scale: 0.8 }}
      animate={{ scale: [0.95, 1.05, 0.95] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <div
        className="w-full h-full"
        style={{
          backgroundImage: 'url(/assets/buildings-1.png)',
          backgroundPosition: `-${spriteX * 0.8}px -${spriteY * 0.8}px`,
          backgroundSize: '320px 320px',
          imageRendering: 'pixelated',
          filter: 'brightness(1.3) saturate(0.7)',
        }}
      />
    </motion.div>
  )
}

export function IsometricGameCanvas() {
  const containerRef = useRef<HTMLDivElement>(null)
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null)
  const [buildModalOpen, setBuildModalOpen] = useState(false)
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [isCreatingTownHall, setIsCreatingTownHall] = useState(false)

  const { wallets } = useWallets()
  const { createTownHall, loading: townHallLoading, error: townHallError } = useCreateTownHall()

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

  // Get user's wallet address
  const getUserAddress = () => {
    const privyWallet = wallets.find(w => w.walletClientType === 'privy')
    if (privyWallet) return privyWallet.address
    if (wallets.length > 0) return wallets[0].address
    return null
  }

  // Calculate center offset for the grid
  const gridPixelWidth = GRID_SIZE * TILE_DISPLAY_WIDTH
  const gridPixelHeight = GRID_SIZE * TILE_DISPLAY_HEIGHT

  // Handle mouse move for hover
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.width / 2
    const centerY = rect.height / 2

    const mouseX = (e.clientX - rect.left - centerX) / zoom
    const mouseY = (e.clientY - rect.top - centerY + 100) / zoom

    const grid = screenToGrid(mouseX, mouseY)

    if (grid.x >= 0 && grid.x < GRID_SIZE && grid.y >= 0 && grid.y < GRID_SIZE) {
      setHoveredTile(grid)
    } else {
      setHoveredTile(null)
    }
  }, [zoom])

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

    // For other buildings, just add locally (can be extended to call contracts)
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

  // Sort buildings by depth
  const sortedBuildings = [...buildings].sort((a, b) =>
    (a.position.x + a.position.y) - (b.position.x + b.position.y)
  )

  return (
    <>
      <div
        ref={containerRef}
        className="fixed inset-0 overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
        }}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHoveredTile(null)}
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

        {/* Grid container - centered */}
        <div
          className="absolute left-1/2 top-1/2"
          style={{
            transform: `translate(-50%, -50%) scale(${zoom})`,
            transformOrigin: 'center center',
          }}
        >
          {/* Isometric grid */}
          <div className="relative" style={{ marginTop: -100 }}>
            {/* Render tiles */}
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

            {/* Render buildings */}
            <AnimatePresence>
              {sortedBuildings.map((building) => (
                <BuildingSprite
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
          </div>
        </div>

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
                className="w-20 h-20 mx-auto mb-4"
                style={{
                  backgroundImage: 'url(/assets/buildings-1.png)',
                  backgroundPosition: '0px 0px',
                  backgroundSize: '96px 96px',
                  imageRendering: 'pixelated',
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
              <div className="text-slate-400 text-sm">
                Please confirm the transaction in your wallet
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
