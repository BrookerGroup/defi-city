'use client'

import { useEffect, useRef, useState } from 'react'
import * as PIXI from 'pixi.js'
import { useGameStore } from '@/store/gameStore'
import { Building, BuildingAsset, BuildingType, BUILDING_INFO, GRID_SIZE, TILE_SIZE } from '@/types'
import { BuildingModal } from './BuildingModal'
import { BuildingInfo } from './BuildingInfo'
import { toast } from 'sonner'

// Isometric conversion
const cartToIso = (x: number, y: number) => ({
  x: (x - y) * (TILE_SIZE / 2),
  y: (x + y) * (TILE_SIZE / 4),
})

const isoToCart = (isoX: number, isoY: number) => ({
  x: Math.floor((isoX / (TILE_SIZE / 2) + isoY / (TILE_SIZE / 4)) / 2),
  y: Math.floor((isoY / (TILE_SIZE / 4) - isoX / (TILE_SIZE / 2)) / 2),
})

// Draw single tile
const drawTile = (
  graphics: PIXI.Graphics,
  x: number,
  y: number,
  color: number,
  alpha: number = 1
) => {
  const halfWidth = TILE_SIZE / 2
  const halfHeight = TILE_SIZE / 4

  graphics
    .poly([
      { x: x, y: y - halfHeight },
      { x: x + halfWidth, y: y },
      { x: x, y: y + halfHeight },
      { x: x - halfWidth, y: y },
    ])
    .fill({ color, alpha })
    .stroke({ color: 0x3a3a5e, width: 1, alpha: 0.5 })
}

// Draw grid
const drawGrid = (container: PIXI.Container) => {
  const graphics = new PIXI.Graphics()

  for (let x = 0; x < GRID_SIZE; x++) {
    for (let y = 0; y < GRID_SIZE; y++) {
      const iso = cartToIso(x, y)
      drawTile(graphics, iso.x, iso.y, 0x2a2a4e, 0.5)
    }
  }

  container.addChild(graphics)
}

// Create building sprite
const createBuildingSprite = (building: Building) => {
  const info = BUILDING_INFO[building.type]
  const container = new PIXI.Container()

  // Building base
  const base = new PIXI.Graphics()
  base.roundRect(-30, -50, 60, 60, 8)
  base.fill({ color: info.color })
  base.stroke({ color: 0xffffff, width: 2, alpha: 0.3 })

  // Icon text
  const text = new PIXI.Text({
    text: info.icon,
    style: {
      fontSize: 32,
    },
  })
  text.anchor.set(0.5)
  text.y = -20

  // Building name label
  const nameText = new PIXI.Text({
    text: info.name,
    style: {
      fontSize: 10,
      fill: 0xffffff,
    },
  })
  nameText.anchor.set(0.5)
  nameText.y = 18

  container.addChild(base)
  container.addChild(text)
  container.addChild(nameText)

  return container
}

export function GameCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
  const mainContainerRef = useRef<PIXI.Container | null>(null)
  const gridContainerRef = useRef<PIXI.Container | null>(null)
  const buildingsContainerRef = useRef<PIXI.Container | null>(null)
  const hoverTileRef = useRef<PIXI.Graphics | null>(null)

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

  const [buildModalOpen, setBuildModalOpen] = useState(false)
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [infoModalOpen, setInfoModalOpen] = useState(false)

  // Panning state
  const [isPanning, setIsPanning] = useState(false)
  const panStartRef = useRef<{ x: number; y: number } | null>(null)
  const panOffsetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 })

  // Initialize PixiJS
  useEffect(() => {
    if (!canvasRef.current || appRef.current) return

    const init = async () => {
      const app = new PIXI.Application()
      await app.init({
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x1a1a2e,
        antialias: true,
        resolution: window.devicePixelRatio || 1,
        autoDensity: true,
      })

      canvasRef.current?.appendChild(app.canvas)
      appRef.current = app

      // Enable pointer events on canvas element only (parent has pointer-events: none)
      if (app.canvas instanceof HTMLCanvasElement) {
        app.canvas.style.pointerEvents = 'auto'
        app.canvas.style.touchAction = 'none'
      }

      // Create containers
      const mainContainer = new PIXI.Container()
      mainContainer.x = app.screen.width / 2
      mainContainer.y = app.screen.height / 3

      const gridContainer = new PIXI.Container()
      const buildingsContainer = new PIXI.Container()
      buildingsContainer.sortableChildren = true

      mainContainer.addChild(gridContainer)
      mainContainer.addChild(buildingsContainer)
      app.stage.addChild(mainContainer)

      mainContainerRef.current = mainContainer
      gridContainerRef.current = gridContainer
      buildingsContainerRef.current = buildingsContainer

      // Draw isometric grid
      drawGrid(gridContainer)

      // Create hover tile
      const hoverTile = new PIXI.Graphics()
      hoverTile.visible = false
      gridContainer.addChild(hoverTile)
      hoverTileRef.current = hoverTile

      // Handle resize
      const handleResize = () => {
        app.renderer.resize(window.innerWidth, window.innerHeight)
        mainContainer.x = app.screen.width / 2 + panOffsetRef.current.x
        mainContainer.y = app.screen.height / 3 + panOffsetRef.current.y
      }

      window.addEventListener('resize', handleResize)

      return () => {
        window.removeEventListener('resize', handleResize)
      }
    }

    init()

    return () => {
      if (appRef.current) {
        appRef.current.destroy(true, { children: true })
        appRef.current = null
      }
    }
  }, [])

  // Update buildings display
  useEffect(() => {
    if (!buildingsContainerRef.current) return

    const container = buildingsContainerRef.current
    container.removeChildren()

    buildings.forEach((building) => {
      const sprite = createBuildingSprite(building)
      if (sprite) {
        const iso = cartToIso(building.position.x, building.position.y)
        sprite.x = iso.x
        sprite.y = iso.y - 25 // Offset to sit on tile
        sprite.zIndex = building.position.x + building.position.y
        sprite.eventMode = 'static'
        sprite.cursor = 'pointer'
        sprite.on('pointerdown', (e: PIXI.FederatedPointerEvent) => {
          // Don't open info if we're placing a building
          if (isPlacingBuilding) return
          e.stopPropagation()
          setSelectedBuilding(building)
          setInfoModalOpen(true)
        })
        container.addChild(sprite)
      }
    })
  }, [buildings, isPlacingBuilding])

  // Handle mouse move for hover effect and panning
  useEffect(() => {
    if (!appRef.current || !hoverTileRef.current || !gridContainerRef.current || !mainContainerRef.current) return

    const app = appRef.current
    const hoverTile = hoverTileRef.current
    const gridContainer = gridContainerRef.current
    const mainContainer = mainContainerRef.current

    const handleMouseMove = (e: PIXI.FederatedPointerEvent) => {
      // Handle panning
      if (isPanning && panStartRef.current) {
        const dx = e.global.x - panStartRef.current.x
        const dy = e.global.y - panStartRef.current.y

        mainContainer.x = app.screen.width / 2 + panOffsetRef.current.x + dx
        mainContainer.y = app.screen.height / 3 + panOffsetRef.current.y + dy
        return
      }

      if (!isPlacingBuilding) {
        hoverTile.visible = false
        return
      }

      const localPos = gridContainer.toLocal(e.global)
      const cart = isoToCart(localPos.x, localPos.y)

      if (cart.x >= 0 && cart.x < GRID_SIZE && cart.y >= 0 && cart.y < GRID_SIZE) {
        const iso = cartToIso(cart.x, cart.y)
        hoverTile.clear()

        const isOccupied = isPositionOccupied(cart.x, cart.y)
        const color = isOccupied ? 0xff0000 : 0x00ff00

        const halfWidth = TILE_SIZE / 2
        const halfHeight = TILE_SIZE / 4

        hoverTile
          .poly([
            { x: iso.x, y: iso.y - halfHeight },
            { x: iso.x + halfWidth, y: iso.y },
            { x: iso.x, y: iso.y + halfHeight },
            { x: iso.x - halfWidth, y: iso.y },
          ])
          .fill({ color, alpha: 0.4 })
          .stroke({ color, width: 2, alpha: 0.8 })

        hoverTile.visible = true
      } else {
        hoverTile.visible = false
      }
    }

    const handlePointerDown = (e: PIXI.FederatedPointerEvent) => {
      // Middle mouse button for panning
      if (e.button === 1) {
        setIsPanning(true)
        panStartRef.current = { x: e.global.x, y: e.global.y }
        return
      }

      // Right click also for panning
      if (e.button === 2) {
        setIsPanning(true)
        panStartRef.current = { x: e.global.x, y: e.global.y }
        return
      }

      // Left click
      if (!isPlacingBuilding) return

      const localPos = gridContainer.toLocal(e.global)
      const cart = isoToCart(localPos.x, localPos.y)

      if (cart.x >= 0 && cart.x < GRID_SIZE && cart.y >= 0 && cart.y < GRID_SIZE) {
        if (isPositionOccupied(cart.x, cart.y)) {
          toast.error('Position already occupied!')
          return
        }

        setPendingPosition({ x: cart.x, y: cart.y })
        setBuildModalOpen(true)
      }
    }

    const handlePointerUp = (e: PIXI.FederatedPointerEvent) => {
      if (isPanning && panStartRef.current) {
        // Save the new offset
        const dx = e.global.x - panStartRef.current.x
        const dy = e.global.y - panStartRef.current.y
        panOffsetRef.current = {
          x: panOffsetRef.current.x + dx,
          y: panOffsetRef.current.y + dy,
        }
      }
      setIsPanning(false)
      panStartRef.current = null
    }

    app.stage.eventMode = 'static'
    app.stage.on('pointermove', handleMouseMove)
    app.stage.on('pointerdown', handlePointerDown)
    app.stage.on('pointerup', handlePointerUp)
    app.stage.on('pointerupoutside', handlePointerUp)

    // Disable context menu
    const canvas = canvasRef.current
    const handleContextMenu = (e: Event) => e.preventDefault()
    canvas?.addEventListener('contextmenu', handleContextMenu)

    return () => {
      if (app.stage) {
        app.stage.off('pointermove', handleMouseMove)
        app.stage.off('pointerdown', handlePointerDown)
        app.stage.off('pointerup', handlePointerUp)
        app.stage.off('pointerupoutside', handlePointerUp)
      }
      canvas?.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [isPlacingBuilding, selectedBuildingType, isPositionOccupied, isPanning])

  // Handle zoom
  useEffect(() => {
    if (!mainContainerRef.current) return
    mainContainerRef.current.scale.set(zoom)
  }, [zoom])

  // Handle wheel zoom
  useEffect(() => {
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault()
      const delta = e.deltaY > 0 ? -0.1 : 0.1
      setZoom(zoom + delta)
    }

    window.addEventListener('wheel', handleWheel, { passive: false })
    return () => window.removeEventListener('wheel', handleWheel)
  }, [zoom, setZoom])

  // Confirm building placement
  const handleConfirmBuild = (buildingType: BuildingType, asset: BuildingAsset, amount: string) => {
    if (!pendingPosition) return

    const newBuilding: Building = {
      id: `building-${Date.now()}`,
      type: buildingType,
      position: pendingPosition,
      asset,
      deposited: amount,
      createdAt: Date.now(),
    }

    const buildingInfo = BUILDING_INFO[buildingType]
    addBuilding(newBuilding)
    toast.success(`${buildingInfo.name} placed!`, {
      description: `Deposited ${amount} ${asset}`,
    })
    setPendingPosition(null)
    selectBuildingType(null)
  }

  const handleCloseBuildModal = () => {
    setBuildModalOpen(false)
    setPendingPosition(null)
    selectBuildingType(null)
  }

  return (
    <>
      <div
        ref={canvasRef}
        className="fixed inset-0 pt-14 pb-20 z-0"
        style={{
          cursor: isPanning ? 'grabbing' : isPlacingBuilding ? 'crosshair' : 'default',
          pointerEvents: 'none'
        }}
      />

      <BuildingModal
        open={buildModalOpen}
        onClose={handleCloseBuildModal}
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
    </>
  )
}
