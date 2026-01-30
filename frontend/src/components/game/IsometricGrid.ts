/**
 * IsometricGrid - Renders the 13x13 tile grid using individual tile images
 * Tiles are sorted by depth (col + row) for proper isometric layering.
 */

import { Container, Sprite, Graphics, Texture, Assets } from 'pixi.js'
import { isoToScreen, TILE_WIDTH, TILE_HEIGHT, getTileDiamond } from '@/lib/isometric'
import { GRID_SIZE } from '@/lib/constants'
import { getMapLayout, isRoadTile, TileType } from '@/lib/mapLayout'

// Map tile types to asset file paths
const TILE_ASSET_MAP: Record<string, string> = {
  'grass': '/assets/Grass.png',
  'road-h': '/assets/Road straight A.png',
  'road-v': '/assets/Road straight B.png',
  'road-cross': '/assets/Road cross E.png',
  'road-t-up': '/assets/Road cross D.png',
  'road-t-down': '/assets/Road cross D.png',
  'road-t-left': '/assets/Road cross D.png',
  'road-t-right': '/assets/Road cross D.png',
  'road-curve-1': '/assets/Road turn A.png',
  'road-curve-2': '/assets/Road turn B.png',
  'road-curve-3': '/assets/Road turn C.png',
  'road-curve-4': '/assets/Road turn D.png',
}

// Cache loaded textures
const textureCache: Map<string, Texture> = new Map()

export class IsometricGrid {
  public container: Container
  private tiles: Map<string, Sprite> = new Map()
  private gridSize: number
  private assetsLoaded: boolean = false

  constructor(gridSize: number = GRID_SIZE) {
    this.gridSize = gridSize
    this.container = new Container()
    this.container.sortableChildren = true
  }

  /** Load all tile assets */
  async loadAssets(): Promise<void> {
    const uniquePaths = [...new Set(Object.values(TILE_ASSET_MAP))]
    
    for (const path of uniquePaths) {
      try {
        const texture = await Assets.load(path)
        textureCache.set(path, texture)
      } catch (error) {
        console.warn(`Failed to load asset: ${path}`, error)
      }
    }
    
    this.assetsLoaded = true
  }

  /** Build or rebuild the grid tiles */
  async build() {
    // Load assets first if not loaded
    if (!this.assetsLoaded) {
      await this.loadAssets()
    }

    this.container.removeChildren()
    this.tiles.clear()

    const layout = getMapLayout()

    for (let row = 0; row < this.gridSize; row++) {
      for (let col = 0; col < this.gridSize; col++) {
        const { x, y } = isoToScreen(col, row)
        const tileType = layout[row][col]
        const assetPath = TILE_ASSET_MAP[tileType] || TILE_ASSET_MAP['grass']
        const texture = textureCache.get(assetPath)

        if (texture) {
          const sprite = new Sprite(texture)

          // Scale sprite to match tile width
          // The sprite will maintain aspect ratio based on original image
          const targetWidth = TILE_WIDTH
          const scale = targetWidth / texture.width
          sprite.scale.set(scale, scale)

          // Anchor at bottom-center for proper isometric placement
          sprite.anchor.set(0.5, 1)
          
          // Position at the bottom of the tile diamond
          sprite.x = x
          sprite.y = y + TILE_HEIGHT

          // Depth sort: higher row+col values render on top
          sprite.zIndex = row + col

          this.container.addChild(sprite)
          this.tiles.set(`${col},${row}`, sprite)
        } else {
          // Fallback: draw a diamond shape
          const diamond = new Graphics()
          const points = getTileDiamond(col, row)
          diamond.poly(points.flat())
          diamond.fill({ color: isRoadTile(tileType) ? 0x4a4a4a : 0x4a5d23, alpha: 0.6 })
          diamond.stroke({ color: isRoadTile(tileType) ? 0x666666 : 0x6b7e3a, width: 1, alpha: 0.4 })
          diamond.zIndex = row + col
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
