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

// Global singleton to prevent multiple Pixi instances
let globalPixiApp: Application | null = null
let globalPixiInitialized = false

// Base path for assets
const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '/defi-city'
const ASSET_PATH = `${BASE_PATH}/assets`

// Isometric constants
const TILE_WIDTH = 128
const TILE_HEIGHT = 64

// Grid size - large enough to fill the screen
const GRID_SIZE = 30

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

  // Initialize PixiJS
  useEffect(() => {
    if (!canvasRef.current) return
    if (globalPixiInitialized) {
      if (globalPixiApp && !canvasRef.current.contains(globalPixiApp.canvas)) {
        canvasRef.current.appendChild(globalPixiApp.canvas)
        appRef.current = globalPixiApp
        setIsInitialized(true)
        setTexturesLoaded(true)
      }
      return
    }

    globalPixiInitialized = true

    const initPixi = async () => {
      const app = new Application()
      await app.init({
        background: 0x1a1a2e,
        resizeTo: window,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })

      canvasRef.current?.appendChild(app.canvas)
      appRef.current = app
      globalPixiApp = app

      // Load textures
      try {
        const buildings = await Assets.load(`${ASSET_PATH}/buildings-1.png`)
        texturesRef.current.buildings = buildings
        setTexturesLoaded(true)
      } catch (e) {
        console.warn('Failed to load textures:', e)
      }

      // Create world container centered on screen
      const world = new Container()
      world.x = app.screen.width / 2
      world.y = app.screen.height / 2.5
      world.scale.set(0.7) // Initial zoom to fit the larger grid
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

      // Setup camera drag/pan - left click drag when not placing buildings
      app.stage.on('pointerdown', (e) => {
        const state = useGameStore.getState()
        // Allow drag with: left click (when not placing), middle click, right click, or alt+click
        const canDrag = e.button === 0 && !state.isPlacingBuilding
        if (canDrag || e.button === 1 || e.button === 2 || e.altKey) {
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
        if (worldRef.current && appRef.current) {
          worldRef.current.x = appRef.current.screen.width / 2
          worldRef.current.y = appRef.current.screen.height / 2.5
        }
      }
      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }

    initPixi()

    return () => {
      appRef.current = null
      setIsInitialized(false)
      setTexturesLoaded(false)
    }
  }, [])

  // Create starfield background
  const createStarfield = (app: Application) => {
    const stars = new Graphics()
    for (let i = 0; i < 150; i++) {
      const x = Math.random() * app.screen.width
      const y = Math.random() * app.screen.height * 0.7
      const radius = Math.random() * 1.5 + 0.5
      const alpha = Math.random() * 0.6 + 0.2
      stars.circle(x, y, radius)
      stars.fill({ color: 0xffffff, alpha })
    }
    app.stage.addChildAt(stars, 0)
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

        // Ground tile (always visible)
        const tile = new Graphics()
        tile.poly([
          { x: 0, y: -TILE_HEIGHT / 2 },
          { x: TILE_WIDTH / 2, y: 0 },
          { x: 0, y: TILE_HEIGHT / 2 },
          { x: -TILE_WIDTH / 2, y: 0 },
        ])
        tile.fill({ color: 0x2d5a27, alpha: 0.9 })

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

      tile.clear()
      tile.poly([
        { x: 0, y: -TILE_HEIGHT / 2 },
        { x: TILE_WIDTH / 2, y: 0 },
        { x: 0, y: TILE_HEIGHT / 2 },
        { x: -TILE_WIDTH / 2, y: 0 },
      ])

      if (isHovered && isPlacingBuilding) {
        // Highlight when placing building
        tile.fill({ color: occupied ? 0xef4444 : 0x10b981, alpha: 0.7 })
        tile.stroke({ color: occupied ? 0xef4444 : 0x10b981, width: 2, alpha: 1 })
      } else if (isHovered) {
        // Normal hover
        tile.fill({ color: 0x3d7a37, alpha: 0.95 })
      } else {
        // Default state
        tile.fill({ color: 0x2d5a27, alpha: 0.9 })
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
      }

      // Position building at grid cell center
      const screen = gridToScreen(building.position.x, building.position.y)
      sprite.x = screen.x
      sprite.y = screen.y
      sprite.zIndex = (building.position.x + building.position.y) * 10 + 100
    })
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
        className="fixed inset-0 overflow-hidden"
        style={{ background: 'linear-gradient(180deg, #0f0f23 0%, #1a1a2e 40%, #16213e 100%)' }}
      />

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
          className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-2"
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
        onConfirm={handleConfirmBuild}
        // Pass pending grid position so Bank/Town Hall use the exact clicked tile
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
