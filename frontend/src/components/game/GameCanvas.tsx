'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import * as PIXI from 'pixi.js'
import { useGameStore } from '@/store/gameStore'
import { Building, BUILDING_INFO, BuildingType, GRID_SIZE, TILE_SIZE } from '@/types'
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

export function GameCanvas() {
  const canvasRef = useRef<HTMLDivElement>(null)
  const appRef = useRef<PIXI.Application | null>(null)
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
    cameraPosition,
    setCameraPosition,
    zoom,
    setZoom,
  } = useGameStore()

  const [buildModalOpen, setBuildModalOpen] = useState(false)
  const [pendingPosition, setPendingPosition] = useState<{ x: number; y: number } | null>(null)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [infoModalOpen, setInfoModalOpen] = useState(false)

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
        mainContainer.x = app.screen.width / 2
        mainContainer.y = app.screen.height / 3
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
        sprite.y = iso.y - 20 // Offset to sit on tile
        sprite.zIndex = building.position.x + building.position.y
        sprite.eventMode = 'static'
        sprite.cursor = 'pointer'
        sprite.on('pointerdown', () => {
          setSelectedBuilding(building)
          setInfoModalOpen(true)
        })
        container.addChild(sprite)
      }
    })
  }, [buildings])

  // Create building sprite
  const createBuildingSprite = (building: Building) => {
    const info = BUILDING_INFO[building.type]
    const container = new PIXI.Container()

    // Convert hex color string to number
    const roofColor = parseInt(info.colors.roof.replace('#', ''), 16)
    const wallColor = parseInt(info.colors.wall.replace('#', ''), 16)

    // Building base
    const base = new PIXI.Graphics()
    base.roundRect(-25, -40, 50, 50, 5)
    base.fill({ color: wallColor })
    base.stroke({ color: roofColor, width: 2, alpha: 0.8 })

    // Building name text
    const text = new PIXI.Text({
      text: info.name.charAt(0),
      style: {
        fontSize: 24,
        fill: roofColor,
        fontWeight: 'bold',
      },
    })
    text.anchor.set(0.5)
    text.y = -15

    container.addChild(base)
    container.addChild(text)

    return container
  }

  // Handle mouse move for hover effect
  useEffect(() => {
    if (!appRef.current || !hoverTileRef.current || !gridContainerRef.current) return

    const app = appRef.current
    const hoverTile = hoverTileRef.current
    const gridContainer = gridContainerRef.current

    const handleMouseMove = (e: PIXI.FederatedPointerEvent) => {
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

    const handleClick = (e: PIXI.FederatedPointerEvent) => {
      if (!isPlacingBuilding || !selectedBuildingType) return

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

    app.stage.eventMode = 'static'
    app.stage.on('pointermove', handleMouseMove)
    app.stage.on('pointerdown', handleClick)

    return () => {
      app.stage.off('pointermove', handleMouseMove)
      app.stage.off('pointerdown', handleClick)
    }
  }, [isPlacingBuilding, selectedBuildingType, isPositionOccupied])

  // Handle zoom
  useEffect(() => {
    if (!gridContainerRef.current || !buildingsContainerRef.current) return

    const parent = gridContainerRef.current.parent
    if (parent) {
      parent.scale.set(zoom)
    }
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

  const handleCloseBuildModal = () => {
    setBuildModalOpen(false)
    setPendingPosition(null)
  }

  return (
    <>
      <div
        ref={canvasRef}
        className="fixed inset-0 pt-14 pb-20"
        style={{ touchAction: 'none' }}
      />

      <BuildingModal
        open={buildModalOpen}
        onClose={handleCloseBuildModal}
        buildingType={selectedBuildingType}
        onConfirm={handleConfirmBuild}
        // Pass the pending grid position to BuildingModal (and Bank/Town Hall)
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
    </>
  )
}
