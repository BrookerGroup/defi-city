'use client'

/**
 * BottomBar - Status bar at the bottom of the game
 * Shows: Selected coordinates | Building count | Camera controls
 */

interface BottomBarProps {
  selectedCoords: { x: number; y: number } | null
  buildingCount: number
  onResetCamera: () => void
  onZoomIn: () => void
  onZoomOut: () => void
  isMoving?: boolean
  isLoading?: boolean
}

const pixelFont = { fontFamily: '"Press Start 2P", monospace' } as const

export function BottomBar({
  selectedCoords,
  buildingCount,
  onResetCamera,
  onZoomIn,
  onZoomOut,
  isMoving,
  isLoading,
}: BottomBarProps) {
  return (
    <div
      className="pointer-events-auto flex items-center justify-between px-4 py-1.5 bg-slate-900/85 backdrop-blur-sm border-t-2 border-slate-700/80 text-[7px]"
      style={pixelFont}
    >
      {/* Left: Status */}
      <div className="flex items-center gap-4">
        {isMoving ? (
          <span className="text-orange-400 animate-pulse">MOVING BUILDING...</span>
        ) : isLoading ? (
          <span className="text-amber-400 animate-pulse">SYNCING...</span>
        ) : selectedCoords ? (
          <span className="text-blue-400">
            SELECTED: ({selectedCoords.x}, {selectedCoords.y})
          </span>
        ) : (
          <span className="text-slate-500">
            CLICK TILE TO BUILD | DRAG BUILDING TO MOVE
          </span>
        )}
      </div>

      {/* Center: Stats */}
      <div className="flex items-center gap-4">
        <span className="text-slate-500">
          BUILDINGS: <span className="text-amber-400">{buildingCount}</span>
        </span>
      </div>

      {/* Right: Camera controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onZoomOut}
          className="w-6 h-6 bg-slate-800 border border-slate-600 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors text-[8px]"
        >
          -
        </button>
        <button
          onClick={onResetCamera}
          className="px-2 h-6 bg-slate-800 border border-slate-600 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors"
        >
          RESET
        </button>
        <button
          onClick={onZoomIn}
          className="w-6 h-6 bg-slate-800 border border-slate-600 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors text-[8px]"
        >
          +
        </button>
      </div>
    </div>
  )
}
