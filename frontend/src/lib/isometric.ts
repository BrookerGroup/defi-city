/**
 * Isometric math utilities
 * Standard isometric projection
 * Asset tiles are 96x64 pixels
 */

export const TILE_WIDTH = 96
export const TILE_HEIGHT = 64

/**
 * Convert grid coordinates (col, row) to screen pixel position.
 * Origin (0,0) is the top-center diamond point of tile (0,0).
 */
export function isoToScreen(col: number, row: number): { x: number; y: number } {
  return {
    x: (col - row) * (TILE_WIDTH / 2),
    y: (col + row) * (TILE_HEIGHT / 2),
  }
}

/**
 * Convert screen pixel position back to grid coordinates.
 * Returns fractional values — use Math.floor() to get the tile index.
 */
export function screenToIso(screenX: number, screenY: number): { col: number; row: number } {
  return {
    col: (screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2,
    row: (screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2,
  }
}

/**
 * Get the 4 corner points of the diamond for a tile at (col, row).
 * Useful for drawing tile outlines / hit areas.
 */
export function getTileDiamond(col: number, row: number): [number, number][] {
  const { x, y } = isoToScreen(col, row)
  return [
    [x, y],                                // top
    [x + TILE_WIDTH / 2, y + TILE_HEIGHT / 2], // right
    [x, y + TILE_HEIGHT],                  // bottom
    [x - TILE_WIDTH / 2, y + TILE_HEIGHT / 2], // left
  ]
}

/**
 * Get the center point of a tile diamond.
 */
export function getTileCenter(col: number, row: number): { x: number; y: number } {
  const { x, y } = isoToScreen(col, row)
  return {
    x,
    y: y + TILE_HEIGHT / 2,
  }
}
