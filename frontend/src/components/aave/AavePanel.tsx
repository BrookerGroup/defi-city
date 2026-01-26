'use client'

import { useState, useCallback, useEffect } from 'react'
import { useAaveSupply, useAavePosition } from '@/hooks'
import { ASSET_PRICES, AAVE_MARKET_DATA } from '@/config/aave'

type TabType = 'supply' | 'borrow'

interface AavePanelProps {
  smartWallet: string | null
  hasSmartWallet: boolean
  userAddress?: string
  onSuccess?: () => void
}

// Initial empty position
const EMPTY_POSITION: any = {
  supplies: [],
  borrows: [],
  totalSuppliedUSD: 0,
  totalBorrowedUSD: 0,
  netWorthUSD: 0,
  healthFactor: Infinity,
  netAPY: 0,
}

// Calculate health factor
function calculateHealthFactor(
  supplies: any[],
  borrows: any[]
): number {
  if (borrows.length === 0) return Infinity

  let totalCollateralETH = 0
  let totalBorrowETH = 0

  for (const supply of supplies) {
    const assetInfo = AAVE_MARKET_DATA.assets[supply.asset]
    totalCollateralETH += supply.amountUSD * assetInfo.liquidationThreshold
  }

  for (const borrow of borrows) {
    totalBorrowETH += borrow.amountUSD
  }

  if (totalBorrowETH === 0) return Infinity
  return totalCollateralETH / totalBorrowETH
}

export function AavePanel({ smartWallet, hasSmartWallet, userAddress, onSuccess }: AavePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('supply')
  const [selectedAsset, setSelectedAsset] = useState<string>('USDC')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [position, setPosition] = useState<any>(EMPTY_POSITION)

  // Use the hooks
  const { supply: realSupply, loading } = useAaveSupply()
  const { position: realPosition, loading: loadingPosition, refresh: refreshPosition } = useAavePosition(smartWallet)

  // Sync real position to local state
  useEffect(() => {
    if (realPosition) {
      setPosition(realPosition)
    }
  }, [realPosition])

  const assets: string[] = ['USDC']
  const marketData = AAVE_MARKET_DATA
  const currentAssetInfo = marketData.assets[selectedAsset]

  // Get max borrowable amount
  const getMaxBorrow = useCallback((asset: string): number => {
    let maxBorrowUSD = 0
    for (const supply of position.supplies) {
      const assetInfo = AAVE_MARKET_DATA.assets[supply.asset]
      maxBorrowUSD += supply.amountUSD * assetInfo.ltv
    }

    const currentBorrowUSD = position.borrows.reduce((sum: any, b: any) => sum + b.amountUSD, 0)
    const availableBorrowUSD = maxBorrowUSD - currentBorrowUSD

    return availableBorrowUSD / ASSET_PRICES[asset]
  }, [position])

  // Preview health factor
  const previewHealthFactor = useCallback(
    (
      supplyAsset: string | null,
      supplyAmount: number,
      borrowAsset: string | null,
      borrowAmount: number
    ): number => {
      const newSupplies = [...position.supplies]
      const newBorrows = [...position.borrows]

      if (supplyAsset && supplyAmount > 0) {
        const existingIndex = newSupplies.findIndex((s) => s.asset === supplyAsset)
        const amountUSD = supplyAmount * ASSET_PRICES[supplyAsset]

        if (existingIndex >= 0) {
          newSupplies[existingIndex] = {
            ...newSupplies[existingIndex],
            amount: newSupplies[existingIndex].amount + supplyAmount,
            amountUSD: newSupplies[existingIndex].amountUSD + amountUSD,
          }
        } else {
          newSupplies.push({
            asset: supplyAsset,
            amount: supplyAmount,
            amountUSD,
            apy: AAVE_MARKET_DATA.assets[supplyAsset].supplyAPY,
          })
        }
      }

      if (borrowAsset && borrowAmount > 0) {
        const existingIndex = newBorrows.findIndex((b) => b.asset === borrowAsset)
        const amountUSD = borrowAmount * ASSET_PRICES[borrowAsset]

        if (existingIndex >= 0) {
          newBorrows[existingIndex] = {
            ...newBorrows[existingIndex],
            amount: newBorrows[existingIndex].amount + borrowAmount,
            amountUSD: newBorrows[existingIndex].amountUSD + amountUSD,
          }
        } else {
          newBorrows.push({
            asset: borrowAsset,
            amount: borrowAmount,
            amountUSD,
            apy: AAVE_MARKET_DATA.assets[borrowAsset].borrowAPY,
          })
        }
      }

      return calculateHealthFactor(newSupplies, newBorrows)
    },
    [position]
  )

  // Calculate preview health factor
  const previewHF = amount && parseFloat(amount) > 0
    ? previewHealthFactor(
        activeTab === 'supply' ? selectedAsset : null,
        activeTab === 'supply' ? parseFloat(amount) : 0,
        activeTab === 'borrow' ? selectedAsset : null,
        activeTab === 'borrow' ? parseFloat(amount) : 0
      )
    : position.healthFactor

  const handleSubmit = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    if (!hasSmartWallet || !smartWallet || !userAddress) {
      setError('Please create Town Hall first')
      return
    }

    setError(null)
    setSuccess(false)

    const parsedAmount = parseFloat(amount)

    if (activeTab === 'supply') {
      // Call supply with userAddress and smartWallet from props
      const result = await realSupply(userAddress, smartWallet, selectedAsset, parsedAmount)
      if (result.success) {
        setSuccess(true)
        setAmount('')
        
        // Trigger external refresh
        if (onSuccess) {
          onSuccess()
        }
        
        // Refresh position from Aave
        setTimeout(() => {
          refreshPosition()
        }, 2000)
        
        // Update local position optimistically (keep this for immediate feedback)
        const assetInfo = AAVE_MARKET_DATA.assets[selectedAsset]
        const amountUSD = parsedAmount * ASSET_PRICES[selectedAsset]
        
        setPosition((prev: any) => {
          const existingIndex = prev.supplies.findIndex((s: any) => s.asset === selectedAsset)
          let newSupplies: any[]
          
          if (existingIndex >= 0) {
            newSupplies = [...prev.supplies]
            newSupplies[existingIndex] = {
              ...newSupplies[existingIndex],
              amount: newSupplies[existingIndex].amount + parsedAmount,
              amountUSD: newSupplies[existingIndex].amountUSD + amountUSD,
            }
          } else {
            newSupplies = [
              ...prev.supplies,
              {
                asset: selectedAsset,
                amount: parsedAmount,
                amountUSD,
                apy: assetInfo.supplyAPY,
              },
            ]
          }

          const totalSuppliedUSD = newSupplies.reduce((sum: any, s: any) => sum + s.amountUSD, 0)
          const totalBorrowedUSD = prev.borrows.reduce((sum: any, b: any) => sum + b.amountUSD, 0)
          const healthFactor = calculateHealthFactor(newSupplies, prev.borrows)

          return {
            ...prev,
            supplies: newSupplies,
            totalSuppliedUSD,
            netWorthUSD: totalSuppliedUSD - totalBorrowedUSD,
            healthFactor,
          }
        })
        
        setTimeout(() => setSuccess(false), 5000)
      } else {
        setError(result.error || 'Supply failed')
      }
    } else {
      // Borrow - currently simulated
      if (previewHF < 1) {
        setError('This would cause liquidation (Health Factor < 1)')
        return
      }

      const maxBorrow = getMaxBorrow(selectedAsset)
      if (parsedAmount > maxBorrow) {
        setError(`Max borrow: ${maxBorrow.toFixed(4)} ${selectedAsset}`)
        return
      }

      // Simulate borrow (not yet implemented with real contract)
      setError('Borrow feature coming soon!')
    }
  }

  const handleMax = () => {
    if (activeTab === 'borrow') {
      const maxBorrow = getMaxBorrow(selectedAsset)
      setAmount(maxBorrow > 0 ? maxBorrow.toFixed(6) : '0')
    }
  }

  // Health factor color
  const getHealthColor = (hf: number) => {
    if (hf === Infinity) return 'text-green-400'
    if (hf >= 2) return 'text-green-400'
    if (hf >= 1.5) return 'text-yellow-400'
    if (hf >= 1) return 'text-orange-400'
    return 'text-red-400'
  }

  const formatHealthFactor = (hf: number) => {
    if (hf === Infinity) return '∞'
    return hf.toFixed(2)
  }

  if (!hasSmartWallet) {
    return (
      <div className="relative">
        {/* Box Shadow */}
        <div className="absolute inset-0 bg-purple-900 translate-x-2 translate-y-2" />
        
        {/* Box */}
        <div className="relative bg-slate-800 border-4 border-purple-500 p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-2xl">🏦</span>
            <h3
              className="text-purple-400 text-sm"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              AAVE BANK
            </h3>
          </div>

          <p
            className="text-slate-400 text-[10px] text-center py-8"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            CREATE TOWN HALL FIRST TO USE AAVE
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Box Shadow */}
      <div className="absolute inset-0 bg-purple-900 translate-x-2 translate-y-2" />

      {/* Box */}
      <div className="relative bg-slate-800 border-4 border-purple-500 p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🏦</span>
            <h3
              className="text-purple-400 text-sm"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              AAVE BANK
            </h3>
          </div>

          {/* Tabs */}
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('supply')}
              className={`px-3 py-1 text-[8px] border-2 transition-colors ${
                activeTab === 'supply'
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'
              }`}
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              SUPPLY
            </button>
            <button
              onClick={() => setActiveTab('borrow')}
              className={`px-3 py-1 text-[8px] border-2 transition-colors ${
                activeTab === 'borrow'
                  ? 'bg-purple-600 border-purple-400 text-white'
                  : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-slate-500'
              }`}
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              BORROW
            </button>
          </div>
        </div>

        {/* Divider */}
        <div className="flex gap-1 mb-4">
          {[...Array(20)].map((_, i) => (
            <div key={i} className="w-2 h-1 bg-slate-600" />
          ))}
        </div>

        {/* Position Overview */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="bg-slate-900 border-2 border-slate-700 p-3 text-center">
            <p
              className="text-slate-500 text-[6px] mb-1"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              SUPPLIED
            </p>
            <p
              className="text-green-400 text-[10px]"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              ${position.totalSuppliedUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-slate-900 border-2 border-slate-700 p-3 text-center">
            <p
              className="text-slate-500 text-[6px] mb-1"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              BORROWED
            </p>
            <p
              className="text-orange-400 text-[10px]"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              ${position.totalBorrowedUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="bg-slate-900 border-2 border-slate-700 p-3 text-center">
            <p
              className="text-slate-500 text-[6px] mb-1"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              HEALTH
            </p>
            <p
              className={`text-[10px] ${getHealthColor(position.healthFactor)}`}
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              {formatHealthFactor(position.healthFactor)}
            </p>
          </div>
        </div>

        {/* Asset Selection */}
        <div className="mb-4">
          <p
            className="text-slate-500 text-[8px] mb-2"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            SELECT ASSET
          </p>
          <div className="grid grid-cols-4 gap-2">
            {assets.map((asset) => (
              <button
                key={asset}
                onClick={() => setSelectedAsset(asset)}
                className={`px-2 py-2 border-2 text-[8px] transition-colors ${
                  selectedAsset === asset
                    ? 'bg-purple-600 border-purple-400 text-white'
                    : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                }`}
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                {asset}
              </button>
            ))}
          </div>
        </div>

        {/* Amount Input */}
        <div className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <p
              className="text-slate-500 text-[8px]"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              AMOUNT
            </p>
            {activeTab === 'borrow' && (
              <button
                onClick={handleMax}
                className="text-purple-400 text-[8px] hover:text-purple-300"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                MAX
              </button>
            )}
          </div>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full bg-slate-900 border-2 border-slate-700 p-3 pr-16 text-white text-sm focus:border-purple-500 focus:outline-none"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            />
            <span
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-[10px]"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              {selectedAsset}
            </span>
          </div>
        </div>

        {/* APY & LTV Info */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="bg-slate-900/50 border border-slate-700 p-2 text-center">
            <p
              className="text-slate-500 text-[6px] mb-1"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              {activeTab === 'supply' ? 'SUPPLY APY' : 'BORROW APY'}
            </p>
            <p
              className={`text-[10px] ${activeTab === 'supply' ? 'text-green-400' : 'text-orange-400'}`}
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              {activeTab === 'supply'
                ? `${currentAssetInfo.supplyAPY}%`
                : `${currentAssetInfo.borrowAPY}%`}
            </p>
          </div>
          <div className="bg-slate-900/50 border border-slate-700 p-2 text-center">
            <p
              className="text-slate-500 text-[6px] mb-1"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              LTV
            </p>
            <p
              className="text-white text-[10px]"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              {(currentAssetInfo.ltv * 100).toFixed(0)}%
            </p>
          </div>
        </div>

        {/* Preview Health Factor (for borrow) */}
        {activeTab === 'borrow' && amount && parseFloat(amount) > 0 && (
          <div className="bg-slate-900/50 border border-slate-700 p-2 mb-4 text-center">
            <p
              className="text-slate-500 text-[6px] mb-1"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              NEW HEALTH FACTOR
            </p>
            <p
              className={`text-[10px] ${getHealthColor(previewHF)}`}
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              {formatHealthFactor(previewHF)}
            </p>
          </div>
        )}

        {/* Error / Success Messages */}
        {error && (
          <div className="bg-red-900/30 border-2 border-red-600 p-3 mb-4">
            <p
              className="text-red-400 text-[8px] text-center"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              {error}
            </p>
          </div>
        )}

        {success && (
          <div className="bg-green-900/30 border-2 border-green-600 p-3 mb-4">
            <p
              className="text-green-400 text-[8px] text-center"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              {activeTab === 'supply' ? 'SUPPLY SUCCESSFUL!' : 'BORROW SUCCESSFUL!'}
            </p>
          </div>
        )}

        {/* Submit Button */}
        <button
          onClick={handleSubmit}
          disabled={loading || !amount || parseFloat(amount) <= 0}
          className="relative group w-full disabled:opacity-50"
        >
          {/* Button Shadow */}
          <div className="absolute inset-0 bg-purple-900 translate-x-2 translate-y-2" />

          {/* Button */}
          <div
            className={`relative px-6 py-4 bg-purple-600 border-4 border-purple-400 text-white flex items-center justify-center gap-3 transition-transform ${
              !loading ? 'group-hover:-translate-y-1 group-active:translate-y-0' : ''
            }`}
          >
            {loading ? (
              <>
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-white"
                      style={{
                        animation: `pixelBounce 0.6s ease-in-out infinite`,
                        animationDelay: `${i * 0.15}s`,
                      }}
                    />
                  ))}
                </div>
                <span
                  className="text-xs"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  PROCESSING...
                </span>
              </>
            ) : (
              <span
                className="text-xs"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                {activeTab === 'supply' ? 'SUPPLY' : 'BORROW'}
              </span>
            )}
          </div>
        </button>

        {/* Current Positions */}
        {(position.supplies.length > 0 || position.borrows.length > 0) && (
          <div className="mt-4 pt-4 border-t-2 border-slate-700">
            <p
              className="text-slate-500 text-[8px] mb-3"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              YOUR POSITIONS
            </p>

            {/* Supplies */}
            {position.supplies.length > 0 && (
              <div className="mb-3">
                <p
                  className="text-green-400 text-[6px] mb-2"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  SUPPLIED:
                </p>
                <div className="space-y-1">
                  {position.supplies.map((s: any) => (
                    <div
                      key={s.asset}
                      className="flex justify-between bg-slate-900/50 p-2"
                    >
                      <span
                        className="text-white text-[8px]"
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                      >
                        {s.amount.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} {s.asset}
                        <span className="text-slate-500 ml-2">
                          (~${s.amountUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                        </span>
                      </span>
                      <span
                        className="text-green-400 text-[8px]"
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                      >
                        +{s.apy}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Borrows */}
            {position.borrows.length > 0 && (
              <div>
                <p
                  className="text-orange-400 text-[6px] mb-2"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  BORROWED:
                </p>
                <div className="space-y-1">
                  {position.borrows.map((b: any) => (
                    <div
                      key={b.asset}
                      className="flex justify-between bg-slate-900/50 p-2"
                    >
                      <span
                        className="text-white text-[8px]"
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                      >
                        {b.amount.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 4 })} {b.asset}
                        <span className="text-slate-500 ml-2">
                          (~${b.amountUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                        </span>
                      </span>
                      <span
                        className="text-orange-400 text-[8px]"
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                      >
                        -{b.apy}%
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Decorative Corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-purple-400 -translate-x-1 -translate-y-1" />
        <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-purple-400 translate-x-1 -translate-y-1" />
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-purple-400 -translate-x-1 translate-y-1" />
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-purple-400 translate-x-1 translate-y-1" />
      </div>

      {/* Pixel bounce animation */}
      <style jsx>{`
        @keyframes pixelBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
      `}</style>
    </div>
  )
}
