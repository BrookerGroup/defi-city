'use client'

import { useGameStore } from '@/store/gameStore'
import { BUILDING_INFO, BuildingType } from '@/types'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const AVAILABLE_BUILDINGS: BuildingType[] = [
  'yield-farm',
  'staking-camp',
  'lp-mine',
  'shop',
  'castle',
]

export function BottomBar() {
  const { selectedBuildingType, selectBuildingType, isPlacingBuilding } = useGameStore()

  const handleSelectBuilding = (type: BuildingType) => {
    if (selectedBuildingType === type) {
      selectBuildingType(null)
    } else {
      selectBuildingType(type)
    }
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 h-20 bg-background/80 backdrop-blur-sm border-t z-50">
      <div className="h-full max-w-screen-2xl mx-auto px-4 flex items-center justify-center gap-2">
        {/* Town Hall (not selectable) */}
        <div
          className="flex flex-col items-center justify-center p-2 rounded-lg bg-muted/50 opacity-50 cursor-not-allowed"
          title="Town Hall is already placed"
        >
          <span className="text-2xl">{BUILDING_INFO['town-hall'].icon}</span>
          <span className="text-xs mt-1 hidden sm:block">Town Hall</span>
        </div>

        <div className="w-px h-10 bg-border mx-2" />

        {/* Available buildings */}
        {AVAILABLE_BUILDINGS.map((type) => {
          const info = BUILDING_INFO[type]
          const isSelected = selectedBuildingType === type

          return (
            <Button
              key={type}
              variant={isSelected ? 'default' : 'ghost'}
              className={cn(
                'flex flex-col items-center justify-center h-16 w-16 sm:w-auto sm:px-4',
                isSelected && 'ring-2 ring-primary ring-offset-2 ring-offset-background'
              )}
              onClick={() => handleSelectBuilding(type)}
            >
              <span className="text-2xl">{info.icon}</span>
              <span className="text-xs mt-1 hidden sm:block">{info.name}</span>
            </Button>
          )
        })}

        {isPlacingBuilding && (
          <div className="ml-4 text-sm text-muted-foreground animate-pulse">
            Click on the grid to place building
          </div>
        )}
      </div>
    </div>
  )
}
