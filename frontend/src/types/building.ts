// Building types as per PRD
export type BuildingType =
  | 'town-hall'  // Smart Wallet (free, one per user)
  | 'bank'       // Aave V3 (Supply/Borrow)
  | 'shop'       // Aerodrome LP
  | 'lottery'    // Megapot Integration

// Supported assets for buildings
export type BuildingAsset = 'ETH' | 'USDC' | 'USDT' | 'WBTC' | 'WETH'

export interface Building {
  id: string
  type: BuildingType
  position: { x: number; y: number }
  asset?: BuildingAsset
  deposited?: string
  depositedUSD?: number
  createdAt: number
  // For tracking
  totalEarned?: string
  pendingRewards?: string
}

export interface BuildingTypeInfo {
  type: BuildingType
  name: string
  icon: string
  protocol: string
  description: string
  apy?: string
  minDeposit?: number // in USD
  minDepositDisplay?: string
  supportedAssets: BuildingAsset[]
  fee: number // basis points (0.05% = 5)
  risk: 'low' | 'medium' | 'high'
  color: number
  canDemolish: boolean
}

export const BUILDING_FEE_BPS = 5 // 0.05%

export const BUILDING_INFO: Record<BuildingType, BuildingTypeInfo> = {
  'town-hall': {
    type: 'town-hall',
    name: 'Town Hall',
    icon: '🏛️',
    protocol: 'Smart Wallet',
    description: 'Your self-custodial wallet. All your assets are stored here safely.',
    supportedAssets: [],
    fee: 0,
    risk: 'low',
    color: 0x8B7355,
    canDemolish: false,
  },
  'bank': {
    type: 'bank',
    name: 'Bank',
    icon: '🏦',
    protocol: 'Aave V3',
    description: 'Supply assets to earn interest, or borrow against your collateral.',
    apy: '3-8%',
    minDeposit: 100,
    minDepositDisplay: '$100',
    supportedAssets: ['USDC', 'USDT', 'ETH', 'WBTC', 'WETH'],
    fee: BUILDING_FEE_BPS,
    risk: 'low',
    color: 0x2775CA,
    canDemolish: true,
  },
  'shop': {
    type: 'shop',
    name: 'Shop',
    icon: '🏪',
    protocol: 'Aerodrome',
    description: 'Provide liquidity to earn trading fees and AERO rewards.',
    apy: '5-25%',
    minDeposit: 500,
    minDepositDisplay: '$500',
    supportedAssets: ['USDC', 'USDT', 'ETH', 'WBTC', 'WETH'],
    fee: BUILDING_FEE_BPS,
    risk: 'medium',
    color: 0x26A17B,
    canDemolish: true,
  },
  'lottery': {
    type: 'lottery',
    name: 'Lottery Office',
    icon: '🎰',
    protocol: 'Megapot',
    description: 'Buy lottery tickets for a chance to win the $1M+ jackpot!',
    minDeposit: 10,
    minDepositDisplay: '$10',
    supportedAssets: ['USDC'], // Megapot only accepts USDC
    fee: BUILDING_FEE_BPS,
    risk: 'high',
    color: 0xF7931A,
    canDemolish: true,
  },
}

// Helper to get available buildings (excluding town-hall which is auto-placed)
export const PLACEABLE_BUILDINGS: BuildingType[] = ['bank', 'shop', 'lottery']
