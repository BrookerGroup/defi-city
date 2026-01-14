import { useState, useEffect, useCallback } from 'react'
import type { GameState, Building } from '../types'
import { STORAGE_KEY, MAP_WIDTH, MAP_HEIGHT, BUILDINGS } from '../constants'

const defaultState = (): GameState => ({
  resources: { stable: 2500, eth: 1.5, lp: 500 },
  buildings: [],
  playerTileX: Math.floor(MAP_WIDTH / 2),
  playerTileY: Math.floor(MAP_HEIGHT / 2),
  level: 1,
  totalDeposited: 0,
  totalEarned: 0,
  wallet: null,
  lastUpdate: Date.now()
})

function loadGame(): GameState {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    try {
      const data = JSON.parse(saved) as GameState
      const hours = (Date.now() - data.lastUpdate) / 3600000

      // Calculate offline earnings
      if (hours > 0 && data.buildings) {
        data.buildings.forEach((b) => {
          const def = BUILDINGS[b.type]
          if (def && def.apy > 0) {
            const rate = def.apy / 100 / 365 / 24
            b.earned = (b.earned || 0) + b.deposited * rate * hours
          }
        })
      }
      return { ...defaultState(), ...data }
    } catch (e) {
      console.error('Failed to load game:', e)
    }
  }
  return defaultState()
}

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(loadGame)
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null)
  const [placingType, setPlacingType] = useState<string | null>(null)

  // Save game to localStorage
  const saveGame = useCallback(() => {
    setGameState((prev) => {
      const updated = { ...prev, lastUpdate: Date.now() }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
      return updated
    })
  }, [])

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(saveGame, 30000)
    return () => clearInterval(interval)
  }, [saveGame])

  // Calculate earnings in real-time
  useEffect(() => {
    const interval = setInterval(() => {
      setGameState((prev) => ({
        ...prev,
        buildings: prev.buildings.map((b) => {
          const def = BUILDINGS[b.type]
          if (def && def.apy > 0 && b.deposited > 0) {
            const rate = def.apy / 100 / 365 / 24 / 3600
            return { ...b, earned: (b.earned || 0) + b.deposited * rate }
          }
          return b
        })
      }))
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  // Check if can place building
  const canPlace = useCallback(
    (x: number, y: number, type: string): boolean => {
      const def = BUILDINGS[type]
      if (!def) return false
      if (x < 0 || y < 0 || x + def.w > MAP_WIDTH || y + def.h > MAP_HEIGHT) return false

      // Check path
      const pathY = Math.floor(MAP_HEIGHT / 2)
      const pathX = Math.floor(MAP_WIDTH / 2)
      for (let dy = 0; dy < def.h; dy++) {
        for (let dx = 0; dx < def.w; dx++) {
          if (y + dy === pathY || x + dx === pathX) return false
        }
      }

      // Check collision with other buildings
      for (const b of gameState.buildings) {
        const bDef = BUILDINGS[b.type]
        if (x < b.x + bDef.w && x + def.w > b.x && y < b.y + bDef.h && y + def.h > b.y) {
          return false
        }
      }
      return true
    },
    [gameState.buildings]
  )

  // Place a building
  const placeBuilding = useCallback(
    (x: number, y: number): boolean => {
      if (!placingType || !canPlace(x, y, placingType)) return false

      const def = BUILDINGS[placingType]

      setGameState((prev) => {
        const newResources = { ...prev.resources }
        if (def.cost.type === 'stable') newResources.stable -= def.cost.amount
        if (def.cost.type === 'eth') newResources.eth -= def.cost.amount
        if (def.cost.type === 'lp') newResources.lp -= def.cost.amount

        const newBuildings = [
          ...prev.buildings,
          {
            type: placingType,
            x,
            y,
            deposited: 0,
            earned: 0,
            createdAt: Date.now()
          }
        ]

        return {
          ...prev,
          resources: newResources,
          buildings: newBuildings,
          level: Math.floor(newBuildings.length / 3) + 1
        }
      })

      setPlacingType(null)
      saveGame()
      return true
    },
    [placingType, canPlace, saveGame]
  )

  // Start placing a building
  const startPlacing = useCallback(
    (type: string): boolean => {
      const def = BUILDINGS[type]
      if (!def) return false

      // Check resources
      if (def.cost.type === 'stable' && gameState.resources.stable < def.cost.amount) return false
      if (def.cost.type === 'eth' && gameState.resources.eth < def.cost.amount) return false
      if (def.cost.type === 'lp' && gameState.resources.lp < def.cost.amount) return false

      // Check max count
      const count = gameState.buildings.filter((b) => b.type === type).length
      if (count >= def.max) return false

      // Check level requirement
      if (def.minLevel && gameState.level < def.minLevel) return false

      setPlacingType(type)
      return true
    },
    [gameState]
  )

  // Cancel placing
  const cancelPlacing = useCallback(() => {
    setPlacingType(null)
  }, [])

  // Harvest earnings from a building
  const harvestBuilding = useCallback(
    (building: Building): number => {
      const earned = building.earned || 0
      if (earned <= 0) return 0

      setGameState((prev) => ({
        ...prev,
        resources: {
          ...prev.resources,
          stable: prev.resources.stable + earned
        },
        totalEarned: prev.totalEarned + earned,
        buildings: prev.buildings.map((b) =>
          b === building ? { ...b, earned: 0 } : b
        )
      }))

      saveGame()
      return earned
    },
    [saveGame]
  )

  // Deposit to a building
  const depositToBuilding = useCallback(
    (building: Building, amount: number): boolean => {
      const def = BUILDINGS[building.type]
      if (!def || def.apy === 0) return false
      if (amount <= 0 || amount > gameState.resources.stable) return false

      setGameState((prev) => ({
        ...prev,
        resources: {
          ...prev.resources,
          stable: prev.resources.stable - amount
        },
        totalDeposited: prev.totalDeposited + amount,
        buildings: prev.buildings.map((b) =>
          b === building ? { ...b, deposited: (b.deposited || 0) + amount } : b
        )
      }))

      saveGame()
      return true
    },
    [gameState.resources.stable, saveGame]
  )

  // Demolish a building
  const demolishBuilding = useCallback(
    (building: Building): boolean => {
      if (building.type === 'towncenter') return false

      const def = BUILDINGS[building.type]
      const refund = def.cost.amount * 0.5

      setGameState((prev) => {
        const newResources = { ...prev.resources }
        if (def.cost.type === 'stable') newResources.stable += refund
        if (def.cost.type === 'eth') newResources.eth += refund
        if (def.cost.type === 'lp') newResources.lp += refund
        newResources.stable += building.deposited || 0

        return {
          ...prev,
          resources: newResources,
          buildings: prev.buildings.filter((b) => b !== building)
        }
      })

      setSelectedBuilding(null)
      saveGame()
      return true
    },
    [saveGame]
  )

  // Connect wallet (mock)
  const connectWallet = useCallback(() => {
    const addr = '0x' + Math.random().toString(16).slice(2, 8)
    setGameState((prev) => ({ ...prev, wallet: addr }))
    saveGame()
    return addr
  }, [saveGame])

  // Move player
  const movePlayer = useCallback((dx: number, dy: number) => {
    setGameState((prev) => {
      const newX = prev.playerTileX + dx
      const newY = prev.playerTileY + dy

      if (newX >= 1 && newX < MAP_WIDTH - 1 && newY >= 1 && newY < MAP_HEIGHT - 1) {
        return {
          ...prev,
          playerTileX: newX,
          playerTileY: newY
        }
      }
      return prev
    })
  }, [])

  // Initialize town center if no buildings
  useEffect(() => {
    if (gameState.buildings.length === 0) {
      setGameState((prev) => ({
        ...prev,
        buildings: [
          {
            type: 'towncenter',
            x: Math.floor(MAP_WIDTH / 2) + 2,
            y: Math.floor(MAP_HEIGHT / 2) + 2,
            deposited: 0,
            earned: 0,
            createdAt: Date.now()
          }
        ]
      }))
      saveGame()
    }
  }, [gameState.buildings.length, saveGame])

  return {
    gameState,
    selectedBuilding,
    setSelectedBuilding,
    placingType,
    startPlacing,
    cancelPlacing,
    canPlace,
    placeBuilding,
    harvestBuilding,
    depositToBuilding,
    demolishBuilding,
    connectWallet,
    movePlayer,
    saveGame
  }
}
