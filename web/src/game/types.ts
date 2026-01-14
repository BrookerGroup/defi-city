export interface BuildingDefinition {
  name: string
  icon: string
  desc: string
  w: number
  h: number
  cost: {
    type: 'stable' | 'eth' | 'lp'
    amount: number
  }
  apy: number
  strategy: string
  max: number
  minLevel?: number
  color: number
  height: number
  sprite: string
  boost?: number
}

export interface Building {
  type: string
  x: number
  y: number
  deposited: number
  earned: number
  createdAt: number
}

export interface Resources {
  stable: number
  eth: number
  lp: number
}

export interface GameState {
  resources: Resources
  buildings: Building[]
  playerTileX: number
  playerTileY: number
  level: number
  totalDeposited: number
  totalEarned: number
  wallet: string | null
  lastUpdate: number
}

export type BuildingType = 'towncenter' | 'farm' | 'lumber' | 'mine' | 'castle' | 'shop'
