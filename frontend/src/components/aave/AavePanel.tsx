'use client'

import { useState, useCallback, useEffect, useMemo } from 'react'
import { useAaveSupply, useAavePosition, useAaveMarketData, useAaveWithdraw, useAaveHarvest, useAaveBorrow, useAaveRepay, useAaveReserveData } from '@/hooks'
import { Building } from '@/hooks/useCityBuildings'
import { ASSET_PRICES, AAVE_MARKET_DATA } from '@/config/aave'
import { ErrorPopup } from '@/components/ui/ErrorPopup'

type TabType = 'supply' | 'borrow'

interface AavePanelProps {
  smartWallet: string | null
  hasSmartWallet: boolean
  userAddress?: string
  onSuccess?: () => void
  selectedCoords?: { x: number; y: number } | null
  usedAssets?: string[]
  existingAsset?: string
  vaultBalances?: Record<string, string>
  buildingId?: number
  allBuildings?: any[]
  isBorrowBuilding?: boolean  // true if clicked on a borrow building
  selectedBuilding?: Building | null  // the building that was clicked (for repay demolition)
}

// Initial empty position
const EMPTY_POSITION: any = {
  supplies: [],
  borrows: [],
  totalSuppliedUSD: 0,
  totalBorrowedUSD: 0,
  availableBorrowsUSD: 0,
  netWorthUSD: 0,
  healthFactor: Infinity,
  netAPY: 0,
}

// Calculate health factor (uses Aave LTV/liquidation; reserveData for WBTC/LINK)
function calculateHealthFactor(
  supplies: any[],
  borrows: any[],
  reserveData?: Record<string, { liquidationThreshold: number }>
): number {
  if (borrows.length === 0) return Infinity

  let totalCollateralETH = 0
  let totalBorrowETH = 0

  for (const supply of supplies) {
    const assetInfo = AAVE_MARKET_DATA.assets[supply.asset]
    const th = assetInfo?.liquidationThreshold ?? (reserveData?.[supply.asset]?.liquidationThreshold ?? 80) / 100
    totalCollateralETH += supply.amountUSD * th
  }

  for (const borrow of borrows) {
    totalBorrowETH += borrow.amountUSD
  }

  if (totalBorrowETH === 0) return Infinity
  return totalCollateralETH / totalBorrowETH
}

export function AavePanel({
  smartWallet,
  hasSmartWallet,
  userAddress,
  onSuccess,
  selectedCoords,
  usedAssets = [],
  existingAsset,
  vaultBalances = {},
  buildingId,
  allBuildings = [],
  isBorrowBuilding = false,
  selectedBuilding,
}: AavePanelProps) {
  // Set initial tab based on building type
  const [activeTab, setActiveTab] = useState<TabType>(isBorrowBuilding ? 'borrow' : 'supply')
  const [selectedAsset, setSelectedAsset] = useState<string>(existingAsset || 'USDC')
  const [amount, setAmount] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [successType, setSuccessType] = useState<'supply' | 'borrow' | 'withdraw' | 'repay' | 'harvest' | 'demolish' | null>(null)
  const [position, setPosition] = useState<any>(EMPTY_POSITION)
  const [showHarvestModal, setShowHarvestModal] = useState(false)
  const [harvestAsset, setHarvestAsset] = useState<string>('')
  const [harvestAmount, setHarvestAmount] = useState('')
  const [harvestMaxAmount, setHarvestMaxAmount] = useState(0)
  const [showDemolishModal, setShowDemolishModal] = useState(false)

  // Use the hooks
  const { supply: realSupply, loading: loadingSupply } = useAaveSupply()
  const { withdraw: realWithdraw, loading: loadingWithdraw } = useAaveWithdraw()
  const { harvest: realHarvest, loading: loadingHarvest } = useAaveHarvest()
  const { borrow: realBorrow, loading: loadingBorrow } = useAaveBorrow()
  const { repay: realRepay, loading: loadingRepay } = useAaveRepay()
  const { position: realPosition, refresh: refreshPosition } = useAavePosition(smartWallet)
  const { marketData: aaveMarketData } = useAaveMarketData()
  const { reserveData, loading: loadingReserveData, isPoolFull } = useAaveReserveData()

  const hasInsufficientBalance = useMemo(() => {
    // Only enforce vault-balance check if we actually track a non-empty vaultBalances map.
    // On game flows where supply uses Smart Wallet balances directly (no separate vault),
    // we let the underlying hook (useAaveSupply) validate balances and show errors.
    if (activeTab !== 'supply' || !amount || parseFloat(amount) <= 0) return false
    if (!vaultBalances || Object.keys(vaultBalances).length === 0) return false

    const balance = parseFloat(vaultBalances[selectedAsset] ?? '0')
    return parseFloat(amount) > balance
  }, [selectedAsset, amount, vaultBalances, activeTab])

  // Combined loading state
  const loading = loadingSupply || loadingWithdraw || loadingBorrow || loadingRepay || loadingHarvest

  // Sync real position to local state
  useEffect(() => {
    if (realPosition) {
      setPosition(realPosition)
    }
  }, [realPosition])

  // Sync selectedAsset ONLY when existingAsset changes (not usedAssets)
  // This prevents resetting user's manual selection
  useEffect(() => {
    if (existingAsset) {
      console.log(`[AavePanel] Syncing selectedAsset to existingAsset: ${existingAsset}`)
      setSelectedAsset(existingAsset)
    }
    // NOTE: We no longer reset to default when existingAsset is undefined
    // The initial state handles the default (line 79)
  }, [existingAsset])

  const assets: string[] = ['USDC', 'USDT', 'ETH', 'WBTC', 'LINK']
  const marketData = AAVE_MARKET_DATA
  const currentAssetInfo = marketData.assets[selectedAsset]

  // Max borrowable USD (from Aave getUserAccountData.availableBorrowsBase)
  const availableBorrowsUSD = position?.availableBorrowsUSD ?? 0

  // Must repay all borrows before demolishing
  const hasOpenBorrows = (position?.borrows?.filter((b: any) => b.amount > 0.0001).length ?? 0) > 0

  // Get max borrowable amount per asset (from Aave + reserve liquidity)
  const getMaxBorrow = useCallback((asset: string): number => {
    if (availableBorrowsUSD <= 0) return 0
    const rd = reserveData[asset]
    if (rd?.borrowingEnabled === false) return 0
    const price = rd?.oraclePrice ?? ASSET_PRICES[asset] ?? 1
    if (price <= 0) return 0
    const maxByUSD = availableBorrowsUSD / price
    const maxByLiquidity = rd?.availableLiquidity ?? Infinity
    return Math.max(0, Math.min(maxByUSD, maxByLiquidity))
  }, [availableBorrowsUSD, reserveData])

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
            apy: aaveMarketData[supplyAsset]?.supplyAPY || AAVE_MARKET_DATA.assets[supplyAsset].supplyAPY,
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
            apy: aaveMarketData[borrowAsset]?.borrowAPY || AAVE_MARKET_DATA.assets[borrowAsset].borrowAPY,
          })
        }
      }

      return calculateHealthFactor(newSupplies, newBorrows, reserveData)
    },
    [position, reserveData]
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

  const handleWithdraw = async (asset: string, amount: number, isDemolishIntent?: boolean) => {
    if (!hasSmartWallet || !smartWallet) {
      setError('Please create Town Hall first')
      return
    }

    setError(null)
    setSuccess(false)

    // Find all buildings for this asset to demolish if withdrawing full balance
    let buildingIdsToDemolish: number[] = []

    // Check if we are withdrawing (close to) the full balance
    const currentSupply = position.supplies.find((s: any) => s.asset === asset)
    const currentBalance = currentSupply?.amount || 0
    // Use 99% threshold for safety with interest/dust
    const isFullWithdrawal = amount >= currentBalance * 0.99 

    if (isFullWithdrawal && allBuildings.length > 0) {
      buildingIdsToDemolish = allBuildings
        .filter((b: any) => b.asset === asset && b.active)
        .map((b: any) => b.id)
      
      console.log(`[AavePanel] Full withdrawal detected for ${asset}. Demolishing buildings: ${buildingIdsToDemolish.join(', ')}`)
    } else if (buildingId) {
      console.log(`[AavePanel] Partial withdrawal for ${asset}. No buildings will be demolished to maintain UI consistency.`)
    }

    console.log(`[AavePanel] Withdrawing ${amount} ${asset} (demolishing ids: ${buildingIdsToDemolish.join(', ')})`)
    const result = await realWithdraw(smartWallet, asset, amount, buildingIdsToDemolish)

    if (result.success) {
      setSuccess(true)
      setSuccessType(isDemolishIntent || buildingIdsToDemolish.length > 0 ? 'demolish' : 'withdraw')
      if (onSuccess) onSuccess()
      setTimeout(() => refreshPosition(), 2000)
      setTimeout(() => { setSuccess(false); setSuccessType(null) }, 5000)
    } else {
      setError(result.error || 'Withdraw failed')
    }
  }

  const handleRepay = async (asset: string, amount: number, repayAll: boolean = false) => {
    if (!hasSmartWallet || !smartWallet || !userAddress) {
      setError('Please create Town Hall first')
      return
    }

    setError(null)
    setSuccess(false)

    // Find the borrow building for this asset (for demolition if repaying all)
    const borrowBuilding = repayAll
      ? (selectedBuilding?.isBorrow && selectedBuilding?.asset === asset
          ? selectedBuilding
          : allBuildings.find((b: any) => b.isBorrow && b.asset === asset && b.active))
      : undefined

    console.log(`[AavePanel] Repaying ${repayAll ? 'ALL' : amount} ${asset}`, borrowBuilding ? `(demolishing building ${borrowBuilding.id})` : '')
    const result = await realRepay(userAddress, smartWallet, asset, amount, repayAll, borrowBuilding)

    if (result.success) {
      setSuccess(true)

      // Trigger external refresh
      if (onSuccess) {
        onSuccess()
      }

      setTimeout(() => {
        refreshPosition()
      }, 2000)
      setTimeout(() => setSuccess(false), 5000)
    } else {
      setError(result.error || 'Repay failed')
    }
  }

  const openHarvestModal = (asset: string, maxAmount: number) => {
    setHarvestAsset(asset)
    setHarvestMaxAmount(maxAmount)
    setHarvestAmount('')
    setShowHarvestModal(true)
    setError(null)
  }

  const handleHarvestConfirm = async () => {
    if (!hasSmartWallet || !smartWallet || !userAddress || !buildingId) {
      setError('Missing wallet or building')
      return
    }
    const amount = parseFloat(harvestAmount)
    if (!harvestAmount || isNaN(amount) || amount <= 0) {
      setError('Enter a valid amount to harvest')
      return
    }
    if (amount > harvestMaxAmount) {
      setError(`Max harvestable: ${harvestMaxAmount.toLocaleString(undefined, { maximumFractionDigits: 6 })} ${harvestAsset}`)
      return
    }
    setError(null)
    const result = await realHarvest(userAddress, smartWallet, buildingId, harvestAsset, amount)
    if (result.success) {
      setShowHarvestModal(false)
      setSuccess(true)
      setSuccessType('harvest')
      if (onSuccess) onSuccess()
      setTimeout(() => refreshPosition(), 2000)
      setTimeout(() => { setSuccess(false); setSuccessType(null) }, 5000)
    } else {
      setError(result.error || 'Harvest failed')
    }
  }

  const openDemolishModal = () => {
    setShowDemolishModal(true)
    setError(null)
  }

  const handleDemolishConfirm = async () => {
    if (!existingAsset || !hasSmartWallet || !smartWallet) return
    const supply = position.supplies.find((s: any) => s.asset === existingAsset)
    if (!supply || supply.amount <= 0) {
      setError('No supply to withdraw')
      return
    }
    setShowDemolishModal(false)
    await handleWithdraw(existingAsset, supply.amount, true)
  }

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
      // Call supply with userAddress, smartWallet, and coordinates
      const result = await realSupply(
        userAddress,
        smartWallet,
        selectedAsset,
        parsedAmount,
        selectedCoords?.x,
        selectedCoords?.y,
        !!buildingId
      )
      
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
                apy: aaveMarketData[selectedAsset]?.supplyAPY || assetInfo.supplyAPY,
              },
            ]
          }

          const totalSuppliedUSD = newSupplies.reduce((sum: any, s: any) => sum + s.amountUSD, 0)
          const totalBorrowedUSD = prev.borrows.reduce((sum: any, b: any) => sum + b.amountUSD, 0)
          const healthFactor = calculateHealthFactor(newSupplies, prev.borrows, reserveData)

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
      // Borrow (Aave Pool.borrow via Smart Wallet + record building on-chain)
      if (previewHF < 1) {
        setError('This would cause liquidation (Health Factor < 1)')
        return
      }

      const maxBorrow = getMaxBorrow(selectedAsset)
      if (parsedAmount > maxBorrow) {
        setError(`Max borrow: ${maxBorrow.toFixed(6)} ${selectedAsset}`)
        return
      }

      if (!smartWallet) {
        setError('Smart Wallet not found')
        return
      }

      // Pass userAddress and coordinates; building placement is now on-chain
      console.log(`[AavePanel] Borrowing ${parsedAmount} ${selectedAsset} at (${selectedCoords?.x}, ${selectedCoords?.y})`)
      const result = await realBorrow(
        userAddress,
        smartWallet,
        selectedAsset,
        parsedAmount,
        selectedCoords?.x,
        selectedCoords?.y,
        !!buildingId  // isUpgrade: if we have buildingId, it's an upgrade (borrow more)
      )

      if (result.success) {
        setSuccess(true)
        setAmount('')

        if (onSuccess) onSuccess()
        setTimeout(() => refreshPosition(), 2000)
        setTimeout(() => setSuccess(false), 5000)
      } else {
        setError(result.error || 'Borrow failed')
      }
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
            {/* Supply Tab - disabled if clicked on borrow building */}
            <button
              onClick={() => !isBorrowBuilding && setActiveTab('supply')}
              disabled={isBorrowBuilding && !!existingAsset}
              className={`px-3 py-1 text-[8px] border-2 transition-colors ${
                isBorrowBuilding && existingAsset
                  ? 'bg-slate-900 border-slate-700 text-slate-600 cursor-not-allowed opacity-50'
                  : activeTab === 'supply'
                    ? 'bg-green-600 border-green-400 text-white'
                    : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-green-500'
              }`}
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              SUPPLY
            </button>
            {/* Borrow Tab - disabled if clicked on supply building */}
            <button
              onClick={() => !(existingAsset && !isBorrowBuilding) && setActiveTab('borrow')}
              disabled={!!existingAsset && !isBorrowBuilding}
              className={`px-3 py-1 text-[8px] border-2 transition-colors ${
                existingAsset && !isBorrowBuilding
                  ? 'bg-slate-900 border-slate-700 text-slate-600 cursor-not-allowed opacity-50'
                  : activeTab === 'borrow'
                    ? 'bg-orange-600 border-orange-400 text-white'
                    : 'bg-slate-700 border-slate-600 text-slate-400 hover:border-orange-500'
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
            {existingAsset
              ? `ASSET: ${existingAsset}`
              : 'SELECT ASSET'}
          </p>

          <div className="grid grid-cols-4 gap-2">
            {assets.map((asset) => {
              // For Supply: lock to existingAsset if editing existing building
              const lockOnSupply = activeTab === 'supply' && !!existingAsset && asset !== existingAsset

              // For Borrow: same logic as Supply
              // - If existingAsset is set (clicked on a borrow building) → lock to that asset only
              // - If no existingAsset but asset already has borrow → disable (can't create new borrow for same asset elsewhere)
              const assetHasBorrow = position.borrows.some((b: any) => b.asset === asset && b.amount > 0.0001)
              const lockOnBorrowExisting = activeTab === 'borrow' && !!existingAsset && asset !== existingAsset
              const lockOnBorrowUsed = activeTab === 'borrow' && !existingAsset && assetHasBorrow

              const borrowDisabled = activeTab === 'borrow' && (reserveData[asset]?.borrowingEnabled === false)
              const isLocked = lockOnSupply || lockOnBorrowExisting || lockOnBorrowUsed || borrowDisabled

              const hasExistingBuilding = activeTab === 'supply' && usedAssets.includes(asset) && !existingAsset
              const hasExistingBorrow = activeTab === 'borrow' && assetHasBorrow && !existingAsset

              return (
                <button
                  key={asset}
                  onClick={() => !isLocked && setSelectedAsset(asset)}
                  disabled={isLocked}
                  className={`px-2 py-2 border-2 text-[8px] transition-colors ${
                    isLocked
                      ? 'bg-slate-900/50 border-slate-800 text-slate-600 cursor-not-allowed opacity-40'
                      : selectedAsset === asset
                        ? 'bg-purple-600 border-purple-400 text-white'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:border-slate-600'
                  }`}
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {asset}
                  {hasExistingBuilding && (
                    <span className="block text-[5px] text-cyan-400 mt-0.5">+MORE</span>
                  )}
                  {hasExistingBorrow && (
                    <span className="block text-[5px] text-orange-400 mt-0.5">BORROWED</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Borrow: "You can borrow up to" + Max per asset (from Aave) */}
        {activeTab === 'borrow' && (
          <div className="mb-4 space-y-2">
            <div className="bg-slate-900/50 border border-slate-700 p-2">
              <p className="text-slate-500 text-[6px] mb-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                YOU CAN BORROW UP TO (Aave)
              </p>
              <p className="text-cyan-400 text-[10px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                ${availableBorrowsUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
            </div>
            <div className="bg-slate-900/50 border border-slate-700 p-2 flex justify-between items-center">
              <span className="text-slate-500 text-[6px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                MAX {selectedAsset}
              </span>
              <span className="text-white text-[10px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                {getMaxBorrow(selectedAsset).toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} {selectedAsset}
              </span>
            </div>

            {/* Borrow Reserve Info */}
            {reserveData[selectedAsset] && (
              <div className="space-y-1.5">
                {/* Borrow Usage Progress Bar */}
                <div className="bg-slate-900/50 border border-slate-700 p-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-500 text-[5px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>BORROW</span>
                    <span className="text-orange-400 text-[6px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      {reserveData[selectedAsset].borrowCap > 0
                        ? `${((reserveData[selectedAsset].totalBorrowed / reserveData[selectedAsset].borrowCap) * 100).toFixed(1)}% (${reserveData[selectedAsset].totalBorrowed.toLocaleString(undefined, { maximumFractionDigits: 1 })}/${reserveData[selectedAsset].borrowCap.toLocaleString()})`
                        : `${reserveData[selectedAsset].totalBorrowed.toLocaleString(undefined, { maximumFractionDigits: 1 })} (No Cap)`
                      }
                    </span>
                  </div>
                  {reserveData[selectedAsset].borrowCap > 0 && (
                    <div className="w-full h-1.5 bg-slate-800 mt-1">
                      <div
                        className={`h-full transition-all ${
                          (reserveData[selectedAsset].totalBorrowed / reserveData[selectedAsset].borrowCap) * 100 >= 95
                            ? 'bg-red-500'
                            : (reserveData[selectedAsset].totalBorrowed / reserveData[selectedAsset].borrowCap) * 100 >= 80
                              ? 'bg-yellow-500'
                              : 'bg-orange-500'
                        }`}
                        style={{ width: `${Math.min((reserveData[selectedAsset].totalBorrowed / reserveData[selectedAsset].borrowCap) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* Borrow Stats: APY, Available Liquidity, Total Borrowed USD */}
                <div className="grid grid-cols-3 gap-1">
                  <div className="bg-slate-900/50 border border-slate-700 p-1 text-center">
                    <p className="text-slate-500 text-[4px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>BORROW APY</p>
                    <p className="text-orange-400 text-[8px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      {(() => {
                        const apy = reserveData[selectedAsset]?.borrowAPY || 0
                        if (apy === 0) return '0%'
                        if (apy < 0.01) return '<.01%'
                        if (apy >= 10) return `${Math.round(apy)}%`
                        return `${apy.toFixed(2)}%`
                      })()}
                    </p>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-700 p-1 text-center">
                    <p className="text-slate-500 text-[4px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>AVAILABLE</p>
                    <p className="text-green-400 text-[7px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      {reserveData[selectedAsset].availableLiquidity.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  <div className="bg-slate-900/50 border border-slate-700 p-1 text-center">
                    <p className="text-slate-500 text-[4px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>TOTAL BORROWED</p>
                    <p className="text-white text-[7px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      ${reserveData[selectedAsset].totalBorrowedUSD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </p>
                  </div>
                </div>

                {/* Borrowing Status */}
                {!reserveData[selectedAsset].borrowingEnabled && (
                  <div className="bg-red-900/30 border border-red-600 p-2 text-center">
                    <p className="text-red-400 text-[6px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      ⚠️ BORROWING DISABLED FOR {selectedAsset}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Vault Balance Display (only if vault balances are actually provided) */}
        {activeTab === 'supply' && vaultBalances && Object.keys(vaultBalances).length > 0 && vaultBalances[selectedAsset] && (
          <div className="bg-slate-900/50 border border-slate-700 p-3 mb-4">
            <div className="flex justify-between items-center">
              <p className="text-slate-500 text-[7px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                VAULT BALANCE
              </p>
              <p className="text-cyan-400 text-[10px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                {parseFloat(vaultBalances[selectedAsset] || '0').toFixed(selectedAsset === 'ETH' ? 4 : 2)} {selectedAsset}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'supply' && hasInsufficientBalance && (
          <div className="mb-2 bg-red-900/30 border border-red-600 p-2 text-center animate-pulse">
            <p className="text-red-400 text-[6px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
              ⚠️ INSUFFICIENT {selectedAsset} IN VAULT
            </p>
          </div>
        )}

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

        {/* Reserve Info Section - Compact Design */}
        {reserveData[selectedAsset] && (
          <div className="mb-3 space-y-1.5">
            {/* Pool Status Badge */}
            {isPoolFull(selectedAsset) && (
              <div className="bg-red-900/30 border border-red-600 p-2 text-center">
                <p className="text-red-400 text-[7px] font-bold" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  ⚠️ SUPPLY CAP REACHED (100%)
                </p>
                <p className="text-red-300 text-[5px] mt-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  Further supply unavailable for this asset
                </p>
              </div>
            )}

            {/* Supply Info with Progress Bar - More Compact */}
            <div className="bg-slate-900/50 border border-slate-700 p-1.5">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 text-[5px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>SUPPLY</span>
                <span className="text-cyan-400 text-[6px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  {reserveData[selectedAsset].supplyUsagePercent.toFixed(1)}% ({reserveData[selectedAsset].totalSupplied.toLocaleString(undefined, { maximumFractionDigits: 1 })}/{reserveData[selectedAsset].supplyCap.toLocaleString()})
                </span>
              </div>
              <div className="w-full h-1.5 bg-slate-800 mt-1">
                <div
                  className={`h-full transition-all ${reserveData[selectedAsset].supplyUsagePercent >= 95 ? 'bg-red-500' : reserveData[selectedAsset].supplyUsagePercent >= 80 ? 'bg-yellow-500' : 'bg-cyan-500'}`}
                  style={{ width: `${Math.min(reserveData[selectedAsset].supplyUsagePercent, 100)}%` }}
                />
              </div>
            </div>

            {/* Combined Stats Row: APY, Price, LTV, Threshold, Utilization */}
            <div className="grid grid-cols-5 gap-1">
              <div className="bg-slate-900/50 border border-slate-700 p-1 text-center">
                <p className="text-slate-500 text-[4px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  {activeTab === 'borrow' ? 'BORROW' : 'SUPPLY'}
                </p>
                <p className={`text-[8px] ${activeTab === 'borrow' ? 'text-orange-400' : 'text-green-400'}`} style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  {(() => {
                    const apy = activeTab === 'borrow'
                      ? reserveData[selectedAsset]?.borrowAPY || 0
                      : reserveData[selectedAsset]?.supplyAPY || 0
                    if (apy === 0) return '0%'
                    if (apy < 0.01) return '<.01%'
                    if (apy >= 10) return `${Math.round(apy)}%`
                    return `${apy.toFixed(2)}%`
                  })()}
                </p>
              </div>
              <div className="bg-slate-900/50 border border-slate-700 p-1 text-center">
                <p className="text-slate-500 text-[4px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>PRICE</p>
                <p className="text-white text-[7px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  ${reserveData[selectedAsset].oraclePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </p>
              </div>
              <div className="bg-slate-900/50 border border-slate-700 p-1 text-center">
                <p className="text-slate-500 text-[4px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>LTV</p>
                <p className="text-white text-[8px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  {reserveData[selectedAsset].ltv}%
                </p>
              </div>
              <div className="bg-slate-900/50 border border-slate-700 p-1 text-center">
                <p className="text-slate-500 text-[4px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>LIQ</p>
                <p className="text-yellow-400 text-[8px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  {reserveData[selectedAsset].liquidationThreshold}%
                </p>
              </div>
              <div className="bg-slate-900/50 border border-slate-700 p-1 text-center">
                <p className="text-slate-500 text-[4px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>UTIL</p>
                <p className="text-purple-400 text-[8px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  {reserveData[selectedAsset].utilizationRate}%
                </p>
              </div>
            </div>

            {/* Collateral Status - Inline */}
            {reserveData[selectedAsset].canBeCollateral && (
              <div className="flex items-center gap-1 text-[5px] text-green-400" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                <span>✓</span>
                <span>CAN BE COLLATERAL</span>
              </div>
            )}
          </div>
        )}

        {/* Fallback APY & LTV Info (when reserve data not loaded) */}
        {!reserveData[selectedAsset] && (
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
                {loadingReserveData ? '...' : (activeTab === 'supply'
                  ? `${aaveMarketData[selectedAsset]?.supplyAPY || currentAssetInfo?.supplyAPY || 0}%`
                  : `${aaveMarketData[selectedAsset]?.borrowAPY || currentAssetInfo?.borrowAPY || 0}%`)}
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
                {loadingReserveData ? '...' : `${((currentAssetInfo?.ltv || 0.8) * 100).toFixed(0)}%`}
              </p>
            </div>
          </div>
        )}

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

        {/* Error Popup */}
        <ErrorPopup error={error} onClose={() => setError(null)} />

        {/* Harvest confirmation modal */}
        {showHarvestModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm">
            <div className="relative bg-slate-800 border-4 border-amber-500 p-4 max-w-sm w-full mx-4">
              <p className="text-amber-400 text-[8px] mb-2" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                HARVEST REWARDS
              </p>
              <p className="text-slate-500 text-[6px] mb-2" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                Pending / Harvestable
              </p>
              <p className="text-cyan-400 text-[10px] mb-3" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                {harvestMaxAmount.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} {harvestAsset}
              </p>
              <div className="mb-3">
                <label className="text-slate-500 text-[6px] block mb-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  AMOUNT TO HARVEST
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={harvestAmount}
                    onChange={(e) => setHarvestAmount(e.target.value)}
                    placeholder="0"
                    className="flex-1 bg-slate-900 border-2 border-slate-600 p-2 text-white text-[10px] focus:border-amber-500 focus:outline-none"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  />
                  <button
                    type="button"
                    onClick={() => setHarvestAmount(harvestMaxAmount.toLocaleString(undefined, { maximumFractionDigits: 6 }))}
                    className="px-2 py-1 bg-slate-700 border border-slate-600 text-slate-300 text-[6px] hover:bg-slate-600"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    MAX
                  </button>
                </div>
              </div>
              <p className="text-slate-500 text-[5px] mb-3" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                Building will remain active. Tokens go to Smart Wallet.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowHarvestModal(false)}
                  disabled={loading}
                  className="flex-1 px-3 py-2 bg-slate-700 border-2 border-slate-600 text-slate-300 text-[6px] hover:bg-slate-600 disabled:opacity-50"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  CANCEL
                </button>
                <button
                  onClick={handleHarvestConfirm}
                  disabled={loading || !harvestAmount || parseFloat(harvestAmount) <= 0}
                  className="flex-1 px-3 py-2 bg-amber-600 border-2 border-amber-500 text-white text-[6px] hover:bg-amber-500 disabled:opacity-50"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {loadingHarvest ? '...' : 'CONFIRM HARVEST'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Demolish confirmation modal */}
        {showDemolishModal && existingAsset && (() => {
          const supply = position.supplies.find((s: any) => s.asset === existingAsset)
          const totalAmount = supply?.amount ?? 0
          const totalUSD = supply?.amountUSD ?? 0
          return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm">
              <div className="relative bg-slate-800 border-4 border-red-500 p-4 max-w-sm w-full mx-4">
                <p className="text-red-400 text-[8px] mb-2" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  DEMOLISH BUILDING?
                </p>
                <p className="text-slate-500 text-[6px] mb-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  Total value (principal + interest)
                </p>
                <p className="text-cyan-400 text-[10px] mb-1" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 4, maximumFractionDigits: 6 })} {existingAsset}
                </p>
                <p className="text-white text-[10px] mb-3" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  ~${totalUSD.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <div className="bg-amber-900/30 border border-amber-600 p-2 mb-3">
                  <p className="text-amber-400 text-[6px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    Building will be removed. Tile will be free. This cannot be undone.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDemolishModal(false)}
                    disabled={loading}
                    className="flex-1 px-3 py-2 bg-slate-700 border-2 border-slate-600 text-slate-300 text-[6px] hover:bg-slate-600 disabled:opacity-50"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleDemolishConfirm}
                    disabled={loading || totalAmount <= 0}
                    className="flex-1 px-3 py-2 bg-red-600 border-2 border-red-500 text-white text-[6px] hover:bg-red-500 disabled:opacity-50"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    {loadingWithdraw ? '...' : 'CONFIRM DEMOLISH'}
                  </button>
                </div>
              </div>
            </div>
          )
        })()}

        {success && (
          <div className="bg-green-900/30 border-2 border-green-600 p-3 mb-4">
            <p
              className="text-green-400 text-[8px] text-center"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              {successType === 'supply' && 'SUPPLY SUCCESSFUL!'}
              {successType === 'borrow' && 'BORROW SUCCESSFUL!'}
              {successType === 'withdraw' && 'WITHDRAW SUCCESSFUL!'}
              {successType === 'repay' && 'REPAY SUCCESSFUL!'}
              {successType === 'harvest' && 'HARVEST SUCCESSFUL!'}
              {successType === 'demolish' && 'DEMOLISH SUCCESSFUL!'}
              {activeTab === 'supply' ? 'SUPPLY SUCCESSFUL!' : 'BORROW SUCCESSFUL!'}
            </p>
          </div>
        )}

        {/* Submit Button */}
        {(() => {
          const borrowNoCollateral = activeTab === 'borrow' && availableBorrowsUSD <= 0
          const supplyDisabled = activeTab === 'supply' && (isPoolFull(selectedAsset) || hasInsufficientBalance)
          const borrowDisabled = activeTab === 'borrow' && (availableBorrowsUSD <= 0 || (amount && parseFloat(amount) > 0 && previewHF < 1))
          const isDisabled = loading || !amount || parseFloat(amount) <= 0 || supplyDisabled || borrowDisabled || borrowNoCollateral
          const isRed = hasInsufficientBalance || borrowNoCollateral
          return (
            <button
              onClick={handleSubmit}
              disabled={isDisabled}
              className="relative group w-full disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className={`${isRed ? 'bg-red-900' : 'bg-purple-900'} absolute inset-0 translate-x-2 translate-y-2`} />
              <div
                className={`relative px-6 py-4 border-4 text-white flex items-center justify-center gap-3 transition-transform ${
                  isRed ? 'bg-slate-700 border-slate-600' : 'bg-purple-600 border-purple-400'
                } ${!loading && !isRed ? 'group-hover:-translate-y-1 group-active:translate-y-0' : ''}`}
              >
                {loading ? (
                  <>
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-2 h-2 bg-white"
                          style={{ animation: `pixelBounce 0.6s ease-in-out infinite`, animationDelay: `${i * 0.15}s` }}
                        />
                      ))}
                    </div>
                    <span className="text-xs" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      PROCESSING...
                    </span>
                  </>
                ) : (
                  <span className="text-xs" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                    {activeTab === 'supply'
                      ? (hasInsufficientBalance ? `NOT ENOUGH ${selectedAsset}` : (isPoolFull(selectedAsset) ? '⛔ POOL FULL' : (existingAsset ? 'SUPPLY MORE' : 'SUPPLY & BUILD')))
                      : (borrowNoCollateral ? 'NO COLLATERAL TO BORROW' : 'BORROW')}
                  </span>
                )}
              </div>
            </button>
          )
        })()}

        {/* Current Positions */}
        {(position.supplies.filter((s: any) => s.amount > 0.0001).length > 0 || 
          position.borrows.filter((b: any) => b.amount > 0.0001).length > 0) && (
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
                  {existingAsset ? `POSITION: ${existingAsset}` : 'SUPPLIED:'}
                </p>
                <div className="space-y-1">
                  {position.supplies
                    .filter((s: any) => (!existingAsset || s.asset === existingAsset) && s.amount > 0.0001)
                    .map((s: any) => (
                      <div
                        key={s.asset}
                        className="flex justify-between items-center bg-slate-900/50 p-2"
                      >
                      <div className="flex flex-col">
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
                          className="text-green-400 text-[6px] mt-1"
                          style={{ fontFamily: '"Press Start 2P", monospace' }}
                        >
                          +{s.apy}% APY
                        </span>
                      </div>
                      <div className="flex gap-1">
                        {existingAsset && buildingId && (
                          <button
                            onClick={() => openHarvestModal(s.asset, s.amount)}
                            disabled={loading}
                            className="px-2 py-1 bg-amber-900/40 border border-amber-600 text-amber-400 text-[6px] hover:bg-amber-800/60 hover:text-white transition-colors disabled:opacity-50"
                            style={{ fontFamily: '"Press Start 2P", monospace' }}
                          >
                            {loadingHarvest ? '...' : 'HARVEST'}
                          </button>
                        )}
                        <button
                          onClick={() => handleWithdraw(s.asset, s.amount)}
                          disabled={loading}
                          className="px-2 py-1 bg-red-900/40 border border-red-700 text-red-400 text-[6px] hover:bg-red-800/60 hover:text-white transition-colors disabled:opacity-50"
                          style={{ fontFamily: '"Press Start 2P", monospace' }}
                        >
                          {loadingWithdraw ? '...' : 'WITHDRAW'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Borrows */}
            {position.borrows.filter((b: any) => (!existingAsset || b.asset === existingAsset) && b.amount > 0.0001).length > 0 && (
              <div>
                <p
                  className="text-orange-400 text-[6px] mb-2"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {existingAsset ? `BORROWED: ${existingAsset}` : 'BORROWED:'}
                </p>
                <div className="space-y-1">
                  {position.borrows
                    .filter((b: any) => (!existingAsset || b.asset === existingAsset) && b.amount > 0.0001)
                    .map((b: any) => (
                      <div
                        key={b.asset}
                        className="flex justify-between items-center bg-slate-900/50 p-2"
                      >
                        <div className="flex flex-col">
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
                            className="text-orange-400 text-[6px] mt-1"
                            style={{ fontFamily: '"Press Start 2P", monospace' }}
                          >
                            -{b.apy}% APY
                          </span>
                        </div>

                        <button
                          onClick={() => handleRepay(b.asset, b.amount, true)}
                          disabled={loading}
                          className="px-2 py-1 bg-green-900/40 border border-green-700 text-green-400 text-[6px] hover:bg-green-800/60 hover:text-white transition-colors disabled:opacity-50"
                          style={{ fontFamily: '"Press Start 2P", monospace' }}
                        >
                          {loadingRepay ? '...' : 'REPAY'}
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Demolish building (only when viewing a specific Bank) */}
            {existingAsset && buildingId && (
              <div className="mt-4 pt-3 border-t border-slate-700">
                <p className="text-slate-500 text-[6px] mb-2" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                  DEMOLISH BUILDING
                </p>
                {hasOpenBorrows ? (
                  <div className="bg-red-900/20 border border-red-700 p-2">
                    <p className="text-red-400 text-[6px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                      Repay all borrows before demolishing.
                    </p>
                    <button
                      disabled
                      className="mt-2 px-3 py-1.5 bg-slate-700 border border-slate-600 text-slate-500 text-[6px] cursor-not-allowed"
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      DEMOLISH
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={openDemolishModal}
                    disabled={loading}
                    className="w-full px-3 py-2 bg-red-900/40 border-2 border-red-700 text-red-400 text-[6px] hover:bg-red-800/60 hover:text-white transition-colors disabled:opacity-50"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    {loadingWithdraw ? '...' : 'DEMOLISH'}
                  </button>
                )}
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
