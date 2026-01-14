import { TILE_WIDTH, TILE_HEIGHT } from '../constants'

// Convert tile coordinates to screen position
export function tileToScreen(tileX: number, tileY: number) {
  return {
    x: (tileX - tileY) * (TILE_WIDTH / 2),
    y: (tileX + tileY) * (TILE_HEIGHT / 2)
  }
}

// Convert screen position to tile coordinates
export function screenToTile(screenX: number, screenY: number) {
  return {
    x: Math.floor((screenX / (TILE_WIDTH / 2) + screenY / (TILE_HEIGHT / 2)) / 2),
    y: Math.floor((screenY / (TILE_HEIGHT / 2) - screenX / (TILE_WIDTH / 2)) / 2)
  }
}

// Darken a color by a factor
export function darken(color: number, amount: number): number {
  const r = Math.max(0, ((color >> 16) & 0xff) * (1 - amount))
  const g = Math.max(0, ((color >> 8) & 0xff) * (1 - amount))
  const b = Math.max(0, (color & 0xff) * (1 - amount))
  return (Math.floor(r) << 16) | (Math.floor(g) << 8) | Math.floor(b)
}
