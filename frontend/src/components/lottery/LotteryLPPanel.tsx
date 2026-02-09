'use client'

import { useState, useCallback, useEffect } from 'react'
import { useMegapotLPPosition } from '@/hooks/useMegapotLPPosition'
import { useMegapotLPDeposit } from '@/hooks/useMegapotLPDeposit'
import { useMegapotLPWithdraw } from '@/hooks/useMegapotLPWithdraw'
import { ErrorPopup } from '@/components/ui/ErrorPopup'

interface LotteryLPPanelProps {
  smartWallet: string | null
  hasSmartWallet: boolean
  mpusdcBalance?: string
  userAddress?: string
  selectedCoords?: { x: number; y: number } | null
  onSuccess?: () => void
}

const pixelFont = { fontFamily: '"Press Start 2P", monospace' } as const

function PixelSpinner({ color = 'text-white' }: { color?: string }) {
  return (
    <span className={`inline-flex gap-0.5 ${color}`}>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="inline-block w-1.5 h-1.5 bg-current"
          style={{ animation: 'pixelBounce 0.6s ease-in-out infinite', animationDelay: `${i * 0.15}s` }}
        />
      ))}
    </span>
  )
}

function SkeletonBlock({ className = '' }: { className?: string }) {
  return <div className={`bg-slate-700 animate-pulse ${className}`} />
}

type TabType = 'position' | 'deposit' | 'withdraw'

const EXPLORER_URL = 'https://sepolia.basescan.org'

interface TxRecord {
  action: 'deposit' | 'withdraw_init' | 'withdraw_complete' | 'adjust_risk'
  amount?: string
  txHash: string
  timestamp: number
}

export function LotteryLPPanel({ smartWallet, hasSmartWallet, mpusdcBalance, userAddress, selectedCoords, onSuccess }: LotteryLPPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('position')
  const [depositAmount, setDepositAmount] = useState('')
  const [riskPercentage, setRiskPercentage] = useState(50)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [txHistory, setTxHistory] = useState<TxRecord[]>([])

  const addTx = useCallback((record: TxRecord) => {
    setTxHistory(prev => [record, ...prev].slice(0, 10))
  }, [])

  const { position, poolStats, loading: loadingPosition, refresh } = useMegapotLPPosition(smartWallet)
  const { deposit, loading: loadingDeposit, MIN_DEPOSIT_USDC } = useMegapotLPDeposit()
  const { initiateWithdraw, completeWithdraw, adjustRisk, loading: loadingWithdraw } = useMegapotLPWithdraw()

  const loading = loadingDeposit || loadingWithdraw

  // Determine withdrawal state
  const canInitiateWithdraw = position && position.active && position.riskPercentage > 0
  const isPendingWithdraw = position && position.active && position.riskPercentage === 0
  const canCompleteWithdraw = position && !position.active && position.principal > 0

  const handleDeposit = useCallback(async () => {
    if (!smartWallet) return
    const amount = parseFloat(depositAmount)
    if (isNaN(amount) || amount < MIN_DEPOSIT_USDC) {
      setError(`Minimum deposit is ${MIN_DEPOSIT_USDC} USDC`)
      return
    }

    // Client-side balance check
    if (mpusdcBalance && amount > parseFloat(mpusdcBalance)) {
      setError(`Insufficient MUSDC balance. Have ${parseFloat(mpusdcBalance).toFixed(2)}, need ${amount}`)
      return
    }

    // Client-side pool cap check
    if (poolStats && poolStats.lpPoolCap > 0 && poolStats.lpPoolTotal + amount > poolStats.lpPoolCap) {
      setError(`LP pool cap reached. Available capacity: $${(poolStats.lpPoolCap - poolStats.lpPoolTotal).toFixed(2)}`)
      return
    }

    setError(null)
    setSuccess(null)

    const result = await deposit(
      smartWallet,
      amount,
      riskPercentage,
      userAddress,
      selectedCoords ? selectedCoords.x : undefined,
      selectedCoords ? selectedCoords.y : undefined,
    )
    if (result.success) {
      if (result.txHash) addTx({ action: 'deposit', amount: `${amount} MUSDC`, txHash: result.txHash, timestamp: Date.now() })
      setSuccess('Deposit successful!')
      setDepositAmount('')
      setTimeout(() => {
        refresh()
        setSuccess(null)
        onSuccess?.()
      }, 3000)
    } else {
      setError(result.error || 'Deposit failed')
    }
  }, [smartWallet, depositAmount, riskPercentage, deposit, refresh, MIN_DEPOSIT_USDC, userAddress, selectedCoords, onSuccess, mpusdcBalance, poolStats, addTx])

  const handleInitiateWithdraw = useCallback(async () => {
    if (!smartWallet) return
    setError(null)
    setSuccess(null)

    const result = await initiateWithdraw(smartWallet)
    if (result.success) {
      if (result.txHash) addTx({ action: 'withdraw_init', txHash: result.txHash, timestamp: Date.now() })
      setSuccess('Withdrawal initiated. Wait for next jackpot to complete.')
      setTimeout(() => {
        refresh()
        setSuccess(null)
      }, 3000)
    } else {
      setError(result.error || 'Failed to initiate withdrawal')
    }
  }, [smartWallet, initiateWithdraw, refresh, addTx])

  const handleCompleteWithdraw = useCallback(async () => {
    if (!smartWallet) return
    setError(null)
    setSuccess(null)

    const result = await completeWithdraw(smartWallet)
    if (result.success) {
      if (result.txHash) addTx({ action: 'withdraw_complete', amount: `$${position?.principal.toFixed(2)}`, txHash: result.txHash, timestamp: Date.now() })
      setSuccess('Withdrawal complete!')
      setTimeout(() => {
        refresh()
        setSuccess(null)
      }, 3000)
    } else {
      setError(result.error || 'Failed to complete withdrawal')
    }
  }, [smartWallet, completeWithdraw, refresh, addTx, position])

  const handleAdjustRisk = useCallback(async (newRisk: number) => {
    if (!smartWallet) return
    setError(null)
    setSuccess(null)

    const result = await adjustRisk(smartWallet, newRisk)
    if (result.success) {
      if (result.txHash) addTx({ action: 'adjust_risk', amount: `${newRisk}%`, txHash: result.txHash, timestamp: Date.now() })
      setSuccess(`Risk adjusted to ${newRisk}%`)
      setTimeout(() => {
        refresh()
        setSuccess(null)
      }, 3000)
    } else {
      setError(result.error || 'Failed to adjust risk')
    }
  }, [smartWallet, adjustRisk, refresh, addTx])

  // Refresh position periodically
  useEffect(() => {
    const interval = setInterval(refresh, 30000)
    return () => clearInterval(interval)
  }, [refresh])

  if (!hasSmartWallet) {
    return (
      <div className="relative">
        <div className="absolute inset-0 bg-purple-900 translate-x-2 translate-y-2" />
        <div className="relative bg-slate-800 border-4 border-purple-500 p-6">
          <h3 className="text-purple-400 text-sm mb-4" style={pixelFont}>LP PROVIDER</h3>
          <p className="text-slate-400 text-[10px] text-center py-8" style={pixelFont}>
            CREATE TOWN HALL FIRST
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      <div className="absolute inset-0 bg-purple-900 translate-x-2 translate-y-2" />

      <div className="relative bg-slate-800 border-4 border-purple-500 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-purple-400 text-sm" style={pixelFont}>LP PROVIDER</h3>
          {position?.active && (
            <span className="px-2 py-0.5 bg-green-900 border border-green-600 text-green-400 text-[6px]" style={pixelFont}>
              ACTIVE
            </span>
          )}
        </div>

        {/* Position Summary - always visible when active */}
        {position && position.principal > 0 && (
          <div className="bg-slate-900 border-2 border-purple-700 p-3 mb-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-slate-500 text-[5px]" style={pixelFont}>DEPOSITED</p>
                {loadingPosition ? (
                  <SkeletonBlock className="h-3 w-16 mx-auto mt-1 rounded-sm" />
                ) : (
                  <p className="text-purple-400 text-[10px]" style={pixelFont}>
                    ${position.principal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              <div>
                <p className="text-slate-500 text-[5px]" style={pixelFont}>AT RISK</p>
                {loadingPosition ? (
                  <SkeletonBlock className="h-3 w-16 mx-auto mt-1 rounded-sm" />
                ) : (
                  <p className="text-cyan-400 text-[10px]" style={pixelFont}>
                    ${position.stake.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              <div>
                <p className="text-slate-500 text-[5px]" style={pixelFont}>POOL SHARE</p>
                {loadingPosition ? (
                  <SkeletonBlock className="h-3 w-12 mx-auto mt-1 rounded-sm" />
                ) : (
                  <p className="text-amber-400 text-[10px]" style={pixelFont}>
                    {(poolStats?.userShare ?? 0).toFixed(2)}%
                  </p>
                )}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-center gap-2 flex-wrap">
              <span className="text-slate-500 text-[5px]" style={pixelFont}>RISK: {position.riskPercentage}%</span>
              <span className="text-slate-600 hidden sm:inline">|</span>
              <span className="text-slate-500 text-[5px]" style={pixelFont}>
                EARNING 20-30% FEES
              </span>
              {position.active && (
                <>
                  <span className="text-slate-600 hidden sm:inline">|</span>
                  <span className="text-green-400 text-[5px]" style={pixelFont}>ACTIVE</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex bg-slate-900 p-0.5 border border-slate-700 mb-4">
          {(['position', 'deposit', 'withdraw'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-2 py-2 min-h-[36px] text-[7px] ${
                activeTab === tab ? 'bg-purple-600 text-white' : 'text-slate-500'
              }`}
              style={pixelFont}
            >
              {tab.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="flex gap-1 mb-4">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="w-2 h-1 bg-purple-800" />
          ))}
        </div>

        {/* Position Tab */}
        {activeTab === 'position' && (
          <>
            {/* MUSDC Wallet Balance */}
            <div className="bg-slate-900/50 border border-slate-700 p-2 mb-4 flex justify-between items-center">
              <span className="text-slate-500 text-[6px]" style={pixelFont}>MUSDC WALLET</span>
              <span className="text-purple-400 text-[10px]" style={pixelFont}>
                {mpusdcBalance ? parseFloat(mpusdcBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'} MUSDC
              </span>
            </div>

            {/* Your Position */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-slate-900 border-2 border-purple-700 p-3 text-center">
                <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>PRINCIPAL</p>
                {loadingPosition ? (
                  <SkeletonBlock className="h-4 w-20 mx-auto mt-1 rounded-sm" />
                ) : (
                  <p className="text-purple-400 text-[12px]" style={pixelFont}>
                    ${(position?.principal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
              <div className="bg-slate-900 border-2 border-purple-700 p-3 text-center">
                <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>AT RISK</p>
                {loadingPosition ? (
                  <SkeletonBlock className="h-4 w-20 mx-auto mt-1 rounded-sm" />
                ) : (
                  <p className="text-cyan-400 text-[12px]" style={pixelFont}>
                    ${(position?.stake ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-slate-900/50 border border-slate-700 p-2 text-center">
                <p className="text-slate-500 text-[5px]" style={pixelFont}>RISK %</p>
                {loadingPosition ? (
                  <SkeletonBlock className="h-3 w-10 mx-auto mt-1 rounded-sm" />
                ) : (
                  <p className="text-white text-[10px]" style={pixelFont}>
                    {position?.riskPercentage ?? 0}%
                  </p>
                )}
              </div>
              <div className="bg-slate-900/50 border border-slate-700 p-2 text-center">
                <p className="text-slate-500 text-[5px]" style={pixelFont}>YOUR SHARE</p>
                {loadingPosition ? (
                  <SkeletonBlock className="h-3 w-10 mx-auto mt-1 rounded-sm" />
                ) : (
                  <p className="text-white text-[10px]" style={pixelFont}>
                    {(poolStats?.userShare ?? 0).toFixed(2)}%
                  </p>
                )}
              </div>
            </div>

            {/* Pool Stats */}
            <div className="bg-slate-900/50 border border-slate-700 p-3 mb-4">
              <p className="text-slate-500 text-[7px] mb-2" style={pixelFont}>POOL STATS</p>
              {loadingPosition ? (
                <div className="space-y-2">
                  <div className="flex justify-between"><SkeletonBlock className="h-2.5 w-16 rounded-sm" /><SkeletonBlock className="h-2.5 w-20 rounded-sm" /></div>
                  <div className="flex justify-between"><SkeletonBlock className="h-2.5 w-14 rounded-sm" /><SkeletonBlock className="h-2.5 w-20 rounded-sm" /></div>
                  <SkeletonBlock className="h-2 w-full mt-2 rounded-full" />
                </div>
              ) : (
                <>
                  <div className="flex justify-between text-[8px]">
                    <span className="text-slate-400" style={pixelFont}>Total Pool:</span>
                    <span className="text-white" style={pixelFont}>
                      ${(poolStats?.lpPoolTotal ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-[8px]">
                    <span className="text-slate-400" style={pixelFont}>Pool Cap:</span>
                    <span className="text-white" style={pixelFont}>
                      ${(poolStats?.lpPoolCap ?? 0).toLocaleString()}
                    </span>
                  </div>
                  <div className="mt-2">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-purple-500 transition-all duration-500"
                        style={{
                          width: `${poolStats?.lpPoolCap ? Math.min((poolStats.lpPoolTotal / poolStats.lpPoolCap) * 100, 100) : 0}%`,
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Fee Info */}
            <div className="bg-purple-900/20 border border-purple-700 p-2 text-center">
              <p className="text-purple-400 text-[6px]" style={pixelFont}>
                EARN 20-30% OF TICKET FEES
              </p>
              <p className="text-slate-500 text-[5px] mt-1" style={pixelFont}>
                ~107% TARGET APY
              </p>
            </div>

            {/* Transaction History */}
            {txHistory.length > 0 && (
              <div className="mt-4">
                <p className="text-slate-500 text-[7px] mb-2" style={pixelFont}>RECENT TRANSACTIONS</p>
                <div className="space-y-1.5 max-h-32 overflow-y-auto">
                  {txHistory.map((tx, i) => {
                    const actionLabels: Record<string, { label: string; color: string }> = {
                      deposit: { label: 'DEPOSIT', color: 'text-purple-400' },
                      withdraw_init: { label: 'WITHDRAW INIT', color: 'text-yellow-400' },
                      withdraw_complete: { label: 'WITHDRAW', color: 'text-green-400' },
                      adjust_risk: { label: 'RISK ADJ', color: 'text-cyan-400' },
                    }
                    const { label, color } = actionLabels[tx.action] || { label: tx.action, color: 'text-slate-400' }
                    const time = new Date(tx.timestamp)
                    const timeStr = `${time.getHours().toString().padStart(2, '0')}:${time.getMinutes().toString().padStart(2, '0')}`

                    return (
                      <div key={i} className="bg-slate-900/50 border border-slate-700 px-2 py-1.5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className={`text-[6px] ${color}`} style={pixelFont}>{label}</span>
                          {tx.amount && <span className="text-slate-400 text-[6px]" style={pixelFont}>{tx.amount}</span>}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-slate-600 text-[5px]" style={pixelFont}>{timeStr}</span>
                          <a
                            href={`${EXPLORER_URL}/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 text-[5px] hover:text-blue-300"
                            style={pixelFont}
                          >
                            {tx.txHash.slice(0, 6)}...{tx.txHash.slice(-4)}
                          </a>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Deposit Tab */}
        {activeTab === 'deposit' && (
          <>
            {/* MPUSDC Balance */}
            <div className="bg-slate-900 border-2 border-purple-700 p-3 mb-4 text-center">
              <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>MUSDC BALANCE</p>
              <p className="text-purple-400 text-[14px]" style={pixelFont}>
                {mpusdcBalance ? parseFloat(mpusdcBalance).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
              </p>
              <p className="text-slate-500 text-[5px] mt-1" style={pixelFont}>SMART WALLET</p>
            </div>

            <div className="mb-4">
              <p className="text-slate-500 text-[8px] mb-2" style={pixelFont}>DEPOSIT AMOUNT</p>
              <div className="relative">
                <input
                  type="number"
                  value={depositAmount}
                  onChange={(e) => setDepositAmount(e.target.value)}
                  placeholder={`Min ${MIN_DEPOSIT_USDC}`}
                  min={MIN_DEPOSIT_USDC}
                  className="w-full bg-slate-900 border-2 border-slate-700 p-3 pr-16 text-white text-sm focus:border-purple-500 focus:outline-none"
                  style={pixelFont}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[8px]" style={pixelFont}>
                  MUSDC
                </span>
              </div>
              <div className="flex justify-between mt-1">
                <p className="text-slate-500 text-[6px]" style={pixelFont}>
                  MIN: {MIN_DEPOSIT_USDC} MUSDC
                </p>
                {mpusdcBalance && parseFloat(mpusdcBalance) > 0 && (
                  <button
                    onClick={() => setDepositAmount(mpusdcBalance)}
                    className="text-purple-400 text-[6px] hover:text-purple-300"
                    style={pixelFont}
                  >
                    MAX
                  </button>
                )}
              </div>
              {/* Inline validation warnings */}
              {depositAmount && parseFloat(depositAmount) > 0 && (
                <>
                  {parseFloat(depositAmount) < MIN_DEPOSIT_USDC && (
                    <p className="text-yellow-400 text-[6px] mt-1" style={pixelFont}>
                      BELOW MINIMUM ({MIN_DEPOSIT_USDC} MUSDC)
                    </p>
                  )}
                  {mpusdcBalance && parseFloat(depositAmount) > parseFloat(mpusdcBalance) && (
                    <p className="text-red-400 text-[6px] mt-1" style={pixelFont}>
                      EXCEEDS BALANCE ({parseFloat(mpusdcBalance).toFixed(2)} MUSDC)
                    </p>
                  )}
                  {poolStats && poolStats.lpPoolCap > 0 && poolStats.lpPoolTotal + parseFloat(depositAmount) > poolStats.lpPoolCap && (
                    <p className="text-red-400 text-[6px] mt-1" style={pixelFont}>
                      EXCEEDS POOL CAP (AVAIL: ${(poolStats.lpPoolCap - poolStats.lpPoolTotal).toFixed(2)})
                    </p>
                  )}
                </>
              )}
            </div>

            <div className="mb-4">
              <div className="flex justify-between mb-2">
                <p className="text-slate-500 text-[8px]" style={pixelFont}>RISK PERCENTAGE</p>
                <p className="text-purple-400 text-[8px]" style={pixelFont}>{riskPercentage}%</p>
              </div>
              <input
                type="range"
                min="1"
                max="100"
                value={riskPercentage}
                onChange={(e) => setRiskPercentage(parseInt(e.target.value))}
                className="w-full accent-purple-500"
              />
              <div className="flex justify-between text-[6px] text-slate-500 mt-1">
                <span style={pixelFont}>1% (SAFE)</span>
                <span style={pixelFont}>100% (MAX YIELD)</span>
              </div>
            </div>

            <div className="bg-slate-900/50 border border-slate-700 p-3 mb-4">
              <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>AT RISK AMOUNT</p>
              <p className="text-cyan-400 text-[10px]" style={pixelFont}>
                ${(parseFloat(depositAmount || '0') * riskPercentage / 100).toFixed(2)} USDC
              </p>
              <p className="text-slate-500 text-[5px] mt-1" style={pixelFont}>
                This amount guarantees the jackpot
              </p>
            </div>

            {/* Pool near-full warning */}
            {poolStats && poolStats.lpPoolCap > 0 && (poolStats.lpPoolTotal / poolStats.lpPoolCap) >= 0.9 && (
              <div className="bg-yellow-900/20 border border-yellow-700 p-2 mb-4">
                <p className="text-yellow-400 text-[6px]" style={pixelFont}>
                  POOL {Math.round((poolStats.lpPoolTotal / poolStats.lpPoolCap) * 100)}% FULL — REMAINING: ${(poolStats.lpPoolCap - poolStats.lpPoolTotal).toLocaleString(undefined, { maximumFractionDigits: 2 })}
                </p>
              </div>
            )}

            <button
              onClick={handleDeposit}
              disabled={loading || !depositAmount || parseFloat(depositAmount) < MIN_DEPOSIT_USDC}
              className="relative group w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="bg-purple-900 absolute inset-0 translate-x-2 translate-y-2" />
              <div className="relative px-6 py-4 bg-purple-600 border-4 border-purple-400 text-white flex items-center justify-center gap-3 transition-transform group-hover:-translate-y-1 group-active:translate-y-0">
                {loadingDeposit ? (
                  <span className="text-xs flex items-center gap-2" style={pixelFont}>
                    DEPOSITING <PixelSpinner color="text-purple-200" />
                  </span>
                ) : (
                  <span className="text-xs" style={pixelFont}>DEPOSIT</span>
                )}
              </div>
            </button>
          </>
        )}

        {/* Withdraw Tab */}
        {activeTab === 'withdraw' && (
          <>
            {position && position.principal > 0 ? (
              <>
                <div className="bg-slate-900 border-2 border-purple-700 p-3 mb-4 text-center">
                  <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>YOUR POSITION</p>
                  <p className="text-purple-400 text-[14px]" style={pixelFont}>
                    ${position.principal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </p>
                  <p className="text-slate-500 text-[5px] mt-1" style={pixelFont}>
                    RISK: {position.riskPercentage}%
                  </p>
                </div>

                {/* Withdrawal Status */}
                {canInitiateWithdraw && (
                  <>
                    <div className="bg-yellow-900/20 border border-yellow-700 p-3 mb-4">
                      <p className="text-yellow-400 text-[7px]" style={pixelFont}>
                        STEP 1: Initiate withdrawal
                      </p>
                      <p className="text-slate-500 text-[5px] mt-1" style={pixelFont}>
                        Sets risk to 0%. After next jackpot, you can complete withdrawal.
                      </p>
                    </div>
                    <button
                      onClick={handleInitiateWithdraw}
                      disabled={loading}
                      className="relative group w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="bg-yellow-900 absolute inset-0 translate-x-2 translate-y-2" />
                      <div className="relative px-6 py-4 bg-yellow-600 border-4 border-yellow-400 text-white flex items-center justify-center">
                        {loadingWithdraw ? (
                          <span className="text-xs flex items-center gap-2" style={pixelFont}>
                            PROCESSING <PixelSpinner color="text-yellow-200" />
                          </span>
                        ) : (
                          <span className="text-xs" style={pixelFont}>INITIATE WITHDRAWAL</span>
                        )}
                      </div>
                    </button>
                  </>
                )}

                {isPendingWithdraw && (
                  <div className="bg-cyan-900/20 border border-cyan-700 p-3 mb-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex gap-1">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-2 h-2 bg-cyan-400"
                            style={{ animation: 'pixelBounce 0.6s ease-in-out infinite', animationDelay: `${i * 0.15}s` }}
                          />
                        ))}
                      </div>
                      <p className="text-cyan-400 text-[7px]" style={pixelFont}>
                        WAITING FOR JACKPOT...
                      </p>
                    </div>
                    <p className="text-slate-500 text-[5px]" style={pixelFont}>
                      Your withdrawal will be ready after the next jackpot drawing.
                    </p>
                  </div>
                )}

                {canCompleteWithdraw && (
                  <>
                    <div className="bg-green-900/20 border border-green-700 p-3 mb-4">
                      <p className="text-green-400 text-[7px]" style={pixelFont}>
                        STEP 2: Complete withdrawal
                      </p>
                      <p className="text-slate-500 text-[5px] mt-1" style={pixelFont}>
                        Your funds are ready to withdraw!
                      </p>
                    </div>
                    <button
                      onClick={handleCompleteWithdraw}
                      disabled={loading}
                      className="relative group w-full disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <div className="bg-green-900 absolute inset-0 translate-x-2 translate-y-2" />
                      <div className="relative px-6 py-4 bg-green-600 border-4 border-green-400 text-white flex items-center justify-center">
                        {loadingWithdraw ? (
                          <span className="text-xs flex items-center gap-2" style={pixelFont}>
                            WITHDRAWING <PixelSpinner color="text-green-200" />
                          </span>
                        ) : (
                          <span className="text-xs" style={pixelFont}>COMPLETE WITHDRAWAL</span>
                        )}
                      </div>
                    </button>
                  </>
                )}

                {/* Adjust Risk Section */}
                {canInitiateWithdraw && (
                  <div className="mt-6 pt-4 border-t border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-slate-500 text-[8px]" style={pixelFont}>ADJUST RISK</p>
                      {loadingWithdraw && <PixelSpinner color="text-purple-400" />}
                    </div>
                    <div className="grid grid-cols-4 gap-2">
                      {[25, 50, 75, 100].map((risk) => (
                        <button
                          key={risk}
                          onClick={() => handleAdjustRisk(risk)}
                          disabled={loading || position.riskPercentage === risk}
                          className={`py-2 min-h-[36px] text-[8px] border-2 ${
                            position.riskPercentage === risk
                              ? 'bg-purple-600 border-purple-400 text-white'
                              : 'bg-slate-800 border-slate-600 text-slate-400 hover:border-purple-400'
                          } disabled:opacity-50`}
                          style={pixelFont}
                        >
                          {risk}%
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-slate-500 text-[10px]" style={pixelFont}>
                  NO POSITION TO WITHDRAW
                </p>
                <button
                  onClick={() => setActiveTab('deposit')}
                  className="mt-4 text-purple-400 text-[8px] hover:text-purple-300"
                  style={pixelFont}
                >
                  DEPOSIT TO START
                </button>
              </div>
            )}
          </>
        )}

        {/* Error/Success Messages */}
        <div className="mt-4">
          <ErrorPopup error={error} onClose={() => setError(null)} />
          {success && (
            <div className="bg-green-900/30 border-2 border-green-600 p-3">
              <p className="text-green-400 text-[8px] text-center" style={pixelFont}>
                {success}
              </p>
            </div>
          )}
        </div>

        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-purple-400 -translate-x-1 -translate-y-1" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-purple-400 translate-x-1 -translate-y-1" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-purple-400 -translate-x-1 translate-y-1" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-purple-400 translate-x-1 translate-y-1" />
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
