import type { BuildingDefinition } from './types'

// Isometric Constants
export const TILE_WIDTH = 64
export const TILE_HEIGHT = 32
export const MAP_WIDTH = 50
export const MAP_HEIGHT = 40
export const STORAGE_KEY = 'deficity_react_v1'

// Building Definitions
export const BUILDINGS: Record<string, BuildingDefinition> = {
  towncenter: {
    name: 'Town Hall',
    icon: '🏛️',
    desc: 'HQ',
    w: 2,
    h: 2,
    cost: { type: 'stable', amount: 0 },
    apy: 0,
    strategy: 'Portfolio Hub',
    max: 1,
    color: 0xd4a574,
    height: 80,
    sprite: '/game/assets/PNG/buildingTiles_085.png'
  },
  farm: {
    name: 'Yield Farm',
    icon: '🌾',
    desc: 'Aave',
    w: 2,
    h: 2,
    cost: { type: 'stable', amount: 100 },
    apy: 5.2,
    strategy: 'USDC → Aave',
    max: 10,
    color: 0x90ee90,
    height: 50,
    sprite: '/game/assets/PNG/buildingTiles_100.png'
  },
  lumber: {
    name: 'Stake Camp',
    icon: '🪵',
    desc: 'Lido',
    w: 2,
    h: 2,
    cost: { type: 'eth', amount: 0.05 },
    apy: 8.4,
    strategy: 'ETH → Lido',
    max: 10,
    color: 0xdeb887,
    height: 45,
    sprite: '/game/assets/PNG/buildingTiles_009.png'
  },
  mine: {
    name: 'LP Mine',
    icon: '⛏️',
    desc: 'Uniswap',
    w: 2,
    h: 2,
    cost: { type: 'lp', amount: 50 },
    apy: 12.1,
    strategy: 'Uniswap LP',
    max: 10,
    color: 0x8b8b8b,
    height: 55,
    sprite: '/game/assets/PNG/buildingTiles_033.png'
  },
  castle: {
    name: 'Castle',
    icon: '🏰',
    desc: 'Lock',
    w: 3,
    h: 3,
    cost: { type: 'stable', amount: 1000 },
    apy: 0,
    boost: 25,
    strategy: 'Lock 90d',
    max: 1,
    minLevel: 3,
    color: 0x606080,
    height: 100,
    sprite: '/game/assets/PNG/buildingTiles_122.png'
  },
  shop: {
    name: 'Shop',
    icon: '🏪',
    desc: 'DEX',
    w: 2,
    h: 2,
    cost: { type: 'stable', amount: 200 },
    apy: 3.5,
    strategy: 'Swap fees',
    max: 5,
    color: 0xffb6c1,
    height: 50,
    sprite: '/game/assets/PNG/buildingTiles_001.png'
  }
}
