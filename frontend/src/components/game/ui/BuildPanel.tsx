'use client'

/**
 * BuildPanel - Left side panel that wraps AavePanel
 * Slides in from the left when a tile is selected.
 */

import { AavePanel } from '@/components/aave'
import type { Building } from '@/hooks/useCityBuildings'

interface BuildPanelProps {
  visible: boolean
  selectedCoords: { x: number; y: number } | null
  selectedBuilding: Building | null
  smartWallet: string | null
  hasSmartWallet: boolean
  userAddress?: string
  usedAssets: string[]
  allBuildings: Building[]
  vaultBalances: Record<string, string>
  onSuccess: () => void
  onClose: () => void
}

const pixelFont = { fontFamily: '"Press Start 2P", monospace' } as const

export function BuildPanel({
  visible,
  selectedCoords,
  selectedBuilding,
  smartWallet,
  hasSmartWallet,
  userAddress,
  usedAssets,
  allBuildings,
  vaultBalances,
  onSuccess,
  onClose,
}: BuildPanelProps) {
  if (!visible || !selectedCoords) return null

  return (
    <div
      className={`pointer-events-auto absolute left-0 top-0 bottom-0 w-[400px] max-w-[90vw] bg-slate-900/92 backdrop-blur-sm border-r-2 border-slate-700 overflow-y-auto z-20 transition-transform duration-300 ${
        visible ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      {/* Panel Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b-2 border-slate-700 bg-slate-800/60">
        <div>
          <p className="text-emerald-400 text-[8px]" style={pixelFont}>
            {selectedBuilding
              ? `${selectedBuilding.isBorrow ? 'BORROW' : 'SUPPLY'}: ${selectedBuilding.asset}`
              : 'BUILD NEW'}
          </p>
          <p className="text-slate-500 text-[6px] mt-0.5" style={pixelFont}>
            TILE ({selectedCoords.x}, {selectedCoords.y})
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 bg-red-600 border-2 border-red-400 text-white flex items-center justify-center hover:bg-red-500 text-[10px]"
          style={pixelFont}
        >
          X
        </button>
      </div>

      {/* Aave Panel Content */}
      <div className="p-4">
        <AavePanel
          smartWallet={smartWallet}
          hasSmartWallet={hasSmartWallet}
          userAddress={userAddress}
          onSuccess={() => {
            onSuccess()
            onClose()
          }}
          selectedCoords={selectedCoords}
          usedAssets={usedAssets}
          existingAsset={selectedBuilding?.asset}
          buildingId={selectedBuilding?.id}
          allBuildings={allBuildings}
          isBorrowBuilding={selectedBuilding?.type === 'borrow' || selectedBuilding?.isBorrow}
          selectedBuilding={selectedBuilding}
          vaultBalances={vaultBalances}
        />
      </div>
    </div>
  )
}
