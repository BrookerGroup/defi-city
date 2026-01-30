/**
 * Map Layout Configuration
 * Defines which tiles are roads, grass (buildable land), etc.
 * Uses a 13x13 grid with roads forming a grid pattern around the center Town Hall
 */

import { GRID_SIZE } from './constants'

export type TileType = 
  | 'grass'        // Empty buildable land
  | 'road-h'       // Horizontal road
  | 'road-v'       // Vertical road
  | 'road-cross'   // 4-way intersection
  | 'road-t-up'    // T-junction (top open)
  | 'road-t-down'  // T-junction (bottom open)
  | 'road-t-left'  // T-junction (left open)
  | 'road-t-right' // T-junction (right open)
  | 'road-curve-1' // Curve top-left
  | 'road-curve-2' // Curve top-right
  | 'road-curve-3' // Curve bottom-left
  | 'road-curve-4' // Curve bottom-right

// Map tile type to sprite key
export const TILE_SPRITE_MAP: Record<TileType, string> = {
  'grass': 'grass-4',
  'road-h': 'street-h',
  'road-v': 'street-v',
  'road-cross': 'street-cross',
  'road-t-up': 'street-t',
  'road-t-down': 'street-t',
  'road-t-left': 'street-t',
  'road-t-right': 'street-t',
  'road-curve-1': 'street-curve-1',
  'road-curve-2': 'street-curve-2',
  'road-curve-3': 'street-curve-3',
  'road-curve-4': 'street-curve-4',
}

/**
 * Generate the map layout with roads forming a grid pattern
 * Roads are placed at specific rows/columns to create block patterns
 * 
 * Layout concept (13x13):
 * - Roads at rows: 2, 6, 10 (0-indexed: 2, 6, 10)
 * - Roads at cols: 2, 6, 10 (0-indexed: 2, 6, 10)
 * - This creates 4 blocks of buildable land with roads between them
 */
export function generateMapLayout(): TileType[][] {
  const layout: TileType[][] = []
  
  // Road positions (0-indexed) - expanded for 26x26 grid
  const roadRows = new Set([3, 6, 9, 12, 15, 18, 21])
  const roadCols = new Set([3, 6, 9, 12, 15, 18, 21])
  
  for (let row = 0; row < GRID_SIZE; row++) {
    const rowTiles: TileType[] = []
    
    for (let col = 0; col < GRID_SIZE; col++) {
      const isRoadRow = roadRows.has(row)
      const isRoadCol = roadCols.has(col)
      
      if (isRoadRow && isRoadCol) {
        // Intersection
        rowTiles.push('road-cross')
      } else if (isRoadRow) {
        // Horizontal road
        rowTiles.push('road-h')
      } else if (isRoadCol) {
        // Vertical road
        rowTiles.push('road-v')
      } else {
        // Grass/buildable land
        rowTiles.push('grass')
      }
    }
    
    layout.push(rowTiles)
  }
  
  return layout
}

/**
 * Get tile type at specific position
 */
export function getTileType(col: number, row: number, layout: TileType[][]): TileType {
  if (row < 0 || row >= layout.length || col < 0 || col >= layout[0].length) {
    return 'grass'
  }
  return layout[row][col]
}

/**
 * Check if a tile is a road
 */
export function isRoadTile(tileType: TileType): boolean {
  return tileType.startsWith('road-')
}

/**
 * Check if a tile is buildable (can place buildings)
 */
export function isBuildableTile(tileType: TileType): boolean {
  return tileType === 'grass'
}

// Singleton layout instance
let cachedLayout: TileType[][] | null = null

export function getMapLayout(): TileType[][] {
  if (!cachedLayout) {
    cachedLayout = generateMapLayout()
  }
  return cachedLayout
}

/**
 * Get sprite key for a tile at position
 */
export function getTileSpriteKey(col: number, row: number): string {
  const layout = getMapLayout()
  const tileType = getTileType(col, row, layout)
  return TILE_SPRITE_MAP[tileType]
}
