'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { Application, Container, Sprite, Graphics, Texture, Assets, Rectangle } from 'pixi.js'
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

// Grid size - optimized for better visibility
const GRID_SIZE = 12

// Building sprite sheet: 400x400, 2x2 grid
const BUILDING_SHEET_WIDTH = 400
const BUILDING_SHEET_HEIGHT = 400
const BUILDING_COLS = 2
const BUILDING_ROWS = 2
const BUILDING_SPRITE_WIDTH = BUILDING_SHEET_WIDTH / BUILDING_COLS   // 200
const BUILDING_SPRITE_HEIGHT = BUILDING_SHEET_HEIGHT / BUILDING_ROWS // 200

// Building render size on map (should fit nicely on a single tile)
const BUILDING_RENDER_SIZE = 140

// Building sprite configuration - position in 2x2 grid
interface SpriteConfig {
  col: number
  row: number
}

const BUILDING_SPRITES: Record<BuildingType, SpriteConfig> = {
  townhall: { col: 0, row: 0 },  // Brown house (top-left)
  bank: { col: 1, row: 0 },      // Gray apartment (top-right)
  shop: { col: 0, row: 1 },      // Coffee shop (bottom-left)
  lottery: { col: 1, row: 1 },   // Office building (bottom-right)
}

// Convert grid coordinates to screen (isometric)
function gridToScreen(gridX: number, gridY: number): { x: number; y: number } {
  return {
    x: (gridX - gridY) * (TILE_WIDTH / 2),
    y: (gridX + gridY) * (TILE_HEIGHT / 2),
  }
}

// Convert screen coordinates to grid (isometric)
function screenToGrid(screenX: number, screenY: number): { x: number; y: number } {
  const x = (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2
  const y = (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2
  return { x: Math.floor(x), y: Math.floor(y) }
}

export function PixiGameCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const worldRef = useRef<Container | null>(null)
  const tilesContainerRef = useRef<Container | null>(null)
  const gridLinesRef = useRef<Container | null>(null)
  const tilesRef = useRef<Map<string, Graphics>>(new Map())
  const buildingsRef = useRef<Map<string, Sprite>>(new Map())
  const ghostRef = useRef<Sprite | null>(null)
  const texturesRef = useRef<{
    buildings?: Texture
  }>({})
  const dragRef = useRef<{ isDragging: boolean; lastX: number; lastY: number }>({
    isDragging: false,
    lastX: 0,
    lastY: 0,
  })

  const [isInitialized, setIsInitialized] = useState(false)
  const [texturesLoaded, setTexturesLoaded] = useState(false)
  const [hoveredTile, setHoveredTile] = useState<{ x: number; y: number } | null>(null)
  const [buildModalOpen, setBuildModalOpen] = useState(false)
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [infoModalOpen, setInfoModalOpen] = useState(false)
  const [isCreatingTownHall, setIsCreatingTownHall] = useState(false)

  const { wallets } = useWallets()
  const { createTownHall, loading: townHallLoading, error: townHallError } = useCreateTownHall()

  // Use selector to ensure re-render when buildings change
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

  // Initialize PixiJS
  useEffect(() => {
    if (!canvasRef.current) return

    // Always create new instance with correct size
    const initPixi = async () => {
      // Calculate available space (exclude TopBar and BottomBar)
      const topBarHeight = 64  // TopBar height
      const bottomBarHeight = 144  // BottomBar height (h-36 = 144px)
      const availableWidth = window.innerWidth
      const availableHeight = window.innerHeight - topBarHeight - bottomBarHeight
      
      const app = new Application()
      await app.init({
        background: 0x1a1a2e,
        width: availableWidth,
        height: availableHeight,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })

      canvasRef.current?.appendChild(app.canvas)
      appRef.current = app

      // Load textures
      try {
        const buildings = await Assets.load(`${ASSET_PATH}/buildings-1.png`)
        texturesRef.current.buildings = buildings
        setTexturesLoaded(true)
      } catch (e) {
        console.warn('Failed to load textures:', e)
      }

      // Create world container centered on screen
      // Center in available space
      const world = new Container()
      world.x = availableWidth / 2
      world.y = availableHeight / 2 - 20  // Offset up slightly for better centering
      world.scale.set(1.1) // Optimal zoom for 12x12 grid
      world.sortableChildren = true
      app.stage.addChild(world)
      worldRef.current = world

      // Create starfield background
      createStarfield(app)

      // Create isometric grid (tiles and grid lines)
      createGrid(world)

      // Setup interaction
      app.stage.eventMode = 'static'
      app.stage.hitArea = app.screen

      // Setup camera drag/pan
      app.stage.on('pointerdown', (e) => {
        if (e.button === 1 || e.button === 2 || e.altKey) {
          dragRef.current.isDragging = true
          dragRef.current.lastX = e.global.x
          dragRef.current.lastY = e.global.y
        }
      })

      app.stage.on('pointermove', (e) => {
        if (dragRef.current.isDragging && worldRef.current) {
          const dx = e.global.x - dragRef.current.lastX
          const dy = e.global.y - dragRef.current.lastY
          worldRef.current.x += dx
          worldRef.current.y += dy
          dragRef.current.lastX = e.global.x
          dragRef.current.lastY = e.global.y
        }
      })

      app.stage.on('pointerup', () => {
        dragRef.current.isDragging = false
      })

      app.stage.on('pointerupoutside', () => {
        dragRef.current.isDragging = false
      })

      setIsInitialized(true)

      // Handle resize
      const handleResize = () => {
        if (appRef.current) {
          const topBarHeight = 64
          const bottomBarHeight = 144
          const availableWidth = window.innerWidth
          const availableHeight = window.innerHeight - topBarHeight - bottomBarHeight

          appRef.current.renderer.resize(availableWidth, availableHeight)
          
          if (worldRef.current) {
            worldRef.current.x = availableWidth / 2
            worldRef.current.y = availableHeight / 2
          }
        }
      }
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }

    initPixi()

    return () => {
      // Cleanup on unmount
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
      }
      setIsInitialized(false)
      setTexturesLoaded(false)
    }
  }, [])

  // Create beautiful starfield background
  const createStarfield = (app: Application) => {
    const stars = new Graphics()

    // Create various sized stars with different colors
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * app.screen.width
      const y = Math.random() * app.screen.height
      const radius = Math.random() * 2 + 0.3
      const alpha = Math.random() * 0.8 + 0.2

      // Mix of white and slightly colored stars
      const colorVariation = Math.random()
      const color = colorVariation > 0.9 ? 0xadd8e6 : // Light blue
                    colorVariation > 0.8 ? 0xffd700 : // Gold
                    0xffffff // White

      stars.circle(x, y, radius)
      stars.fill({ color, alpha })
    }

    // Add some nebula-like glow effects
    const nebulaGlow = new Graphics()
    for (let i = 0; i < 5; i++) {
      const x = Math.random() * app.screen.width
      const y = Math.random() * app.screen.height
      const radius = Math.random() * 100 + 50
      const colors = [0x1e3a8a, 0x581c87, 0x064e3b] // Blue, purple, teal
      const color = colors[Math.floor(Math.random() * colors.length)]

      nebulaGlow.circle(x, y, radius)
      nebulaGlow.fill({ color, alpha: 0.05 })
    }

    app.stage.addChildAt(nebulaGlow, 0)
    app.stage.addChildAt(stars, 1)
  }

  // Create isometric grid
  const createGrid = (world: Container) => {
    // Tiles container (ground)
    const tilesContainer = new Container()
    tilesContainer.sortableChildren = true
    tilesContainer.zIndex = 0
    world.addChild(tilesContainer)
    tilesContainerRef.current = tilesContainer

    // Grid lines container (separate for visibility toggle)
    const gridLines = new Container()
    gridLines.sortableChildren = true
    gridLines.zIndex = 1
    gridLines.visible = false // Hidden by default
    world.addChild(gridLines)
    gridLinesRef.current = gridLines

    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const screen = gridToScreen(x, y)

        // Calculate checkerboard pattern for visual variety
        const isEvenTile = (x + y) % 2 === 0

        // Create beautiful tile with vibrant colors
        const tile = new Graphics()

        // Main tile body with rich green colors
        const darkGreen = 0x2d5016 // Rich dark green
        const lightGreen = 0x3a6b1f // Vibrant light green
        const tileColor = isEvenTile ? darkGreen : lightGreen

        tile.poly([
          { x: 0, y: -TILE_HEIGHT / 2 },
          { x: TILE_WIDTH / 2, y: 0 },
          { x: 0, y: TILE_HEIGHT / 2 },
          { x: -TILE_WIDTH / 2, y: 0 },
        ])
        tile.fill({ color: tileColor, alpha: 1.0 })

        // Add edge highlighting for 3D effect
        tile.poly([
          { x: 0, y: -TILE_HEIGHT / 2 },
          { x: TILE_WIDTH / 2, y: 0 },
          { x: 0, y: TILE_HEIGHT / 2 },
          { x: -TILE_WIDTH / 2, y: 0 },
        ])
        tile.stroke({ color: 0x4a7e28, width: 2, alpha: 0.5 })

        // Add top highlight for depth
        tile.poly([
          { x: 0, y: -TILE_HEIGHT / 2 + 3 },
          { x: TILE_WIDTH / 2 - 6, y: -1 },
          { x: 0, y: TILE_HEIGHT / 2 - 3 },
          { x: -TILE_WIDTH / 2 + 6, y: -1 },
        ])
        tile.fill({ color: 0x5a9e32, alpha: 0.2 })

        tile.x = screen.x
        tile.y = screen.y
        tile.zIndex = x + y
        tile.eventMode = 'static'
        tile.cursor = 'pointer'

        // Store grid position
        ;(tile as any).gridX = x
        ;(tile as any).gridY = y

        // Hover and click events
        tile.on('pointerenter', () => {
          setHoveredTile({ x, y })
        })

        tile.on('pointerleave', () => {
          setHoveredTile(null)
        })

        tile.on('pointerdown', () => {
          handleTileClick(x, y)
        })

        tilesContainer.addChild(tile)
        tilesRef.current.set(`${x}-${y}`, tile)

        // Grid line overlay (shown when placing)
        const gridLine = new Graphics()
        gridLine.poly([
          { x: 0, y: -TILE_HEIGHT / 2 },
          { x: TILE_WIDTH / 2, y: 0 },
          { x: 0, y: TILE_HEIGHT / 2 },
          { x: -TILE_WIDTH / 2, y: 0 },
        ])
        gridLine.stroke({ color: 0x4ade80, width: 1, alpha: 0.6 })

        gridLine.x = screen.x
        gridLine.y = screen.y
        gridLine.zIndex = x + y
        gridLines.addChild(gridLine)
      }
    }
  }

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

  // Toggle grid lines visibility based on placing mode
  useEffect(() => {
    if (gridLinesRef.current) {
      gridLinesRef.current.visible = isPlacingBuilding
    }
  }, [isPlacingBuilding])

  // Update tile highlights
  useEffect(() => {
    if (!isInitialized) return

    tilesRef.current.forEach((tile, key) => {
      const [x, y] = key.split('-').map(Number)
      const isHovered = hoveredTile?.x === x && hoveredTile?.y === y
      const occupied = isPositionOccupied(x, y)

      // Checkerboard pattern
      const isEvenTile = (x + y) % 2 === 0
      const darkGreen = 0x2d5016
      const lightGreen = 0x3a6b1f

      tile.clear()

      // Main tile
      tile.poly([
        { x: 0, y: -TILE_HEIGHT / 2 },
        { x: TILE_WIDTH / 2, y: 0 },
        { x: 0, y: TILE_HEIGHT / 2 },
        { x: -TILE_WIDTH / 2, y: 0 },
      ])

      if (isHovered && isPlacingBuilding) {
        // Highlight when placing building
        tile.fill({ color: occupied ? 0xef4444 : 0x10b981, alpha: 0.8 })
        tile.stroke({ color: occupied ? 0xef4444 : 0x10b981, width: 3, alpha: 1 })
      } else if (isHovered) {
        // Bright hover effect
        tile.fill({ color: 0x4a7e28, alpha: 1.0 })
        tile.stroke({ color: 0x5a9e32, width: 2, alpha: 0.6 })
      } else {
        // Default checkerboard pattern
        const tileColor = isEvenTile ? darkGreen : lightGreen
        tile.fill({ color: tileColor, alpha: 1.0 })
        tile.stroke({ color: 0x4a7e28, width: 2, alpha: 0.5 })
      }
    })
  }, [hoveredTile, isPlacingBuilding, isInitialized, isPositionOccupied])

  // Helper to get texture for a building type
  const getTextureForBuilding = (type: BuildingType): Texture | null => {
    const config = BUILDING_SPRITES[type]
    if (!config) return null

    const sheetTexture = texturesRef.current.buildings
    if (!sheetTexture) return null

    return new Texture({
      source: sheetTexture.source,
      frame: new Rectangle(
        config.col * BUILDING_SPRITE_WIDTH,
        config.row * BUILDING_SPRITE_HEIGHT,
        BUILDING_SPRITE_WIDTH,
        BUILDING_SPRITE_HEIGHT
      ),
    })
  }

  // Update buildings
  useEffect(() => {
    if (!isInitialized || !texturesLoaded || !worldRef.current) return

    const buildingsTexture = texturesRef.current.buildings
    if (!buildingsTexture) return

    const world = worldRef.current

    // Remove old building sprites that no longer exist
    const currentIds = new Set(buildings.map(b => b.id))
    buildingsRef.current.forEach((sprite, id) => {
      if (!currentIds.has(id)) {
        world.removeChild(sprite)
        buildingsRef.current.delete(id)
      }
    })

    // Add or update buildings
    buildings.forEach((building) => {
      let sprite = buildingsRef.current.get(building.id)

      if (!sprite) {
        const config = BUILDING_SPRITES[building.type]
        if (!config) return

        const texture = new Texture({
          source: buildingsTexture.source,
          frame: new Rectangle(
            config.col * BUILDING_SPRITE_WIDTH,
            config.row * BUILDING_SPRITE_HEIGHT,
            BUILDING_SPRITE_WIDTH,
            BUILDING_SPRITE_HEIGHT
          ),
        })

        sprite = new Sprite(texture)
        sprite.anchor.set(0.5, 1.0) // Anchor at bottom center
        sprite.width = BUILDING_RENDER_SIZE
        sprite.height = BUILDING_RENDER_SIZE
        sprite.eventMode = 'static'
        sprite.cursor = 'pointer'

        sprite.on('pointerdown', () => {
          setSelectedBuilding(building)
          setInfoModalOpen(true)
        })

        sprite.on('pointerenter', () => {
          sprite!.scale.set(sprite!.scale.x * 1.05, sprite!.scale.y * 1.05)
        })

        sprite.on('pointerleave', () => {
          const scaleX = BUILDING_RENDER_SIZE / BUILDING_SPRITE_WIDTH
          const scaleY = BUILDING_RENDER_SIZE / BUILDING_SPRITE_HEIGHT
          sprite!.scale.set(scaleX, scaleY)
        })

        world.addChild(sprite)
        buildingsRef.current.set(building.id, sprite)
        console.log('[PixiGameCanvas] Building sprite created and added to world:', building.id)
      }

      // Position building at grid cell center
      const screen = gridToScreen(building.position.x, building.position.y)
      sprite.x = screen.x
      sprite.y = screen.y
      sprite.zIndex = (building.position.x + building.position.y) * 10 + 100
    })

    // Auto-center on Town Hall if it exists
    const townHall = buildings.find(b => b.type === 'townhall')
    if (townHall && appRef.current) {
      const screen = gridToScreen(townHall.position.x, townHall.position.y)
      const topBarHeight = 64
      const bottomBarHeight = 144
      const availableWidth = window.innerWidth
      const availableHeight = window.innerHeight - topBarHeight - bottomBarHeight
      
      // Center the world on the Town Hall position
      world.x = availableWidth / 2 - screen.x * world.scale.x
      world.y = (availableHeight / 2 - 20) - screen.y * world.scale.y
    }
  }, [buildings, isInitialized, texturesLoaded])

  // Update ghost building preview
  useEffect(() => {
    if (!isInitialized || !texturesLoaded || !worldRef.current) return

    const world = worldRef.current

    // Remove existing ghost
    if (ghostRef.current) {
      world.removeChild(ghostRef.current)
      ghostRef.current = null
    }

    // Add ghost if placing and hovering valid tile
    if (isPlacingBuilding && selectedBuildingType && hoveredTile && !isPositionOccupied(hoveredTile.x, hoveredTile.y)) {
      const texture = getTextureForBuilding(selectedBuildingType)
      if (!texture) return

      const ghost = new Sprite(texture)
      ghost.anchor.set(0.5, 1.0) // Anchor at bottom center - same as buildings
      ghost.width = BUILDING_RENDER_SIZE
      ghost.height = BUILDING_RENDER_SIZE
      ghost.alpha = 0.6
      ghost.tint = 0x88ff88
      ghost.zIndex = 9999

      const screen = gridToScreen(hoveredTile.x, hoveredTile.y)
      ghost.x = screen.x
      ghost.y = screen.y

      world.addChild(ghost)
      ghostRef.current = ghost
    }
  }, [isPlacingBuilding, selectedBuildingType, hoveredTile, isInitialized, texturesLoaded, isPositionOccupied])

  // Handle zoom
  useEffect(() => {
    if (!worldRef.current) return
    worldRef.current.scale.set(zoom)
  }, [zoom])

  // Handle wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      if (canvasRef.current?.contains(e.target as Node)) {
        e.preventDefault()
        const delta = e.deltaY > 0 ? -0.1 : 0.1
        setZoom(Math.max(0.3, Math.min(2, zoom + delta)))
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

  return (
    <>
      <div
        ref={canvasRef}
        className="fixed overflow-hidden"
        style={{ 
          background: 'linear-gradient(180deg, #0f0f23 0%, #1a1a2e 40%, #16213e 100%)',
          top: '64px',  // Start below TopBar
          left: 0,
          right: 0,
          bottom: '144px'  // End above BottomBar
        }}
      />

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
          onClick={() => setZoom(Math.max(0.3, zoom - 0.2))}
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
