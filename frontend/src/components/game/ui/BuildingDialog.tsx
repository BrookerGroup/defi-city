'use client'

/**
 * BuildingDialog - Modal dialog that appears when dropping SUPPLY/BORROW/LP on the map
 */

import { useEffect } from 'react'
import { AavePanel } from '@/components/aave'
import { LPBuildingPanel } from '@/components/lp'
import type { Building } from '@/hooks/useCityBuildings'

interface BuildingDialogProps {
  visible: boolean
  selectedCoords: { x: number; y: number } | null
  selectedBuilding: Building | null
  smartWallet: string | null
  hasSmartWallet: boolean
  userAddress?: string
  usedAssets: string[]
  allBuildings: Building[]
  vaultBalances: Record<string, string>
  isBorrowDrag?: boolean
  buildType?: 'supply' | 'borrow' | 'lp'
  onRefetchBalances?: () => void
  onSuccess: () => void
  onClose: () => void
}

const pixelFont = { fontFamily: '"Press Start 2P", monospace' } as const

export function BuildingDialog({
  visible,
  selectedCoords,
  selectedBuilding,
  smartWallet,
  hasSmartWallet,
  userAddress,
  usedAssets,
  allBuildings,
  vaultBalances,
  isBorrowDrag,
  buildType = 'supply',
  onRefetchBalances,
  onSuccess,
  onClose,
}: BuildingDialogProps) {
  const isLP = buildType === 'lp'

  useEffect(() => {
    if (visible && isLP && onRefetchBalances) onRefetchBalances()
  }, [visible, isLP, onRefetchBalances])

  if (!visible || !selectedCoords) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Dialog */}
      <div className="relative w-[450px] max-w-[95vw] max-h-[90vh] overflow-y-auto bg-slate-900 border-4 border-slate-600 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b-2 border-slate-700 bg-slate-800">
          <div>
            <p 
              className={`text-[10px] ${
                isLP ? 'text-cyan-400' : isBorrowDrag ? 'text-orange-400' : 'text-emerald-400'
              }`}
              style={pixelFont}
            >
              {selectedBuilding
                ? selectedBuilding.type === 'lp'
                  ? `LP: ${selectedBuilding.asset}`
                  : `${selectedBuilding.isBorrow ? 'BORROW' : 'SUPPLY'}: ${selectedBuilding.asset}`
                : isLP ? 'NEW LP' : isBorrowDrag ? 'NEW BORROW' : 'NEW SUPPLY'}
            </p>
            <p className="text-slate-500 text-[7px] mt-0.5" style={pixelFont}>
              TILE ({selectedCoords.x}, {selectedCoords.y})
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 bg-red-600 border-2 border-red-400 text-white flex items-center justify-center hover:bg-red-500 text-[10px] transition-colors"
            style={pixelFont}
          >
            X
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {isLP ? (
            <LPBuildingPanel
              smartWallet={smartWallet}
              userAddress={userAddress}
              selectedCoords={selectedCoords!}
              selectedBuilding={null}
              vaultBalances={vaultBalances}
              onRefetchBalances={onRefetchBalances}
              onSuccess={() => {
                onSuccess()
                onClose()
              }}
            />
          ) : (
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
              isBorrowBuilding={selectedBuilding?.type === 'borrow' || selectedBuilding?.isBorrow || isBorrowDrag}
              selectedBuilding={selectedBuilding}
              vaultBalances={vaultBalances}
            />
          )}
        </div>
      </div>
    </div>
  )
}
