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
    // Add water tiles around the grid perimeter (multiple layers for complete border)
    const waterKey = 'water-4' // Pure water tile

    // Create a thicker, more complete border by adding multiple rows
    // Outer layer
    for (let i = -2; i <= this.gridSize + 1; i++) {
      // Top edge (row -2)
      this.placeWaterTile(i, -2, waterKey)
      // Bottom edge
      this.placeWaterTile(i, this.gridSize + 1, waterKey)
      // Left edge
      this.placeWaterTile(-2, i, waterKey)
      // Right edge
      this.placeWaterTile(this.gridSize + 1, i, waterKey)
    }
    
    // Inner layer (row -1)
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
  }

  private placeWaterTile(col: number, row: number, key: string) {
    const texture = getTexture(key)
    if (!texture) return

    const { x, y } = isoToScreen(col, row)
    const sprite = new Sprite(texture)
    
    // Scale sprite to match tile width (same as IsometricGrid.ts)
    const targetWidth = TILE_WIDTH
    const scale = targetWidth / texture.width
    sprite.scale.set(scale, scale)
    
    // Anchor at bottom-center for proper isometric placement
    sprite.anchor.set(0.5, 1)
    
    // Position at the bottom of the tile diamond
    sprite.x = x
    sprite.y = y + TILE_HEIGHT
    
    sprite.zIndex = -1 // Behind grid tiles
    sprite.alpha = 0.8

    this.container.addChild(sprite)
  }

  destroy() {
    this.container.removeChildren()
  }
}
