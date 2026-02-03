/**
 * Spritesheet parser for 400x400 PNG assets from itch.io
 * Defines frame rectangles and loads textures into a map.
 */

import { Assets, Texture, Rectangle } from 'pixi.js'

/** Frame definition: source image key + rectangle within that image */
interface FrameDef {
  src: string
  x: number
  y: number
  w: number
  h: number
}

// buildings-1.png & buildings-2.png: 2x2 grid → 200x200 each

const FRAME_DEFS: Record<string, FrameDef> = {
  // buildings-1.png (2x2, 200x200)
  'building-townhall': { src: 'buildings-1', x: 0, y: 0, w: 200, h: 200 },
  'building-bank':     { src: 'buildings-1', x: 200, y: 0, w: 200, h: 200 },
  'building-shop':     { src: 'buildings-1', x: 0, y: 200, w: 200, h: 200 },
  'building-office':   { src: 'buildings-1', x: 200, y: 200, w: 200, h: 200 },

  // buildings-2.png (2x2, 200x200)
  'building-house':    { src: 'buildings-2', x: 0, y: 0, w: 200, h: 200 },
  'building-cafe':     { src: 'buildings-2', x: 200, y: 0, w: 200, h: 200 },
  'building-apt':      { src: 'buildings-2', x: 0, y: 200, w: 200, h: 200 },
  'building-tower':    { src: 'buildings-2', x: 200, y: 200, w: 200, h: 200 },
}

// Source image paths (relative to public/)
const SRC_PATHS: Record<string, string> = {
  'buildings-1': 'assets/buildings-1.png',
  'buildings-2': 'assets/buildings-2.png',
}

let textureCache: Map<string, Texture> | null = null

/**
 * Load all source images and slice them into individual textures.
 * Returns a Map<frameKey, Texture>.
 */
export async function loadAllTextures(basePath: string = ''): Promise<Map<string, Texture>> {
  if (textureCache) return textureCache

  // Load all source images
  const sourceTextures: Record<string, Texture> = {}
  for (const [key, path] of Object.entries(SRC_PATHS)) {
    sourceTextures[key] = await Assets.load(`${basePath}${path}`)
  }

  // Slice frames
  const textures = new Map<string, Texture>()
  for (const [frameKey, def] of Object.entries(FRAME_DEFS)) {
    const srcTex = sourceTextures[def.src]
    if (!srcTex) continue

    const frame = new Rectangle(def.x, def.y, def.w, def.h)
    const tex = new Texture({ source: srcTex.source, frame })
    textures.set(frameKey, tex)
  }

  textureCache = textures
  return textures
}

/** Get a cached texture by frame key */
export function getTexture(key: string): Texture | undefined {
  return textureCache?.get(key)
}

/** Get building sprite key based on type and level */
export function getBuildingSpriteKey(type: string, level: number): string {
  // Town hall always uses the main townhall sprite
  if (type === 'townhall') return 'building-townhall'

  // Map level ranges to different building sprites
  // Level 1-2: small buildings
  // Level 3-4: medium buildings
  // Level 5: large buildings
  if (level >= 5) return 'building-tower'
  if (level >= 3) return 'building-office'
  return 'building-bank'
}
