import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Building, BuildingType, BuildingAsset, GRID_SIZE, BUILDING_INFO } from '@/types'

// Valid building types for filtering old data
const VALID_TYPES = Object.keys(BUILDING_INFO) as BuildingType[]

// Pending building during placement
interface PendingBuilding {
  type: BuildingType
  position: { x: number; y: number }
  asset?: BuildingAsset
  amount?: string
}

interface GameState {
  buildings: Building[]
  selectedBuildingType: BuildingType | null
  isPlacingBuilding: boolean
  pendingBuilding: PendingBuilding | null
  cameraPosition: { x: number; y: number }
  zoom: number

  // Actions
  addBuilding: (building: Building) => void
  removeBuilding: (id: string) => void
  updateBuilding: (id: string, updates: Partial<Building>) => void
  selectBuildingType: (type: BuildingType | null) => void
  setPlacingBuilding: (isPlacing: boolean) => void
  setPendingBuilding: (pending: PendingBuilding | null) => void
  setCameraPosition: (position: { x: number; y: number }) => void
  setZoom: (zoom: number) => void
  isPositionOccupied: (x: number, y: number) => boolean
  hasTownHall: () => boolean
  reset: () => void
}

const initialState = {
  buildings: [] as Building[],
  selectedBuildingType: null as BuildingType | null,
  isPlacingBuilding: false,
  pendingBuilding: null as PendingBuilding | null,
  cameraPosition: { x: 0, y: 0 },
  zoom: 1,
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      ...initialState,

      addBuilding: (building) =>
        set((state) => ({
          buildings: [...state.buildings, building],
          selectedBuildingType: null,
          isPlacingBuilding: false,
          pendingBuilding: null,
        })),

      removeBuilding: (id) =>
        set((state) => ({
          buildings: state.buildings.filter((b) => b.id !== id),
        })),

      updateBuilding: (id, updates) =>
        set((state) => ({
          buildings: state.buildings.map((b) =>
            b.id === id ? { ...b, ...updates } : b
          ),
        })),

      selectBuildingType: (type) =>
        set({
          selectedBuildingType: type,
          isPlacingBuilding: type !== null,
        }),

      setPlacingBuilding: (isPlacing) =>
        set({
          isPlacingBuilding: isPlacing,
          selectedBuildingType: isPlacing ? get().selectedBuildingType : null,
        }),

      setPendingBuilding: (pending) => set({ pendingBuilding: pending }),

      setCameraPosition: (position) => set({ cameraPosition: position }),

      setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2, zoom)) }),

      isPositionOccupied: (x, y) => {
        return get().buildings.some(
          (b) => b.position.x === x && b.position.y === y
        )
      },

      hasTownHall: () => {
        return get().buildings.some((b) => b.type === 'townhall')
      },

      reset: () => set(initialState),
    }),
    {
      name: 'defi-city-game-v2', // New version to clear old data
      partialize: (state) => ({
        buildings: state.buildings.filter(b => VALID_TYPES.includes(b.type)),
      }),
      merge: (persistedState, currentState) => {
        const persisted = persistedState as Partial<GameState> | undefined
        if (!persisted?.buildings) {
          return currentState
        }
        // Filter out buildings with invalid types
        const validBuildings = persisted.buildings.filter(b => VALID_TYPES.includes(b.type))
        return {
          ...currentState,
          buildings: validBuildings,
        }
      },
    }
  )
)
