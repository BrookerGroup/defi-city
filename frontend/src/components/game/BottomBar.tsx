'use client'

import { useGameStore } from '@/store/gameStore'
import { BUILDING_INFO, PLACEABLE_BUILDINGS } from '@/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

export function BottomBar() {
  const { selectedBuildingType, selectBuildingType, isPlacingBuilding, buildings } = useGameStore()

  const hasTownHall = buildings.some(b => b.type === 'town-hall')

  const handleSelectBuilding = () => {
    // Toggle placing mode - building type will be selected in modal
    if (isPlacingBuilding) {
      selectBuildingType(null)
    } else {
      // Use a placeholder to indicate we want to place a building
      selectBuildingType('bank') // Will be overridden by modal selection
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-sm border-t z-50">
      <div className="h-full max-w-screen-2xl mx-auto px-4 flex items-center justify-center gap-4">
        {/* Town Hall indicator */}
        <div
          className={cn(
            'flex flex-col items-center justify-center p-2 rounded-lg',
            hasTownHall ? 'bg-green-500/10' : 'bg-muted/50'
          )}
        >
          <span className="text-2xl">{BUILDING_INFO['town-hall'].icon}</span>
          <span className="text-xs mt-1 hidden sm:block">Town Hall</span>
          {hasTownHall && (
            <Badge variant="outline" className="text-[10px] px-1 py-0 mt-1 text-green-500 border-green-500/30">
              Active
            </Badge>
          )}
        </div>

        <div className="w-px h-10 bg-border" />

        {/* Building buttons */}
        {PLACEABLE_BUILDINGS.map((type) => {
          const info = BUILDING_INFO[type]
          const count = buildings.filter(b => b.type === type).length

          return (
            <Button
              key={type}
              variant="ghost"
              className="flex flex-col items-center justify-center h-16 w-16 sm:w-auto sm:px-4 relative"
              onClick={handleSelectBuilding}
            >
              <span className="text-2xl">{info.icon}</span>
              <span className="text-xs mt-1 hidden sm:block">{info.name}</span>
              {count > 0 && (
                <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                  {count}
                </Badge>
              )}
            </Button>
          )
        })}

        <div className="w-px h-10 bg-border" />

        {/* Place Building Button */}
        <Button
          variant={isPlacingBuilding ? 'default' : 'outline'}
          className={cn(
            'gap-2',
            isPlacingBuilding && 'ring-2 ring-primary ring-offset-2 ring-offset-background animate-pulse'
          )}
          onClick={handleSelectBuilding}
        >
          {isPlacingBuilding ? (
            <>
              <span>Click on grid...</span>
            </>
          ) : (
            <>
              <span className="text-lg">+</span>
              <span className="hidden sm:inline">Build</span>
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
