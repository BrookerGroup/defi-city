/**
 * BuildingRenderer - Renders building sprites on the isometric grid
 * Maps building type + level to sprite key with color tinting per asset.
 * Labels: level badge, APY text, asset name (Press Start 2P font)
 */

import { Container, Sprite, Text, TextStyle, ColorMatrixFilter } from 'pixi.js'
import { isoToScreen, TILE_WIDTH, TILE_HEIGHT } from '@/lib/isometric'
import { getTexture, getBuildingSpriteKey } from '@/lib/spritesheet'
import type { Building } from '@/hooks/useCityBuildings'

// Asset → tint color (applied to building sprite)
const ASSET_TINTS: Record<string, number> = {
  USDC: 0x4a9eff,  // blue
  USDT: 0x26a17b,  // green
  ETH:  0x818cf8,  // indigo
  WBTC: 0xf7931a,  // orange
  LINK: 0x2a5ada,  // chainlink blue
  CORE: 0xf59e0b,  // amber (town hall)
}

const BORROW_TINT = 0xff4444 // red for borrow buildings

// Building size relative to tile
const BUILDING_SCALE = 0.85
const BUILDING_WIDTH = TILE_WIDTH * BUILDING_SCALE
const BUILDING_HEIGHT = TILE_WIDTH * BUILDING_SCALE // buildings are roughly square

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
  sprite: Sprite
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

    const spriteKey = getBuildingSpriteKey(building.type, building.level)
    const texture = getTexture(spriteKey)

    const bContainer = new Container()

    // Position at isometric location
    const { x, y } = isoToScreen(col, row)
    bContainer.x = x
    // Anchor building at bottom-center of tile
    bContainer.y = y

    // Depth sort: buildings need to be above tiles, and sorted by row
    bContainer.zIndex = (col + row) * 10 + 5

    if (texture) {
      const sprite = new Sprite(texture)
      sprite.anchor.set(0.5, 1) // bottom-center
      sprite.width = BUILDING_WIDTH
      sprite.height = BUILDING_HEIGHT

      // Position sprite: center it on tile, bottom aligned
      sprite.x = 0
      sprite.y = TILE_HEIGHT

      // Apply tinting
      if (building.isBorrow) {
        // Red tint for borrow buildings using ColorMatrix
        const colorMatrix = new ColorMatrixFilter()
        colorMatrix.tint(BORROW_TINT, true)
        sprite.filters = [colorMatrix]
      } else {
        const tint = ASSET_TINTS[building.asset] || ASSET_TINTS.CORE
        sprite.tint = tint
      }

      bContainer.addChild(sprite)

      // Asset label
      if (building.type !== 'townhall') {
        const assetLabel = new Text({
          text: building.asset,
          style: labelStyle,
        })
        assetLabel.anchor.set(0.5, 1)
        assetLabel.x = 0
        assetLabel.y = TILE_HEIGHT - BUILDING_HEIGHT - 2
        bContainer.addChild(assetLabel)

        // APY badge
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
          apyText.y = TILE_HEIGHT - BUILDING_HEIGHT - 12
          bContainer.addChild(apyText)
        }

        // Level badge
        const lvlText = new Text({
          text: `Lv${building.level}`,
          style: {
            ...labelStyle,
            fontSize: 6,
            fill: 0xfbbf24,
          },
        })
        lvlText.anchor.set(0.5, 0)
        lvlText.x = BUILDING_WIDTH / 2.5
        lvlText.y = TILE_HEIGHT - BUILDING_HEIGHT + 2
        bContainer.addChild(lvlText)
      } else {
        // Town Hall label
        const label = new Text({
          text: 'TOWN HALL',
          style: { ...labelStyle, fill: 0xfbbf24, fontSize: 7 },
        })
        label.anchor.set(0.5, 1)
        label.x = 0
        label.y = TILE_HEIGHT - BUILDING_HEIGHT - 2
        bContainer.addChild(label)
      }

      this.container.addChild(bContainer)
      this.buildingSprites.set(building.id, {
        container: bContainer,
        building,
        sprite,
      })
    }
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
