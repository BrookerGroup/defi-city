'use client'

/**
 * useGameState - React <-> PixiJS bridge hook
 * Initializes PixiJS world when app is ready, syncs buildings and interactions.
 */

import { useRef, useCallback, useEffect, useState } from 'react'
import { Application, Assets, Sprite } from 'pixi.js'
import { screenToIso, isoToScreen, TILE_WIDTH, TILE_HEIGHT } from '@/lib/isometric'
import { GRID_SIZE } from '@/lib/constants'
import { GameWorld } from './GameWorld'
import { IsometricGrid } from './IsometricGrid'
import { BuildingRenderer } from './BuildingRenderer'
import { TileInteraction } from './TileInteraction'

import type { Building } from '@/hooks/useCityBuildings'

interface UseGameStateOptions {
  buildings: Building[]
  selectedCoords: { x: number; y: number } | null
  onSelectTile: (x: number, y: number) => void
  onMoveBuilding: (building: Building, newX: number, newY: number) => void
}

export function useGameState({
  buildings,
  selectedCoords,
  onSelectTile,
  onMoveBuilding,
}: UseGameStateOptions) {
  const worldRef = useRef<GameWorld | null>(null)
  const gridRef = useRef<IsometricGrid | null>(null)
  const buildingRendererRef = useRef<BuildingRenderer | null>(null)
  const interactionRef = useRef<TileInteraction | null>(null)

  const [loading, setLoading] = useState(true)
  const [hoveredTile, setHoveredTile] = useState<{ col: number; row: number } | null>(null)

  // Store callbacks in refs so they don't cause re-init
  const onSelectTileRef = useRef(onSelectTile)
  onSelectTileRef.current = onSelectTile
  const onMoveBuildingRef = useRef(onMoveBuilding)
  onMoveBuildingRef.current = onMoveBuilding
  const buildingsRef = useRef(buildings)
  buildingsRef.current = buildings

  /** Initialize PixiJS world when Application is ready */
  const initWorld = useCallback(async (app: Application) => {
    setLoading(true)

    try {

      // Create world (camera system)
      const world = new GameWorld(app)
      worldRef.current = world

      // Load and add background image (fantasy landscape)
      try {
        const texture = await Assets.load('/assets/game-background.png')
        const bgSprite = new Sprite(texture)
        const center = isoToScreen(GRID_SIZE / 2 - 0.5, GRID_SIZE / 2 - 0.5)
        bgSprite.anchor.set(0.5, 0.5)
        bgSprite.x = center.x
        bgSprite.y = center.y + TILE_HEIGHT / 2
        const gridWidth = GRID_SIZE * TILE_WIDTH
        const gridHeight = GRID_SIZE * TILE_HEIGHT
        const scale = Math.max(gridWidth / texture.width, gridHeight / texture.height) * 1.5
        bgSprite.scale.set(scale)
        bgSprite.zIndex = -1000
        world.container.addChildAt(bgSprite, 0)
      } catch (e) {
        console.warn('[GameState] Could not load background image:', e)
      }

      // Create isometric grid
      const grid = new IsometricGrid()
      grid.build()
      grid.container.zIndex = 0
      world.container.addChild(grid.container)
      gridRef.current = grid

      // Create building renderer (above grid)
      const buildingRenderer = new BuildingRenderer()
      buildingRenderer.container.zIndex = 100
      world.container.addChild(buildingRenderer.container)
      buildingRendererRef.current = buildingRenderer

      // Create tile interaction
      const interaction = new TileInteraction(buildingRenderer, {
        onSelectTile: (x, y) => onSelectTileRef.current(x, y),
        onMoveBuilding: (building, x, y) => onMoveBuildingRef.current(building, x, y),
        onHoverTile: (col, row) => setHoveredTile({ col, row }),
        onClearHover: () => setHoveredTile(null),
      })
      interaction.overlayContainer.zIndex = 1000
      world.container.addChild(interaction.overlayContainer)
      interactionRef.current = interaction

      // Sync buildings immediately (in case useEffect ran before refs were ready)
      buildingRendererRef.current.syncBuildings(buildingsRef.current)
      interactionRef.current.setBuildings(buildingsRef.current)

      // Wire up world pointer events to interaction
      world.onPointerDownOnWorld = (wx, wy, e) => interaction.onPointerDown(wx, wy, e)
      world.onPointerMoveOnWorld = (wx, wy, e) => interaction.onPointerMove(wx, wy, e)
      world.onPointerUpOnWorld = (wx, wy, e) => interaction.onPointerUp(wx, wy, e)

      // Center camera
      world.centerCamera()

      setLoading(false)
    } catch (err) {
      console.error('[GameState] Failed to initialize:', err)
      setLoading(false)
    }
  }, [])

  // Sync buildings from React state to PixiJS
  useEffect(() => {
    if (!buildingRendererRef.current || !interactionRef.current) return
    buildingRendererRef.current.syncBuildings(buildings)
    interactionRef.current.setBuildings(buildings)
  }, [buildings])

  // Sync selected coords
  useEffect(() => {
    if (!interactionRef.current) return
    if (selectedCoords) {
      interactionRef.current.setSelection(selectedCoords.x, selectedCoords.y)
    } else {
      interactionRef.current.clearSelection()
    }
  }, [selectedCoords])

  // Camera controls
  const resetCamera = useCallback(() => {
    worldRef.current?.centerCamera()
  }, [])

  const zoomIn = useCallback(() => {
    if (worldRef.current) {
      worldRef.current.setZoom(worldRef.current.zoom * 1.2)
    }
  }, [])

  const zoomOut = useCallback(() => {
    if (worldRef.current) {
      worldRef.current.setZoom(worldRef.current.zoom / 1.2)
    }
  }, [])

  /** Convert screen pixel coords to 1-based grid coords, or null if out of bounds */
  const screenToGrid = useCallback((screenX: number, screenY: number): { x: number; y: number } | null => {
    if (!worldRef.current) return null
    const world = worldRef.current.screenToWorld(screenX, screenY)
    const iso = screenToIso(world.x, world.y)
    const col = Math.floor(iso.col)
    const row = Math.floor(iso.row)
    if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) return null
    return { x: col + 1, y: row + 1 } // 1-based
  }, [])

  /** Show hover highlight at the tile under the given screen coords (for external drag) */
  const showDragHover = useCallback((screenX: number, screenY: number) => {
    if (!worldRef.current || !interactionRef.current) return
    const world = worldRef.current.screenToWorld(screenX, screenY)
    const iso = screenToIso(world.x, world.y)
    const col = Math.floor(iso.col)
    const row = Math.floor(iso.row)
    if (col >= 0 && col < GRID_SIZE && row >= 0 && row < GRID_SIZE) {
      interactionRef.current.showExternalHover(col, row)
    }
  }, [])

  /** Clear externally-driven hover highlight */
  const clearDragHover = useCallback(() => {
    interactionRef.current?.clearExternalHover()
  }, [])

  // Cleanup
  useEffect(() => {
    return () => {
      worldRef.current?.destroy()
      gridRef.current?.destroy()
      buildingRendererRef.current?.destroy()
      interactionRef.current?.destroy()

    }
  }, [])

  return {
    initWorld,
    loading,
    hoveredTile,
    resetCamera,
    zoomIn,
    zoomOut,
    screenToGrid,
    showDragHover,
    clearDragHover,
  }
}
