/**
 * TileInteraction - Handles hover, click, and drag-to-move interactions
 * on the isometric grid tiles.
 *
 * Coordinate convention:
 *   PixiJS uses 0-based (col, row)
 *   Contract uses 1-based (x, y) where x = col+1, y = row+1
 */

import { Container, Graphics, Sprite } from 'pixi.js'
import { screenToIso, getTileDiamond, isoToScreen, TILE_WIDTH, TILE_HEIGHT } from '@/lib/isometric'
import { GRID_SIZE } from '@/lib/constants'
import { getMapLayout, isBuildableTile } from '@/lib/mapLayout'
import type { Building } from '@/hooks/useCityBuildings'
import type { BuildingRenderer, BuildingSprite } from './BuildingRenderer'

const DRAG_THRESHOLD = 8

interface TileInteractionCallbacks {
  onSelectTile?: (x: number, y: number) => void         // 1-based
  onMoveBuilding?: (building: Building, newX: number, newY: number) => void // 1-based
  onHoverTile?: (col: number, row: number) => void       // 0-based
  onClearHover?: () => void
}

export class TileInteraction {
  public overlayContainer: Container
  private hoverGraphics: Graphics
  private selectGraphics: Graphics
  private dragGhost: Sprite | null = null
  private dragGhostContainer: Container

  // State
  private selectedTile: { col: number; row: number } | null = null
  private hoveredTile: { col: number; row: number } | null = null
  private dragBuilding: BuildingSprite | null = null
  private isDragActive = false
  private pointerDownPos: { x: number; y: number } | null = null
  private pointerDownWorldPos: { x: number; y: number } | null = null
  private hasDragged = false

  private gridSize: number
  private buildingRenderer: BuildingRenderer
  private callbacks: TileInteractionCallbacks
  private buildings: Building[] = []

  constructor(
    buildingRenderer: BuildingRenderer,
    callbacks: TileInteractionCallbacks,
    gridSize: number = GRID_SIZE,
  ) {
    this.buildingRenderer = buildingRenderer
    this.callbacks = callbacks
    this.gridSize = gridSize

    this.overlayContainer = new Container()
    this.overlayContainer.sortableChildren = true

    this.hoverGraphics = new Graphics()
    this.hoverGraphics.zIndex = 9999
    this.overlayContainer.addChild(this.hoverGraphics)

    this.selectGraphics = new Graphics()
    this.selectGraphics.zIndex = 9998
    this.overlayContainer.addChild(this.selectGraphics)

    this.dragGhostContainer = new Container()
    this.dragGhostContainer.zIndex = 10000
    this.dragGhostContainer.alpha = 0.5
    this.dragGhostContainer.visible = false
    this.overlayContainer.addChild(this.dragGhostContainer)
  }

  /** Update the building list for hit testing */
  setBuildings(buildings: Building[]) {
    this.buildings = buildings
  }

  /** Convert world position to 0-based grid tile */
  private worldToTile(worldX: number, worldY: number): { col: number; row: number } | null {
    const iso = screenToIso(worldX, worldY)
    const col = Math.floor(iso.col)
    const row = Math.floor(iso.row)

    if (col < 0 || col >= this.gridSize || row < 0 || row >= this.gridSize) {
      return null
    }
    return { col, row }
  }

  /** Check if 0-based (col, row) has a building */
  private getBuildingAtTile(col: number, row: number): Building | undefined {
    // Convert to 1-based for building lookup
    return this.buildings.find(b => b.x === col + 1 && b.y === row + 1)
  }

  /** Check if a 0-based tile is a valid drop target */
  private isValidDrop(col: number, row: number): boolean {
    if (!this.dragBuilding) return false
    const building = this.dragBuilding.building

    // Can't drop on same position
    if (col + 1 === building.x && row + 1 === building.y) return false

    // Can't drop on Town Hall
    const center = Math.ceil(this.gridSize / 2)
    if (col + 1 === center && row + 1 === center) return false

    // Can't drop on occupied tiles
    if (this.getBuildingAtTile(col, row)) return false

    // Must be within grid bounds
    if (col < 0 || col >= this.gridSize || row < 0 || row >= this.gridSize) return false

    // Can't drop on road tiles - only on buildable (grass) tiles
    const layout = getMapLayout()
    const tileType = layout[row]?.[col]
    if (!tileType || !isBuildableTile(tileType)) return false

    return true
  }

  /** Handle pointer down from GameWorld */
  onPointerDown(worldX: number, worldY: number, e: PointerEvent) {
    this.pointerDownPos = { x: e.clientX, y: e.clientY }
    this.pointerDownWorldPos = { x: worldX, y: worldY }
    this.hasDragged = false

    // Check if pointer is on a building (for potential drag)
    const tile = this.worldToTile(worldX, worldY)
    if (tile) {
      const building = this.getBuildingAtTile(tile.col, tile.row)
      if (building && building.type !== 'townhall') {
        const bs = this.buildingRenderer.getBuildingById(building.id)
        if (bs) {
          this.dragBuilding = bs
          return // Wait for drag threshold
        }
      }
    }

    this.dragBuilding = null
  }

  /** Handle pointer move from GameWorld */
  onPointerMove(worldX: number, worldY: number, _e: PointerEvent) {
    const tile = this.worldToTile(worldX, worldY)

    // Check drag threshold
    if (this.dragBuilding && this.pointerDownPos && !this.isDragActive) {
      const dx = _e.clientX - this.pointerDownPos.x
      const dy = _e.clientY - this.pointerDownPos.y
      if (Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
        this.isDragActive = true
        this.hasDragged = true
        this.startDrag()
      }
    }

    // Update drag ghost position
    if (this.isDragActive && this.dragBuilding) {
      this.dragGhostContainer.x = worldX
      this.dragGhostContainer.y = worldY

      // Update drop target highlight
      this.updateDragHighlight(tile)
      return
    }

    // Hover highlight - only show on buildable tiles
    if (tile && (!this.hoveredTile || tile.col !== this.hoveredTile.col || tile.row !== this.hoveredTile.row)) {
      // Check if tile is buildable (not a road)
      const layout = getMapLayout()
      const tileType = layout[tile.row]?.[tile.col]
      
      if (tileType && isBuildableTile(tileType)) {
        this.hoveredTile = tile
        this.drawHoverHighlight(tile.col, tile.row)
        this.callbacks.onHoverTile?.(tile.col, tile.row)
      } else {
        // Clear hover on non-buildable tiles
        this.hoveredTile = null
        this.hoverGraphics.clear()
        this.callbacks.onClearHover?.()
      }
    } else if (!tile && this.hoveredTile) {
      this.hoveredTile = null
      this.hoverGraphics.clear()
      this.callbacks.onClearHover?.()
    }
  }

  /** Handle pointer up from GameWorld */
  onPointerUp(worldX: number, worldY: number, _e: PointerEvent) {
    // Complete building drop
    if (this.isDragActive && this.dragBuilding) {
      const tile = this.worldToTile(worldX, worldY)
      if (tile && this.isValidDrop(tile.col, tile.row)) {
        this.callbacks.onMoveBuilding?.(
          this.dragBuilding.building,
          tile.col + 1, // Convert to 1-based
          tile.row + 1,
        )
      }
      this.endDrag()
      return
    }

    // Click → select tile (only if no drag happened)
    if (!this.hasDragged && this.pointerDownWorldPos) {
      const tile = this.worldToTile(worldX, worldY)
      if (tile) {
        this.selectTile(tile.col, tile.row)
      }
    }

    this.dragBuilding = null
    this.pointerDownPos = null
    this.pointerDownWorldPos = null
  }

  /** Select a tile and show highlight */
  selectTile(col: number, row: number) {
    this.selectedTile = { col, row }
    this.drawSelectHighlight(col, row)
    this.callbacks.onSelectTile?.(col + 1, row + 1) // 1-based
  }

  /** Clear selection */
  clearSelection() {
    this.selectedTile = null
    this.selectGraphics.clear()
  }

  /** Set selection from 1-based coordinates */
  setSelection(x: number, y: number) {
    this.selectedTile = { col: x - 1, row: y - 1 }
    this.drawSelectHighlight(x - 1, y - 1)
  }

  private drawHoverHighlight(col: number, row: number) {
    this.hoverGraphics.clear()
    const points = getTileDiamond(col, row)
    this.hoverGraphics.poly(points.flat())
    this.hoverGraphics.fill({ color: 0x3b82f6, alpha: 0.3 })
    this.hoverGraphics.stroke({ color: 0x60a5fa, width: 2, alpha: 0.6 })
  }

  private drawSelectHighlight(col: number, row: number) {
    this.selectGraphics.clear()
    const points = getTileDiamond(col, row)
    this.selectGraphics.poly(points.flat())
    this.selectGraphics.fill({ color: 0x3b82f6, alpha: 0.4 })
    this.selectGraphics.stroke({ color: 0x93c5fd, width: 2, alpha: 0.8 })
  }

  private startDrag() {
    this.dragGhostContainer.visible = true
    // Add a simple indicator rectangle for the drag ghost
    const ghost = new Graphics()
    ghost.rect(-TILE_WIDTH / 4, -TILE_HEIGHT / 2, TILE_WIDTH / 2, TILE_HEIGHT)
    ghost.fill({ color: 0xfbbf24, alpha: 0.4 })
    ghost.stroke({ color: 0xfbbf24, width: 2 })
    this.dragGhostContainer.addChild(ghost)
  }

  private updateDragHighlight(tile: { col: number; row: number } | null) {
    this.hoverGraphics.clear()
    if (!tile) return

    const points = getTileDiamond(tile.col, tile.row)
    const isValid = this.isValidDrop(tile.col, tile.row)

    this.hoverGraphics.poly(points.flat())
    this.hoverGraphics.fill({
      color: isValid ? 0x22c55e : 0xef4444,
      alpha: 0.4,
    })
    this.hoverGraphics.stroke({
      color: isValid ? 0x4ade80 : 0xf87171,
      width: 2,
      alpha: 0.8,
    })
  }

  private endDrag() {
    this.isDragActive = false
    this.dragBuilding = null
    this.dragGhostContainer.visible = false
    this.dragGhostContainer.removeChildren()
    this.hoverGraphics.clear()
  }

  destroy() {
    this.overlayContainer.removeChildren()
  }
}
