import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Building, BuildingType, GRID_SIZE } from '@/types'

interface GameState {
  buildings: Building[]
  selectedBuildingType: BuildingType | null
  isPlacingBuilding: boolean
  cameraPosition: { x: number; y: number }
  zoom: number

  // Actions
  addBuilding: (building: Building) => void
  removeBuilding: (id: string) => void
  updateBuilding: (id: string, updates: Partial<Building>) => void
  selectBuildingType: (type: BuildingType | null) => void
  setPlacingBuilding: (isPlacing: boolean) => void
  setCameraPosition: (position: { x: number; y: number }) => void
  setZoom: (zoom: number) => void
  isPositionOccupied: (x: number, y: number) => boolean
  reset: () => void
}

const initialState = {
  buildings: [
    {
      id: 'town-hall-1',
      type: 'town-hall' as BuildingType,
      position: { x: Math.floor(GRID_SIZE / 2), y: Math.floor(GRID_SIZE / 2) },
      createdAt: Date.now(),
    },
  ],
  selectedBuildingType: null,
  isPlacingBuilding: false,
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

      setCameraPosition: (position) => set({ cameraPosition: position }),

      setZoom: (zoom) => set({ zoom: Math.max(0.5, Math.min(2, zoom)) }),

      isPositionOccupied: (x, y) => {
        return get().buildings.some(
          (b) => b.position.x === x && b.position.y === y
        )
      },

      reset: () => set(initialState),
    }),
    {
      name: 'defi-city-game',
      partialize: (state) => ({
        buildings: state.buildings,
      }),
    }
  )
)
