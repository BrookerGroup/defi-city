/**
 * Asset Loader for individual tile images
 * Loads PNG files from /public/assets/ for use in PixiJS
 */

import { Assets, Texture } from 'pixi.js'

// Map tile types to asset file names
export const TILE_ASSETS: Record<string, string> = {
  // Grass
  'grass': 'Grass.png',
  
  // Roads (using new individual files)
  'road-h': 'Road straight A.png',       // Horizontal road
  'road-v': 'Road straight B.png',       // Vertical road
  'road-cross': 'Road cross E.png',      // 4-way intersection
  'road-t': 'Road cross D.png',          // T-junction
  'road-curve-1': 'Road turn A.png',     // Curve
  'road-curve-2': 'Road turn B.png',     // Curve
  'road-curve-3': 'Road turn C.png',     // Curve
  'road-curve-4': 'Road turn D.png',     // Curve
}

// Cache loaded textures
const textureCache: Map<string, Texture> = new Map()

/**
 * Load all tile textures
 */
export async function loadTileAssets(): Promise<void> {
  const assetPaths = Object.entries(TILE_ASSETS).map(([key, filename]) => ({
    alias: key,
    src: `/assets/${filename}`,
  }))
  
  // Load all assets
  await Assets.load(assetPaths.map(a => a.src))
  
  // Cache textures
  for (const { alias, src } of assetPaths) {
    const texture = await Assets.load(src)
    if (texture) {
      textureCache.set(alias, texture as Texture)
    }
  }
}

/**
 * Get a tile texture by key
 */
export function getTileTexture(key: string): Texture | null {
  return textureCache.get(key) || null
}

/**
 * Check if assets are loaded
 */
export function areTileAssetsLoaded(): boolean {
  return textureCache.size > 0
}
