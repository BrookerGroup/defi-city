/**
 * IsometricGrid - Renders the grid as transparent diamond-shaped blocks
 * using PixiJS Graphics (no tile images).
 */

import { Container, Graphics } from 'pixi.js'
import { getTileDiamond } from '@/lib/isometric'
import { GRID_SIZE } from '@/lib/constants'

export class IsometricGrid {
  public container: Container
  private gridSize: number

  constructor(gridSize: number = GRID_SIZE) {
    this.gridSize = gridSize
    this.container = new Container()
    this.container.sortableChildren = true
  }

  /** Build the grid — draws a transparent diamond per tile */
  build() {
    this.container.removeChildren()

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const diamond = new Graphics()
        const points = getTileDiamond(col, row)
        diamond.poly(points.flat())
        diamond.fill({ color: 0xffffff, alpha: 0.05 })
        diamond.stroke({ color: 0xffffff, width: 1, alpha: 0.15 })
        diamond.zIndex = row + col
        this.container.addChild(diamond)
      }
    }
  }

  destroy() {
    this.container.removeChildren()
  }
}
