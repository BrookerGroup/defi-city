/**
 * Map Layout Configuration
 * All tiles are grass (buildable).
 */

import { GRID_SIZE } from './constants'

export type TileType = 'grass'

/**
 * Generate the map layout — all grass tiles.
 */
export function generateMapLayout(): TileType[][] {
  const layout: TileType[][] = []
  for (let row = 0; row < GRID_SIZE; row++) {
    layout.push(Array(GRID_SIZE).fill('grass'))
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
 * Check if a tile is buildable — always true.
 */
export function isBuildableTile(_tileType: TileType): boolean {
  return true
}

// Singleton layout instance
let cachedLayout: TileType[][] | null = null

export function getMapLayout(): TileType[][] {
  if (!cachedLayout) {
    cachedLayout = generateMapLayout()
  }
  return cachedLayout
}
