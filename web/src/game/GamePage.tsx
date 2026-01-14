import { useEffect, useCallback } from 'react'
import { GameCanvas } from './components/GameCanvas'
import { GameUI } from './components/GameUI'
import { useGameState } from './hooks/useGameState'
import './GamePage.css'

export function GamePage() {
  const {
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
    movePlayer
  } = useGameState()

  // Handle escape key to cancel placing or close panel
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (placingType) {
          cancelPlacing()
        } else if (selectedBuilding) {
          setSelectedBuilding(null)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [placingType, selectedBuilding, cancelPlacing, setSelectedBuilding])

  const handlePlaceBuilding = useCallback(
    (x: number, y: number) => {
      placeBuilding(x, y)
    },
    [placeBuilding]
  )

  const handleCanPlaceCheck = useCallback(
    (x: number, y: number, type: string) => {
      return canPlace(x, y, type)
    },
    [canPlace]
  )

  return (
    <div className="game-page">
      <GameCanvas
        buildings={gameState.buildings}
        playerTileX={gameState.playerTileX}
        playerTileY={gameState.playerTileY}
        placingType={placingType}
        canPlace={handleCanPlaceCheck}
        onPlaceBuilding={handlePlaceBuilding}
        onSelectBuilding={setSelectedBuilding}
        onMovePlayer={movePlayer}
      />
      <GameUI
        gameState={gameState}
        selectedBuilding={selectedBuilding}
        placingType={placingType}
        onStartPlacing={startPlacing}
        onCancelPlacing={cancelPlacing}
        onClosePanel={() => setSelectedBuilding(null)}
        onHarvest={harvestBuilding}
        onDeposit={depositToBuilding}
        onDemolish={demolishBuilding}
        onConnectWallet={connectWallet}
      />
    </div>
  )
}

export default GamePage
