/**
 * IsometricGrid - Renders the 13x13 tile grid using grass sprites
 * Tiles are sorted by depth (col + row) for proper isometric layering.
 */

import { Container, Sprite, Texture, Graphics } from 'pixi.js'
import { isoToScreen, TILE_WIDTH, TILE_HEIGHT, getTileDiamond } from '@/lib/isometric'
import { getTexture, getGrassKeys } from '@/lib/spritesheet'
import { GRID_SIZE } from '@/lib/constants'

export class IsometricGrid {
  public container: Container
  private tiles: Map<string, Sprite> = new Map()
  private gridSize: number

  constructor(gridSize: number = GRID_SIZE) {
    this.gridSize = gridSize
    this.container = new Container()
    this.container.sortableChildren = true
  }

  /** Build or rebuild the grid tiles */
  build() {
    this.container.removeChildren()
    this.tiles.clear()

    const grassKeys = getGrassKeys()

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const { x, y } = isoToScreen(col, row)

        // Pick a grass variant (seeded random for consistency)
        const grassKey = grassKeys[(col * 7 + row * 13) % grassKeys.length]
        const texture = getTexture(grassKey)

        if (texture) {
          const sprite = new Sprite(texture)

          // Scale to fit tile diamond
          // The grass tiles are 200x133 and we need them to fit 128x64 diamond
          sprite.width = TILE_WIDTH
          sprite.height = TILE_HEIGHT

          // Position: anchor at center-top of diamond
          sprite.anchor.set(0.5, 0)
          sprite.x = x
          sprite.y = y

          // Depth sort: higher col+row = further back = rendered later
          sprite.zIndex = col + row

          this.container.addChild(sprite)
          this.tiles.set(`${col},${row}`, sprite)
        } else {
          // Fallback: draw a diamond shape
          const diamond = new Graphics()
          const points = getTileDiamond(col, row)
          diamond.poly(points.flat())
          diamond.fill({ color: 0x4a5d23, alpha: 0.6 })
          diamond.stroke({ color: 0x6b7e3a, width: 1, alpha: 0.4 })
          diamond.zIndex = col + row
          this.container.addChild(diamond)
        }
      }
    }
  }

  /** Get tile sprite at grid position */
  getTile(col: number, row: number): Sprite | undefined {
    return this.tiles.get(`${col},${row}`)
  }

  destroy() {
    this.container.removeChildren()
    this.tiles.clear()
  }
}
