/**
 * Decorations - Environment details for the isometric grid
 * Adds water border tiles at grid edges for visual polish.
 */

import { Container, Sprite } from 'pixi.js'
import { isoToScreen, TILE_WIDTH, TILE_HEIGHT } from '@/lib/isometric'
import { getTexture } from '@/lib/spritesheet'
import { GRID_SIZE } from '@/lib/constants'

export class Decorations {
  public container: Container
  private gridSize: number

  constructor(gridSize: number = GRID_SIZE) {
    this.gridSize = gridSize
    this.container = new Container()
    this.container.sortableChildren = true
  }

  /** Build water border around the grid */
  build() {
    this.container.removeChildren()
    this.addWaterBorder()
  }

  private addWaterBorder() {
    // Add water tiles around the grid perimeter (one tile outside)
    const waterKey = 'water-4' // Pure water tile

    for (let i = -1; i <= this.gridSize; i++) {
      // Top edge
      this.placeWaterTile(i, -1, waterKey)
      // Bottom edge
      this.placeWaterTile(i, this.gridSize, waterKey)
      // Left edge
      this.placeWaterTile(-1, i, waterKey)
      // Right edge
      this.placeWaterTile(this.gridSize, i, waterKey)
    }

    // Corner tiles
    this.placeWaterTile(-1, -1, waterKey)
    this.placeWaterTile(this.gridSize, -1, waterKey)
    this.placeWaterTile(-1, this.gridSize, waterKey)
    this.placeWaterTile(this.gridSize, this.gridSize, waterKey)
  }

  private placeWaterTile(col: number, row: number, key: string) {
    const texture = getTexture(key)
    if (!texture) return

    const { x, y } = isoToScreen(col, row)
    const sprite = new Sprite(texture)
    sprite.width = TILE_WIDTH
    sprite.height = TILE_HEIGHT
    sprite.anchor.set(0.5, 0)
    sprite.x = x
    sprite.y = y
    sprite.zIndex = -1 // Behind grid tiles
    sprite.alpha = 0.7

    this.container.addChild(sprite)
  }

  destroy() {
    this.container.removeChildren()
  }
}
