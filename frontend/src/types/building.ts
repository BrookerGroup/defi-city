// Building types as per PRD
export type BuildingType =
  | 'townhall'
  | 'bank'
  | 'shop'
  | 'lottery'

// Asset types supported by buildings
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
  category: string
  description: string
  features: string[]
  risk: string
  riskColor: string
  colors: {
    roof: string
    wall: string
    accent: string
    window: string
  }
  supportedAssets: BuildingAsset[]
  minDeposit?: number // Minimum deposit in USD
}

export type BuildingInfo = BuildingTypeInfo

export const BUILDING_INFO: Record<BuildingType, BuildingInfo> = {
  townhall: {
    type: 'townhall',
    name: 'Town Hall',
    category: 'Portfolio Hub',
    description: 'Your city headquarters. View all assets and manage your portfolio from here.',
    features: ['Portfolio overview', 'Asset management', 'City statistics'],
    risk: 'None',
    riskColor: '#10B981',
    colors: {
      roof: '#F59E0B',
      wall: '#FCD34D',
      accent: '#B45309',
      window: '#0F172A'
    },
    supportedAssets: [],
    minDeposit: 0
  },
  bank: {
    type: 'bank',
    name: 'Bank',
    category: 'Lending Protocol',
    description: 'Deposit your crypto into battle-tested lending pools. Your assets work for you around the clock.',
    features: ['Supply USDC, ETH, BTC, USDT', 'Withdraw anytime', 'Industry-leading security'],
    risk: 'Conservative',
    riskColor: '#10B981',
    colors: {
      roof: '#10B981',
      wall: '#34D399',
      accent: '#059669',
      window: '#0F172A'
    },
    supportedAssets: ['ETH', 'USDC', 'USDT', 'WBTC'],
    minDeposit: 10
  },
  shop: {
    type: 'shop',
    name: 'Shop',
    category: 'DEX Liquidity',
    description: 'Provide liquidity to decentralized exchanges. Earn from every trade that passes through.',
    features: ['Liquidity provision', 'Trading rewards', 'Protocol rewards'],
    risk: 'Moderate',
    riskColor: '#F59E0B',
    colors: {
      roof: '#06B6D4',
      wall: '#67E8F9',
      accent: '#0891B2',
      window: '#0F172A'
    },
    supportedAssets: ['ETH', 'USDC', 'USDT', 'WBTC'],
    minDeposit: 100
  },
  lottery: {
    type: 'lottery',
    name: 'Lottery',
    category: 'Prize Games',
    description: 'Try your luck with provably fair lottery. Verifiable randomness ensures transparent draws.',
    features: ['Verifiable randomness', 'Transparent draws', 'Prize pool jackpots'],
    risk: 'High Variance',
    riskColor: '#EF4444',
    colors: {
      roof: '#A855F7',
      wall: '#C084FC',
      accent: '#7C3AED',
      window: '#0F172A'
    },
    supportedAssets: ['USDC'],
    minDeposit: 10
  }
}

