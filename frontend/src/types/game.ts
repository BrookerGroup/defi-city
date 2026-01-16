import { Building, BuildingType } from './building'

export interface Resources {
  eth: string
  usdc: string
  points: number
}

export interface GameState {
  buildings: Building[]
  resources: Resources
  selectedBuildingType: BuildingType | null
  isPlacingBuilding: boolean
  cameraPosition: { x: number; y: number }
  zoom: number
}

export interface GridPosition {
  x: number
  y: number
}

export const GRID_SIZE = 10
export const TILE_SIZE = 64
