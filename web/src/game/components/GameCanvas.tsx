import { useEffect, useRef, useCallback } from 'react'
import { Application, Assets, Container, Graphics, Sprite, Texture } from 'pixi.js'
import type { Building } from '../types'
import { MAP_WIDTH, MAP_HEIGHT, TILE_WIDTH, TILE_HEIGHT, BUILDINGS } from '../constants'
import { screenToTile, tileToScreen, darken } from '../utils/isometric'

interface GameCanvasProps {
  buildings: Building[]
  playerTileX: number
  playerTileY: number
  placingType: string | null
  canPlace: (x: number, y: number, type: string) => boolean
  onPlaceBuilding: (x: number, y: number) => void
  onSelectBuilding: (building: Building) => void
  onMovePlayer: (dx: number, dy: number) => void
}

export function GameCanvas({
  buildings,
  playerTileX,
  playerTileY,
  placingType,
  canPlace,
  onPlaceBuilding,
  onSelectBuilding,
  onMovePlayer
}: GameCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<Application | null>(null)
  const worldContainerRef = useRef<Container | null>(null)
  const playerRef = useRef<Container | null>(null)
  const texturesRef = useRef<Record<string, Texture>>({})
  const previewRef = useRef<Graphics | null>(null)
  const keysRef = useRef<Record<string, boolean>>({})

  const centerX = MAP_WIDTH * TILE_WIDTH / 2

  // Initialize PixiJS
  useEffect(() => {
    if (!containerRef.current) return

    const initApp = async () => {
      const app = new Application()
      await app.init({
        background: 0x1a1a2e,
        resizeTo: window,
        antialias: false,
        resolution: 1,
        preference: 'webgl'
      })

      containerRef.current?.appendChild(app.canvas)
      appRef.current = app

      // Load textures
      const loaded: Record<string, Texture> = {}
      for (const [type, def] of Object.entries(BUILDINGS)) {
        try {
          loaded[type] = await Assets.load(def.sprite)
        } catch (e) {
          console.warn(`Failed to load texture for ${type}`)
        }
      }
      texturesRef.current = loaded

      // Create world container
      const worldContainer = new Container()
      worldContainer.sortableChildren = true
      app.stage.addChild(worldContainer)
      worldContainerRef.current = worldContainer

      // Draw map
      drawIsometricMap(worldContainer)

      // Create player
      const player = createPlayer()
      worldContainer.addChild(player)
      playerRef.current = player

      // Start game loop
      app.ticker.add(() => gameLoop())
    }

    initApp()

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
      }
    }
  }, [])

  // Draw isometric map
  const drawIsometricMap = (container: Container) => {
    const pathY = Math.floor(MAP_HEIGHT / 2)
    const pathX = Math.floor(MAP_WIDTH / 2)

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const screen = tileToScreen(x, y)
        const g = new Graphics()

        const isPath =
          (y === pathY || x === pathX) &&
          x > 2 && x < MAP_WIDTH - 3 &&
          y > 2 && y < MAP_HEIGHT - 3

        let topColor: number
        if (isPath) {
          topColor = 0x3a3a5a
        } else {
          const variant = (x + y) % 3
          topColor = variant === 0 ? 0x2a4a2a : variant === 1 ? 0x1a3a1a : 0x2a3a2a
        }

        g.poly([
          screen.x + centerX, screen.y,
          screen.x + centerX + TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2,
          screen.x + centerX, screen.y + TILE_HEIGHT,
          screen.x + centerX - TILE_WIDTH / 2, screen.y + TILE_HEIGHT / 2
        ])
        g.fill(topColor)
        g.stroke({ width: 1, color: darken(topColor, 0.3), alpha: 0.5 })

        container.addChild(g)
      }
    }
  }

  // Create player sprite
  const createPlayer = (): Container => {
    const player = new Container()
    const screen = tileToScreen(playerTileX, playerTileY)
    player.x = screen.x + centerX
    player.y = screen.y + TILE_HEIGHT / 2

    const g = new Graphics()
    g.ellipse(0, 10, 12, 6)
    g.fill({ color: 0x000000, alpha: 0.3 })
    g.ellipse(0, -10, 10, 15)
    g.fill(0x00ffff)
    g.circle(0, -30, 10)
    g.fill(0xffdbac)
    g.circle(-3, -32, 2)
    g.fill(0x333333)
    g.circle(3, -32, 2)
    g.fill(0x333333)

    player.addChild(g)
    player.zIndex = 10000
    return player
  }

  // Update buildings when they change
  useEffect(() => {
    if (!worldContainerRef.current) return

    // Remove old buildings (keep map and player)
    const toRemove = worldContainerRef.current.children.filter(
      (c: any) => c.isBuilding
    )
    toRemove.forEach((c) => worldContainerRef.current?.removeChild(c))

    // Add new buildings
    buildings.forEach((building, idx) => {
      const def = BUILDINGS[building.type]
      if (!def) return

      const container = new Container() as Container & { isBuilding: boolean; buildingIdx: number }
      container.isBuilding = true
      container.buildingIdx = idx

      const screen = tileToScreen(building.x, building.y)
      container.x = screen.x + centerX
      container.y = screen.y

      const texture = texturesRef.current[building.type]
      if (texture) {
        const sprite = new Sprite(texture)
        const targetWidth = def.w * TILE_WIDTH
        const scale = targetWidth / sprite.texture.width
        sprite.scale.set(scale)
        sprite.anchor.set(0.5, 1)
        sprite.x = (def.w * TILE_WIDTH) / 2
        sprite.y = def.h * TILE_HEIGHT + 10
        container.addChild(sprite)
      } else {
        // Fallback graphics
        const g = new Graphics()
        const bw = def.w * TILE_WIDTH
        const bh = def.h * TILE_HEIGHT
        const height = def.height

        g.ellipse(bw / 4, bh / 2 + 10, bw / 3, bh / 4)
        g.fill({ color: 0x000000, alpha: 0.25 })
        g.poly([0, bh / 2, 0, bh / 2 - height, bw / 2, bh - height, bw / 2, bh])
        g.fill(darken(def.color, 0.3))
        g.poly([bw / 2, bh, bw / 2, bh - height, bw, bh / 2 - height, bw, bh / 2])
        g.fill(darken(def.color, 0.15))
        g.poly([bw / 2, 0 - height + bh / 2, bw, bh / 2 - height, bw / 2, bh - height, 0, bh / 2 - height])
        g.fill(def.color)

        container.addChild(g)
      }

      // Add earning indicator
      if (def.apy > 0 && building.deposited > 0) {
        const indicator = new Graphics()
        indicator.circle(def.w * TILE_WIDTH - 10, -40, 8)
        indicator.fill(0x39ff14)
        container.addChild(indicator)
      }

      container.zIndex = building.y * 100 + building.x
      worldContainerRef.current?.addChild(container)
    })

    worldContainerRef.current.sortChildren()
  }, [buildings, centerX])

  // Update player position
  useEffect(() => {
    if (!playerRef.current) return
    const screen = tileToScreen(playerTileX, playerTileY)
    playerRef.current.x = screen.x + centerX
    playerRef.current.y = screen.y + TILE_HEIGHT / 2
    centerCamera()
  }, [playerTileX, playerTileY, centerX])

  // Center camera on player
  const centerCamera = useCallback(() => {
    if (!appRef.current || !worldContainerRef.current || !playerRef.current) return

    const mapW = MAP_WIDTH * TILE_WIDTH
    const mapH = MAP_HEIGHT * TILE_HEIGHT + MAP_HEIGHT * TILE_HEIGHT / 2

    let camX = appRef.current.screen.width / 2 - playerRef.current.x
    let camY = appRef.current.screen.height / 2 - playerRef.current.y

    const minX = appRef.current.screen.width - mapW - 200
    const maxX = 200
    const minY = appRef.current.screen.height - mapH - 100
    const maxY = 100

    camX = Math.max(minX, Math.min(maxX, camX))
    camY = Math.max(minY, Math.min(maxY, camY))

    worldContainerRef.current.x = camX
    worldContainerRef.current.y = camY
  }, [])

  // Game loop for movement
  const gameLoop = useCallback(() => {
    const keys = keysRef.current
    let dx = 0, dy = 0

    if (keys['w'] || keys['arrowup']) { dy = -0.15; dx = -0.15 }
    if (keys['s'] || keys['arrowdown']) { dy = 0.15; dx = 0.15 }
    if (keys['a'] || keys['arrowleft']) { dx = -0.15; dy = 0.15 }
    if (keys['d'] || keys['arrowright']) { dx = 0.15; dy = -0.15 }

    if (dx !== 0 || dy !== 0) {
      onMovePlayer(dx, dy)
    }
  }, [onMovePlayer])

  // Keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = true
    }
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.key.toLowerCase()] = false
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [])

  // Handle click
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (!worldContainerRef.current) return

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const worldX = e.clientX - rect.left - worldContainerRef.current.x
      const worldY = e.clientY - rect.top - worldContainerRef.current.y
      const tile = screenToTile(worldX - centerX, worldY)

      if (placingType) {
        onPlaceBuilding(tile.x, tile.y)
      } else {
        const building = buildings.find((b) => {
          const def = BUILDINGS[b.type]
          return tile.x >= b.x && tile.x < b.x + def.w && tile.y >= b.y && tile.y < b.y + def.h
        })
        if (building) {
          onSelectBuilding(building)
        }
      }
    },
    [placingType, buildings, centerX, onPlaceBuilding, onSelectBuilding]
  )

  // Handle mouse move for preview
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!placingType || !worldContainerRef.current) return

      const rect = containerRef.current?.getBoundingClientRect()
      if (!rect) return

      const worldX = e.clientX - rect.left - worldContainerRef.current.x
      const worldY = e.clientY - rect.top - worldContainerRef.current.y
      const tile = screenToTile(worldX - centerX, worldY)

      // Update or create preview
      if (previewRef.current) {
        worldContainerRef.current.removeChild(previewRef.current)
      }

      const def = BUILDINGS[placingType]
      if (!def) return

      const preview = new Graphics()
      const screen = tileToScreen(tile.x, tile.y)
      const bw = def.w * TILE_WIDTH
      const bh = def.h * TILE_HEIGHT
      const valid = canPlace(tile.x, tile.y, placingType)
      const color = valid ? 0x39ff14 : 0xff0044

      preview.poly([
        screen.x + centerX + bw / 2, screen.y,
        screen.x + centerX + bw, screen.y + bh / 2,
        screen.x + centerX + bw / 2, screen.y + bh,
        screen.x + centerX, screen.y + bh / 2
      ])
      preview.fill({ color, alpha: 0.4 })
      preview.stroke({ width: 2, color })
      preview.zIndex = 9999

      worldContainerRef.current.addChild(preview)
      previewRef.current = preview
      worldContainerRef.current.sortChildren()
    },
    [placingType, centerX, canPlace]
  )

  // Clear preview when not placing
  useEffect(() => {
    if (!placingType && previewRef.current && worldContainerRef.current) {
      worldContainerRef.current.removeChild(previewRef.current)
      previewRef.current = null
    }
  }, [placingType])

  return (
    <div
      ref={containerRef}
      id="game-canvas-container"
      style={{ width: '100%', height: '100%' }}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
    />
  )
}
