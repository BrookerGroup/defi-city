'use client'

/**
 * LotteryDialog - Modal dialog that appears when dropping a MEGAPOT on the map
 * Contains the LotteryPanel and LotteryLPPanel with tab navigation.
 */

import { useState } from 'react'
import { LotteryPanel, LotteryLPPanel } from '@/components/lottery'
import type { Building } from '@/hooks/useCityBuildings'

interface LotteryDialogProps {
  visible: boolean
  selectedCoords: { x: number; y: number } | null
  smartWallet: string | null
  hasSmartWallet: boolean
  userAddress?: string
  selectedBuilding?: Building | null
  onSuccess: () => void
  onClose: () => void
}

const pixelFont = { fontFamily: '"Press Start 2P", monospace' } as const

type DialogTab = 'lottery' | 'lp'

export function LotteryDialog({
  visible,
  selectedCoords,
  smartWallet,
  hasSmartWallet,
  userAddress,
  selectedBuilding,
  onSuccess,
  onClose,
}: LotteryDialogProps) {
  const [activeTab, setActiveTab] = useState<DialogTab>('lottery')

  if (!visible || !selectedCoords) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Dialog */}
      <div className="relative w-[450px] max-w-[95vw] max-h-[90vh] overflow-y-auto bg-slate-900 border-4 border-amber-600 shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 border-b-2 border-amber-700 bg-slate-800">
          <div>
            <p className="text-amber-400 text-[10px]" style={pixelFont}>
              {selectedBuilding ? 'MEGAPOT LOTTERY' : 'NEW MEGAPOT'}
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

        {/* Tab Navigation */}
        <div className="flex border-b-2 border-slate-700 bg-slate-800">
          <button
            onClick={() => setActiveTab('lottery')}
            className={`flex-1 px-4 py-2 text-[8px] transition-colors ${
              activeTab === 'lottery'
                ? 'bg-amber-600 text-white border-b-2 border-amber-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            style={pixelFont}
          >
            PLAY LOTTERY
          </button>
          <button
            onClick={() => setActiveTab('lp')}
            className={`flex-1 px-4 py-2 text-[8px] transition-colors ${
              activeTab === 'lp'
                ? 'bg-purple-600 text-white border-b-2 border-purple-400'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
            style={pixelFont}
          >
            LP PROVIDER
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {activeTab === 'lottery' ? (
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
              isExisting={!!selectedBuilding}
            />
          ) : (
            <LotteryLPPanel
              smartWallet={smartWallet}
              hasSmartWallet={hasSmartWallet}
            />
          )}
        </div>
      </div>
    </div>
  )
}
