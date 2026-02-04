'use client'

import { useState, useCallback, useEffect } from 'react'
import { useLotteryData, useLotteryPosition, useLotteryBuyTickets, useLotteryClaimWinnings } from '@/hooks'
import { ErrorPopup } from '@/components/ui/ErrorPopup'

interface LotteryPanelProps {
  smartWallet: string | null
  hasSmartWallet: boolean
  userAddress?: string
  onSuccess?: () => void
  selectedCoords?: { x: number; y: number } | null
  buildingId?: number
  isExisting?: boolean
}

const pixelFont = { fontFamily: '"Press Start 2P", monospace' } as const

function formatTime(seconds: number): string {
  if (seconds <= 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

export function LotteryPanel({
  smartWallet,
  hasSmartWallet,
  userAddress,
  onSuccess,
  selectedCoords,
  buildingId,
  isExisting,
}: LotteryPanelProps) {
  const [ticketCount, setTicketCount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successType, setSuccessType] = useState<'buy' | 'claim' | null>(null)
  const [showMintInfo, setShowMintInfo] = useState(false)

  const { data: lotteryData, loading: loadingData, refresh: refreshData } = useLotteryData()
  const { position, loading: loadingPosition, refresh: refreshPosition } = useLotteryPosition(smartWallet)
  const { buyTickets, loading: loadingBuy } = useLotteryBuyTickets()
  const { claimWinnings, loading: loadingClaim } = useLotteryClaimWinnings()

  const loading = loadingBuy || loadingClaim

  // Refresh data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData()
      refreshPosition()
    }, 30000)
    return () => clearInterval(interval)
  }, [refreshData, refreshPosition])

  const totalCost = lotteryData?.ticketPrice
    ? parseFloat(ticketCount || '0') * lotteryData.ticketPrice
    : 0

  const hasInsufficientBalance = totalCost > 0 && position
    ? totalCost > position.mpusdcBalance
    : false

  const handleBuyTickets = useCallback(async () => {
    if (!ticketCount || parseInt(ticketCount) <= 0) {
      setError('Enter number of tickets')
      return
    }
    if (!hasSmartWallet || !smartWallet || !userAddress) {
      setError('Please create Town Hall first')
      return
    }
    if (!lotteryData) {
      setError('Lottery data not loaded')
      return
    }
    if (!lotteryData.allowPurchasing) {
      setError('Ticket purchasing is currently disabled')
      return
    }
    if (hasInsufficientBalance) {
      setError('Insufficient MPUSDC balance')
      return
    }

    setError(null)
    setSuccess(false)

    const result = await buyTickets(
      userAddress,
      smartWallet,
      parseInt(ticketCount),
      lotteryData.ticketPrice,
      selectedCoords?.x ?? 1,
      selectedCoords?.y ?? 1,
      isExisting || !!buildingId
    )

    if (result.success) {
      setSuccess(true)
      setSuccessType('buy')
      setTicketCount('')
      if (onSuccess) onSuccess()
      setTimeout(() => {
        refreshData()
        refreshPosition()
      }, 2000)
      setTimeout(() => { setSuccess(false); setSuccessType(null) }, 5000)
    } else {
      setError(result.error || 'Buy tickets failed')
    }
  }, [ticketCount, smartWallet, userAddress, hasSmartWallet, lotteryData, hasInsufficientBalance, buyTickets, selectedCoords, isExisting, buildingId, onSuccess, refreshData, refreshPosition])

  const handleClaimWinnings = useCallback(async () => {
    if (!smartWallet) {
      setError('Smart wallet not found')
      return
    }

    setError(null)
    setSuccess(false)

    const result = await claimWinnings(smartWallet)

    if (result.success) {
      setSuccess(true)
      setSuccessType('claim')
      setTimeout(() => {
        refreshData()
        refreshPosition()
      }, 2000)
      setTimeout(() => { setSuccess(false); setSuccessType(null) }, 5000)
    } else {
      setError(result.error || 'Claim failed')
    }
  }, [smartWallet, claimWinnings, refreshData, refreshPosition])

  if (!hasSmartWallet) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-amber-900 translate-x-2 translate-y-2" />
        <div className="relative bg-slate-800 border-4 border-amber-500 p-6">
          <div className="flex items-center gap-2 mb-4">
            <h3 className="text-amber-400 text-sm" style={pixelFont}>MEGAPOT</h3>
          </div>
          <p className="text-slate-400 text-[10px] text-center py-8" style={pixelFont}>
            CREATE TOWN HALL FIRST
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-amber-900 translate-x-2 translate-y-2" />

      <div className="relative bg-slate-800 border-4 border-amber-500 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-amber-400 text-sm" style={pixelFont}>MEGAPOT</h3>
          {lotteryData?.allowPurchasing ? (
            <span className="px-2 py-0.5 bg-green-900 border border-green-600 text-green-400 text-[6px]" style={pixelFont}>
              LIVE
            </span>
          ) : (
            <span className="px-2 py-0.5 bg-red-900 border border-red-600 text-red-400 text-[6px]" style={pixelFont}>
              PAUSED
            </span>
          )}
        </div>

        {/* Divider */}
        <div className="flex gap-1 mb-4">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="w-2 h-1 bg-amber-800" />
          ))}
        </div>

        {/* Jackpot & Timer */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-900 border-2 border-amber-700 p-3 text-center">
            <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>JACKPOT</p>
            <p className="text-amber-400 text-[12px]" style={pixelFont}>
              {loadingData ? '...' : `$${(lotteryData?.jackpotAmount ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
            </p>
            <p className="text-slate-500 text-[5px] mt-1" style={pixelFont}>MPUSDC</p>
          </div>
          <div className="bg-slate-900 border-2 border-amber-700 p-3 text-center">
            <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>TIME LEFT</p>
            <p className={`text-[12px] ${(lotteryData?.timeRemaining ?? 0) <= 60 ? 'text-red-400 animate-pulse' : 'text-cyan-400'}`} style={pixelFont}>
              {loadingData ? '...' : formatTime(lotteryData?.timeRemaining ?? 0)}
            </p>
            <p className="text-slate-500 text-[5px] mt-1" style={pixelFont}>
              {(lotteryData?.roundDuration ?? 0) >= 3600
                ? `${Math.round((lotteryData?.roundDuration ?? 0) / 3600)}H ROUNDS`
                : `${Math.round((lotteryData?.roundDuration ?? 0) / 60)}M ROUNDS`
              }
            </p>
          </div>
        </div>

        {/* Ticket Price & Fee */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-900/50 border border-slate-700 p-2 text-center">
            <p className="text-slate-500 text-[5px]" style={pixelFont}>TICKET PRICE</p>
            <p className="text-white text-[9px]" style={pixelFont}>
              {lotteryData?.ticketPrice ?? '...'} MPUSDC
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-700 p-2 text-center">
            <p className="text-slate-500 text-[5px]" style={pixelFont}>FEE</p>
            <p className="text-white text-[9px]" style={pixelFont}>
              {lotteryData ? `${(lotteryData.feeBps / 100).toFixed(1)}%` : '...'}
            </p>
          </div>
        </div>

        {/* MPUSDC Balance */}
        <div className="bg-slate-900/50 border border-slate-700 p-3 mb-4">
          <div className="flex justify-between items-center">
            <p className="text-slate-500 text-[7px]" style={pixelFont}>MPUSDC BALANCE</p>
            <p className="text-cyan-400 text-[10px]" style={pixelFont}>
              {loadingPosition ? '...' : (position?.mpusdcBalance ?? 0).toFixed(2)}
            </p>
          </div>
          <button
            onClick={() => setShowMintInfo(!showMintInfo)}
            className="text-amber-500 text-[5px] mt-1 hover:text-amber-300"
            style={pixelFont}
          >
            {showMintInfo ? 'HIDE' : 'NEED MPUSDC?'}
          </button>
          {showMintInfo && (
            <div className="mt-2 bg-amber-900/20 border border-amber-700 p-2">
              <p className="text-amber-400 text-[5px]" style={pixelFont}>
                MPUSDC is a testnet token. Use the Vault to deposit or transfer MPUSDC to your Smart Wallet.
              </p>
            </div>
          )}
        </div>

        {hasInsufficientBalance && (
          <div className="mb-2 bg-red-900/30 border border-red-600 p-2 text-center animate-pulse">
            <p className="text-red-400 text-[6px]" style={pixelFont}>
              INSUFFICIENT MPUSDC
            </p>
          </div>
        )}

        {/* Ticket Input */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p className="text-slate-500 text-[8px]" style={pixelFont}>TICKETS</p>
            {position && lotteryData && lotteryData.ticketPrice > 0 && (
              <button
                onClick={() => {
                  const max = Math.floor(position.mpusdcBalance / lotteryData.ticketPrice)
                  setTicketCount(max > 0 ? max.toString() : '0')
                }}
                className="text-amber-400 text-[8px] hover:text-amber-300"
                style={pixelFont}
              >
                MAX
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="number"
              value={ticketCount}
              onChange={(e) => setTicketCount(e.target.value)}
              placeholder="0"
              min="1"
              step="1"
              className="w-full bg-slate-900 border-2 border-slate-700 p-3 pr-20 text-white text-sm focus:border-amber-500 focus:outline-none"
              style={pixelFont}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[8px]" style={pixelFont}>
              TICKETS
            </span>
          </div>
          {totalCost > 0 && (
            <p className="text-slate-500 text-[6px] mt-1" style={pixelFont}>
              TOTAL: {totalCost.toFixed(2)} MPUSDC
            </p>
          )}
        </div>

        {/* Error */}
        <ErrorPopup error={error} onClose={() => setError(null)} />

        {/* Success */}
        {success && (
          <div className="bg-green-900/30 border-2 border-green-600 p-3 mb-4">
            <p className="text-green-400 text-[8px] text-center" style={pixelFont}>
              {successType === 'buy' ? 'TICKETS PURCHASED!' : 'WINNINGS CLAIMED!'}
            </p>
          </div>
        )}

        {/* Buy Button */}
        <button
          onClick={handleBuyTickets}
          disabled={loading || !ticketCount || parseInt(ticketCount) <= 0 || hasInsufficientBalance || !lotteryData?.allowPurchasing}
          className="relative group w-full disabled:opacity-50 disabled:cursor-not-allowed mb-4"
        >
          <div className="bg-amber-900 absolute inset-0 translate-x-2 translate-y-2" />
          <div
            className={`relative px-6 py-4 border-4 text-white flex items-center justify-center gap-3 transition-transform ${
              hasInsufficientBalance
                ? 'bg-slate-700 border-slate-600'
                : 'bg-amber-600 border-amber-400'
            } ${!loading && !hasInsufficientBalance ? 'group-hover:-translate-y-1 group-active:translate-y-0' : ''}`}
          >
            {loadingBuy ? (
              <>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-white"
                      style={{ animation: 'pixelBounce 0.6s ease-in-out infinite', animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                <span className="text-xs" style={pixelFont}>PROCESSING...</span>
              </>
            ) : (
              <span className="text-xs" style={pixelFont}>
                {hasInsufficientBalance ? 'NOT ENOUGH MPUSDC' : (isExisting ? 'BUY MORE TICKETS' : 'BUY TICKETS')}
              </span>
            )}
          </div>
        </button>

        {/* Position Section */}
        {position && (position.ticketsPurchased > 0 || position.winningsClaimable > 0) && (
          <div className="pt-4 border-t-2 border-slate-700">
            <p className="text-slate-500 text-[8px] mb-3" style={pixelFont}>YOUR POSITION</p>

            <div className="grid grid-cols-2 gap-2 mb-3">
              <div className="bg-slate-900/50 border border-slate-700 p-2 text-center">
                <p className="text-slate-500 text-[5px]" style={pixelFont}>TICKETS</p>
                <p className="text-amber-400 text-[10px]" style={pixelFont}>
                  {position.ticketsPurchased}
                </p>
              </div>
              <div className="bg-slate-900/50 border border-slate-700 p-2 text-center">
                <p className="text-slate-500 text-[5px]" style={pixelFont}>CLAIMABLE</p>
                <p className={`text-[10px] ${position.winningsClaimable > 0 ? 'text-green-400' : 'text-slate-500'}`} style={pixelFont}>
                  {position.winningsClaimable > 0
                    ? `$${position.winningsClaimable.toFixed(2)}`
                    : '-'
                  }
                </p>
              </div>
            </div>

            {/* Claim Button */}
            {position.winningsClaimable > 0 && (
              <button
                onClick={handleClaimWinnings}
                disabled={loadingClaim}
                className="relative group w-full disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="bg-green-900 absolute inset-0 translate-x-2 translate-y-2" />
                <div className="relative px-6 py-3 bg-green-600 border-4 border-green-400 text-white flex items-center justify-center gap-3 transition-transform group-hover:-translate-y-1 group-active:translate-y-0">
                  {loadingClaim ? (
                    <span className="text-xs" style={pixelFont}>CLAIMING...</span>
                  ) : (
                    <span className="text-xs" style={pixelFont}>
                      CLAIM ${position.winningsClaimable.toFixed(2)}
                    </span>
                  )}
                </div>
              </button>
            )}
          </div>
        )}

        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-amber-400 -translate-x-1 -translate-y-1" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-amber-400 translate-x-1 -translate-y-1" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-amber-400 -translate-x-1 translate-y-1" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-amber-400 translate-x-1 translate-y-1" />
      </div>

      <style jsx>{`
        @keyframes pixelBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}
