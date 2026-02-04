'use client'

/**
 * BuildPanel - Left side panel that wraps AavePanel
 * Shows when clicking on an existing building.
 */

import { AavePanel } from '@/components/aave'
import { LotteryPanel } from '@/components/lottery'
import { LPBuildingPanel } from '@/components/lp'
import { useEffect, useState } from 'react'
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
  isBorrowDrag?: boolean
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
  isBorrowDrag,
  onSuccess,
  onClose,
}: BuildPanelProps) {
  const [buildType, setBuildType] = useState<'bank' | 'lp'>('bank')

  useEffect(() => {
    if (selectedBuilding?.type === 'lp') {
      setBuildType('lp')
    } else {
      setBuildType('bank')
    }
  }, [selectedBuilding])

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
          <p
            className={`text-[8px] ${
              selectedBuilding?.type === 'lottery'
                ? 'text-amber-400'
                : selectedBuilding?.type === 'lp'
                ? 'text-cyan-400'
                : 'text-emerald-400'
            }`}
            style={pixelFont}
          >
            {selectedBuilding?.type === 'lottery'
              ? 'MEGAPOT LOTTERY'
              : selectedBuilding?.type === 'lp'
              ? `LP: ${selectedBuilding.asset}`
              : selectedBuilding
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

      {/* Build Type Selector */}
      {!selectedBuilding && (
        <div className="px-4 pt-4">
          <div className="flex gap-2">
            <button
              onClick={() => setBuildType('bank')}
              className={`flex-1 py-2 border-2 text-[7px] ${
                buildType === 'bank'
                  ? 'bg-blue-600 text-white border-blue-400'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
              style={pixelFont}
            >
              BANK
            </button>
            <button
              onClick={() => setBuildType('lp')}
              className={`flex-1 py-2 border-2 text-[7px] ${
                buildType === 'lp'
                  ? 'bg-cyan-600 text-white border-cyan-400'
                  : 'bg-slate-900 text-slate-400 border-slate-700'
              }`}
              style={pixelFont}
            >
              LP
            </button>
          </div>
        </div>
      )}

      {/* Panel Content: Lottery, LP, or Aave (Bank) */}
      <div className="p-4">
        {selectedBuilding?.type === 'lottery' ? (
          <LotteryPanel
            smartWallet={smartWallet}
            hasSmartWallet={hasSmartWallet}
            userAddress={userAddress}
            onSuccess={() => {
              onSuccess()
              onClose()
            }}
            selectedCoords={selectedCoords}
            buildingId={selectedBuilding?.id}
            isExisting={true}
          />
        ) : selectedBuilding?.type === 'lp' || buildType === 'lp' ? (
          <LPBuildingPanel
            smartWallet={smartWallet}
            userAddress={userAddress}
            selectedCoords={selectedCoords}
            selectedBuilding={selectedBuilding?.type === 'lp' ? selectedBuilding : null}
            vaultBalances={vaultBalances}
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
  )
}

