export type BuildingType =
  | 'town-hall'
  | 'yield-farm'
  | 'staking-camp'
  | 'lp-mine'
  | 'castle'
  | 'shop'

export interface Building {
  id: string
  type: BuildingType
  position: { x: number; y: number }
  deposited?: string
  createdAt: number
}

export interface BuildingInfo {
  type: BuildingType
  name: string
  icon: string
  protocol: string
  description: string
  apy?: string
  minDeposit?: string
  color: number
}

export const BUILDING_INFO: Record<BuildingType, BuildingInfo> = {
  'town-hall': {
    type: 'town-hall',
    name: 'Town Hall',
    icon: '🏛️',
    protocol: 'Smart Wallet',
    description: 'Your portfolio overview',
    color: 0x8B7355,
  },
  'yield-farm': {
    type: 'yield-farm',
    name: 'Yield Farm',
    icon: '🌾',
    protocol: 'Aave V3',
    description: 'USDC Lending',
    apy: '3-8%',
    minDeposit: '10 USDC',
    color: 0x90EE90,
  },
  'staking-camp': {
    type: 'staking-camp',
    name: 'Staking Camp',
    icon: '🪵',
    protocol: 'Lido',
    description: 'ETH Staking',
    apy: '3-5%',
    minDeposit: '0.01 ETH',
    color: 0xDEB887,
  },
  'lp-mine': {
    type: 'lp-mine',
    name: 'LP Mine',
    icon: '⛏️',
    protocol: 'Uniswap V3',
    description: 'Liquidity Pool',
    apy: '5-20%',
    minDeposit: '100 USDC',
    color: 0x708090,
  },
  'castle': {
    type: 'castle',
    name: 'Castle',
    icon: '🏰',
    protocol: 'Governance',
    description: 'veToken Locking',
    apy: '+25% boost',
    color: 0x4169E1,
  },
  'shop': {
    type: 'shop',
    name: 'Shop',
    icon: '🏪',
    protocol: 'DEX Aggregator',
    description: 'Token Swaps',
    color: 0xFFD700,
  },
}
