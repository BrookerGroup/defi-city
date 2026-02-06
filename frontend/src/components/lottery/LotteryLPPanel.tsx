'use client'

import { useState, useCallback, useEffect } from 'react'
import { useMegapotLPPosition } from '@/hooks/useMegapotLPPosition'
import { useMegapotLPDeposit } from '@/hooks/useMegapotLPDeposit'
import { useMegapotLPWithdraw } from '@/hooks/useMegapotLPWithdraw'
import { ErrorPopup } from '@/components/ui/ErrorPopup'

interface LotteryLPPanelProps {
  smartWallet: string | null
  hasSmartWallet: boolean
}

const pixelFont = { fontFamily: '"Press Start 2P", monospace' } as const

type TabType = 'position' | 'deposit' | 'withdraw'

export function LotteryLPPanel({ smartWallet, hasSmartWallet }: LotteryLPPanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('position')
  const [depositAmount, setDepositAmount] = useState('')
  const [riskPercentage, setRiskPercentage] = useState(50)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

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

    setError(null)
    setSuccess(null)

    const result = await deposit(smartWallet, amount, riskPercentage)
    if (result.success) {
      setSuccess('Deposit successful!')
      setDepositAmount('')
      setTimeout(() => {
        refresh()
        setSuccess(null)
      }, 3000)
    } else {
      setError(result.error || 'Deposit failed')
    }
  }, [smartWallet, depositAmount, riskPercentage, deposit, refresh, MIN_DEPOSIT_USDC])

  const handleInitiateWithdraw = useCallback(async () => {
    if (!smartWallet) return
    setError(null)
    setSuccess(null)

    const result = await initiateWithdraw(smartWallet)
    if (result.success) {
      setSuccess('Withdrawal initiated. Wait for next jackpot to complete.')
      setTimeout(() => {
        refresh()
        setSuccess(null)
      }, 3000)
    } else {
      setError(result.error || 'Failed to initiate withdrawal')
    }
  }, [smartWallet, initiateWithdraw, refresh])

  const handleCompleteWithdraw = useCallback(async () => {
    if (!smartWallet) return
    setError(null)
    setSuccess(null)

    const result = await completeWithdraw(smartWallet)
    if (result.success) {
      setSuccess('Withdrawal complete!')
      setTimeout(() => {
        refresh()
        setSuccess(null)
      }, 3000)
    } else {
      setError(result.error || 'Failed to complete withdrawal')
    }
  }, [smartWallet, completeWithdraw, refresh])

  const handleAdjustRisk = useCallback(async (newRisk: number) => {
    if (!smartWallet) return
    setError(null)
    setSuccess(null)

    const result = await adjustRisk(smartWallet, newRisk)
    if (result.success) {
      setSuccess(`Risk adjusted to ${newRisk}%`)
      setTimeout(() => {
        refresh()
        setSuccess(null)
      }, 3000)
    } else {
      setError(result.error || 'Failed to adjust risk')
    }
  }, [smartWallet, adjustRisk, refresh])

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

        {/* Tabs */}
        <div className="flex bg-slate-900 p-0.5 border border-slate-700 mb-4">
          {(['position', 'deposit', 'withdraw'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 px-2 py-1 text-[7px] ${
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
            {/* Your Position */}
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-slate-900 border-2 border-purple-700 p-3 text-center">
                <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>PRINCIPAL</p>
                <p className="text-purple-400 text-[12px]" style={pixelFont}>
                  {loadingPosition ? '...' : `$${(position?.principal ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </p>
              </div>
              <div className="bg-slate-900 border-2 border-purple-700 p-3 text-center">
                <p className="text-slate-500 text-[6px] mb-1" style={pixelFont}>AT RISK</p>
                <p className="text-cyan-400 text-[12px]" style={pixelFont}>
                  {loadingPosition ? '...' : `$${(position?.stake ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="bg-slate-900/50 border border-slate-700 p-2 text-center">
                <p className="text-slate-500 text-[5px]" style={pixelFont}>RISK %</p>
                <p className="text-white text-[10px]" style={pixelFont}>
                  {position?.riskPercentage ?? 0}%
                </p>
              </div>
              <div className="bg-slate-900/50 border border-slate-700 p-2 text-center">
                <p className="text-slate-500 text-[5px]" style={pixelFont}>YOUR SHARE</p>
                <p className="text-white text-[10px]" style={pixelFont}>
                  {(poolStats?.userShare ?? 0).toFixed(2)}%
                </p>
              </div>
            </div>

            {/* Pool Stats */}
            <div className="bg-slate-900/50 border border-slate-700 p-3 mb-4">
              <p className="text-slate-500 text-[7px] mb-2" style={pixelFont}>POOL STATS</p>
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
                    className="h-full bg-purple-500"
                    style={{
                      width: `${poolStats?.lpPoolCap ? Math.min((poolStats.lpPoolTotal / poolStats.lpPoolCap) * 100, 100) : 0}%`,
                    }}
                  />
                </div>
              </div>
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
          </>
        )}

        {/* Deposit Tab */}
        {activeTab === 'deposit' && (
          <>
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
                  USDC
                </span>
              </div>
              <p className="text-slate-500 text-[6px] mt-1" style={pixelFont}>
                MIN: {MIN_DEPOSIT_USDC} USDC
              </p>
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

            <button
              onClick={handleDeposit}
              disabled={loading || !depositAmount || parseFloat(depositAmount) < MIN_DEPOSIT_USDC}
              className="relative group w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="bg-purple-900 absolute inset-0 translate-x-2 translate-y-2" />
              <div className="relative px-6 py-4 bg-purple-600 border-4 border-purple-400 text-white flex items-center justify-center gap-3 transition-transform group-hover:-translate-y-1 group-active:translate-y-0">
                {loadingDeposit ? (
                  <span className="text-xs" style={pixelFont}>DEPOSITING...</span>
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
                        <span className="text-xs" style={pixelFont}>
                          {loadingWithdraw ? 'PROCESSING...' : 'INITIATE WITHDRAWAL'}
                        </span>
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
                        <span className="text-xs" style={pixelFont}>
                          {loadingWithdraw ? 'WITHDRAWING...' : 'COMPLETE WITHDRAWAL'}
                        </span>
                      </div>
                    </button>
                  </>
                )}

                {/* Adjust Risk Section */}
                {canInitiateWithdraw && (
                  <div className="mt-6 pt-4 border-t border-slate-700">
                    <p className="text-slate-500 text-[8px] mb-2" style={pixelFont}>ADJUST RISK</p>
                    <div className="flex gap-2">
                      {[25, 50, 75, 100].map((risk) => (
                        <button
                          key={risk}
                          onClick={() => handleAdjustRisk(risk)}
                          disabled={loading || position.riskPercentage === risk}
                          className={`flex-1 py-2 text-[8px] border-2 ${
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
