'use client'

/**
 * useGameState - React <-> PixiJS bridge hook
 * Initializes PixiJS world when app is ready, syncs buildings and interactions.
 */

import { useRef, useCallback, useEffect, useState } from 'react'
import { Application } from 'pixi.js'
import { loadAllTextures } from '@/lib/spritesheet'
import { GameWorld } from './GameWorld'
import { IsometricGrid } from './IsometricGrid'
import { BuildingRenderer } from './BuildingRenderer'
import { TileInteraction } from './TileInteraction'
import { Decorations } from './Decorations'
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
  const decorationsRef = useRef<Decorations | null>(null)
  const [loading, setLoading] = useState(true)
  const [hoveredTile, setHoveredTile] = useState<{ col: number; row: number } | null>(null)

  // Store callbacks in refs so they don't cause re-init
  const onSelectTileRef = useRef(onSelectTile)
  onSelectTileRef.current = onSelectTile
  const onMoveBuildingRef = useRef(onMoveBuilding)
  onMoveBuildingRef.current = onMoveBuilding

  /** Initialize PixiJS world when Application is ready */
  const initWorld = useCallback(async (app: Application) => {
    setLoading(true)

    try {
      // Determine base path for assets
      const isProd = typeof window !== 'undefined' && window.location.pathname.startsWith('/defi-city')
      const basePath = isProd ? '/defi-city/' : '/'

      // Load all sprite textures
      await loadAllTextures(basePath)

      // Create world (camera system)
      const world = new GameWorld(app)
      worldRef.current = world

      // Create decorations (water border)
      const decorations = new Decorations()
      decorations.build()
      world.container.addChild(decorations.container)
      decorationsRef.current = decorations

      // Create isometric grid
      const grid = new IsometricGrid()
      grid.build()
      world.container.addChild(grid.container)
      gridRef.current = grid

      // Create building renderer
      const buildingRenderer = new BuildingRenderer()
      world.container.addChild(buildingRenderer.container)
      buildingRendererRef.current = buildingRenderer

      // Create tile interaction
      const interaction = new TileInteraction(buildingRenderer, {
        onSelectTile: (x, y) => onSelectTileRef.current(x, y),
        onMoveBuilding: (building, x, y) => onMoveBuildingRef.current(building, x, y),
        onHoverTile: (col, row) => setHoveredTile({ col, row }),
        onClearHover: () => setHoveredTile(null),
      })
      world.container.addChild(interaction.overlayContainer)
      interactionRef.current = interaction

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

  // Cleanup
  useEffect(() => {
    return () => {
      worldRef.current?.destroy()
      gridRef.current?.destroy()
      buildingRendererRef.current?.destroy()
      interactionRef.current?.destroy()
      decorationsRef.current?.destroy()
    }
  }, [])

  return {
    initWorld,
    loading,
    hoveredTile,
    resetCamera,
    zoomIn,
    zoomOut,
  }
}
