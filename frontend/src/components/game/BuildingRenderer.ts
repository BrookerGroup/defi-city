/**
 * BuildingRenderer - Renders building sprites on the isometric grid
 * Simple flat colored tiles with color differentiation per asset.
 * Labels: asset name, APY text (Press Start 2P font)
 */

import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { isoToScreen, TILE_WIDTH, TILE_HEIGHT } from '@/lib/isometric'
import type { Building } from '@/hooks/useCityBuildings'

const labelStyle = new TextStyle({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: 8,
  fill: 0xffffff,
  align: 'center',
  dropShadow: {
    color: 0x000000,
    blur: 0,
    distance: 1,
    angle: Math.PI / 4,
  },
})

const apyStyle = new TextStyle({
  fontFamily: '"Press Start 2P", monospace',
  fontSize: 7,
  fill: 0x4ade80,
  align: 'center',
  dropShadow: {
    color: 0x000000,
    blur: 0,
    distance: 1,
    angle: Math.PI / 4,
  },
})

export interface BuildingSprite {
  container: Container
  building: Building
  sprite: Graphics // Changed from Sprite to Graphics
}

export class BuildingRenderer {
  public container: Container
  private buildingSprites: Map<number, BuildingSprite> = new Map()

  constructor() {
    this.container = new Container()
    this.container.sortableChildren = true
  }

  /**
   * Sync buildings: add new, update existing, remove old.
   * Uses 0-based grid coords (contract uses 1-based).
   */
  syncBuildings(buildings: Building[]) {
    const activeIds = new Set(buildings.map(b => b.id))

    // Remove buildings that no longer exist
    for (const [id, bs] of this.buildingSprites) {
      if (!activeIds.has(id)) {
        this.container.removeChild(bs.container)
        bs.container.destroy({ children: true })
        this.buildingSprites.delete(id)
      }
    }

    // Add or update buildings
    for (const building of buildings) {
      const existing = this.buildingSprites.get(building.id)

      if (existing) {
        // Update position if moved
        this.updateBuildingPosition(existing, building)
        existing.building = building
      } else {
        // Create new building sprite
        this.createBuildingSprite(building)
      }
    }
  }

  private createBuildingSprite(building: Building) {
    // Convert from 1-based (contract) to 0-based (PixiJS grid)
    const col = building.x - 1
    const row = building.y - 1

    const bContainer = new Container()

    // Position at isometric location
    const { x, y } = isoToScreen(col, row)
    bContainer.x = x
    bContainer.y = y

    // Depth sort: buildings need to be above tiles, and sorted by row
    bContainer.zIndex = (col + row) * 10 + 5

    // Get color based on building type
    let color: number
    const isLottery = building.type === 'lottery'
    if (building.type === 'townhall') {
      color = 0xfbbf24  // amber/gold
    } else if (isLottery) {
      color = 0xfbbf24  // amber for lottery
    } else if (building.type === 'lp') {
      color = 0x06b6d4  // cyan for LP
    } else if (building.isBorrow) {
      color = 0xef4444  // red
    } else {
      const assetColors: Record<string, number> = {
        USDC: 0x4a9eff,  // blue
        USDT: 0x26a17b,  // teal
        ETH:  0x818cf8,  // purple
        WBTC: 0xf7931a,  // orange
        LINK: 0x375bd2,  // dark blue
      }
      color = assetColors[building.asset] || 0x4a9eff
    }

    // Draw flat colored tile
    const tile = this.drawFlatTile(color, building.type === 'townhall')
    bContainer.addChild(tile)

    // Add labels
    if (isLottery) {
      // Lottery building label
      const label = new Text({
        text: 'MEGAPOT',
        style: { ...labelStyle, fill: 0xfbbf24, fontSize: 7 },
      })
      label.anchor.set(0.5, 1)
      label.x = 0
      label.y = -4
      bContainer.addChild(label)
    } else if (building.type === 'townhall') {
      const label = new Text({
        text: 'TOWN HALL',
        style: { ...labelStyle, fill: 0xfbbf24, fontSize: 7 },
      })
      label.anchor.set(0.5, 1)
      label.x = 0
      label.y = -4
      bContainer.addChild(label)
    } else if (building.type === 'lp') {
      const assetLabel = new Text({
        text: 'LP',
        style: { ...labelStyle, fill: 0x06b6d4 },
      })
      assetLabel.anchor.set(0.5, 1)
      assetLabel.x = 0
      assetLabel.y = -4
      bContainer.addChild(assetLabel)
    } else {
      // Bank/borrow
      const assetLabel = new Text({
        text: building.asset,
        style: labelStyle,
      })
      assetLabel.anchor.set(0.5, 1)
      assetLabel.x = 0
      assetLabel.y = -4
      bContainer.addChild(assetLabel)

      if (building.apy !== undefined) {
        const apyText = new Text({
          text: this.formatAPY(building.apy, building.isBorrow),
          style: {
            ...apyStyle,
            fill: building.isBorrow ? 0xfb923c : 0x4ade80,
          },
        })
        apyText.anchor.set(0.5, 1)
        apyText.x = 0
        apyText.y = -14
        bContainer.addChild(apyText)
      }
    }

    this.container.addChild(bContainer)
    this.buildingSprites.set(building.id, {
      container: bContainer,
      building,
      sprite: tile,
    })
  }

  /**
   * Draw a simple flat colored diamond (same shape as tile)
   */
  private drawFlatTile(color: number, isTownHall = false): Graphics {
    const g = new Graphics()
    
    const halfW = TILE_WIDTH / 2
    const halfH = TILE_HEIGHT / 2
    const centerY = TILE_HEIGHT / 2  // Center of tile
    
    // Draw diamond shape (same as tile)
    g.poly([
      0, centerY - halfH,      // top
      halfW, centerY,          // right
      0, centerY + halfH,      // bottom
      -halfW, centerY,         // left
    ])
    g.fill({ color: color })
    g.stroke({ color: 0x000000, width: 2, alpha: 0.5 })

    // Add a subtle inner glow/highlight
    if (!isTownHall) {
      g.poly([
        0, centerY - halfH + 4,
        halfW - 4, centerY,
        0, centerY + halfH - 4,
        -halfW + 4, centerY,
      ])
      g.stroke({ color: 0xffffff, width: 1, alpha: 0.3 })
    } else {
      // Town Hall: add a simple star/icon in center
      const starSize = 8
      g.star(0, centerY, 5, starSize, starSize / 2)
      g.fill({ color: 0xffffff, alpha: 0.6 })
    }

    return g
  }

  private updateBuildingPosition(bs: BuildingSprite, building: Building) {
    const col = building.x - 1
    const row = building.y - 1
    const { x, y } = isoToScreen(col, row)
    bs.container.x = x
    bs.container.y = y
    bs.container.zIndex = (col + row) * 10 + 5
  }

  private formatAPY(apy: number, isBorrow?: boolean): string {
    const prefix = isBorrow ? '-' : '+'
    if (apy === 0) return `${prefix}0%`
    if (apy < 0.01) return `${prefix}<.01%`
    if (apy >= 10) return `${prefix}${Math.round(apy)}%`
    return `${prefix}${apy.toFixed(2)}%`
  }

  /** Get building sprite data at a world position */
  getBuildingAt(worldX: number, worldY: number): BuildingSprite | null {
    for (const [, bs] of this.buildingSprites) {
      const bounds = bs.container.getBounds()
      if (
        worldX >= bounds.x &&
        worldX <= bounds.x + bounds.width &&
        worldY >= bounds.y &&
        worldY <= bounds.y + bounds.height
      ) {
        return bs
      }
    }
    return null
  }

  /** Get building sprite by building ID */
  getBuildingById(id: number): BuildingSprite | undefined {
    return this.buildingSprites.get(id)
  }

  destroy() {
    for (const [, bs] of this.buildingSprites) {
      bs.container.destroy({ children: true })
    }
    this.buildingSprites.clear()
    this.container.removeChildren()
  }
}
