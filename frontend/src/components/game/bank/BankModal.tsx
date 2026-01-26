'use client'

import { useState, useMemo, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { usePrivy } from '@privy-io/react-auth'
import { AaveAsset, AAVE_MARKET_DATA, ASSET_PRICES } from '@/types/aave'
import { useAavePosition } from '@/hooks/useAavePosition'
import { useSmartWallet, useUserBuildings } from '@/hooks/useContracts'
import { useTokenBalance } from '@/hooks'
import { AssetSelector, AssetDropdown } from './AssetSelector'
import { HealthFactorBar, RiskIndicator } from './HealthFactorBar'
import { AavePositionPanel, BorrowingCapacity } from './AavePositionPanel'

type TabType = 'supply' | 'supply-borrow' | 'position'

interface BankModalProps {
  onClose: () => void
  onConfirm?: () => void
}

export function BankModal({ onClose, onConfirm }: BankModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('supply')
  const { user } = usePrivy()
  const userAddress = user?.wallet?.address
  const { smartWallet } = useSmartWallet(userAddress)
  const { buildings } = useUserBuildings(userAddress)
  
  const {
    position,
    loading,
    supply,
    borrow,
    previewHealthFactor,
    getMaxBorrow,
    marketData,
  } = useAavePosition()

  // Supply tab state
  const [supplyAsset, setSupplyAsset] = useState<AaveAsset>('USDC')
  const [supplyAmount, setSupplyAmount] = useState('')
  
  // Get token balance for selected asset
  const { balance: tokenBalance, loading: balanceLoading } = useTokenBalance(userAddress, supplyAsset)
  
  // Debug: Log smart wallet address (only once, not on every render)
  useEffect(() => {
    if (smartWallet && userAddress) {
      console.log('Smart Wallet Address:', smartWallet)
      console.log('User Address (EOA):', userAddress)
    }
  }, [smartWallet, userAddress])

  // Supply + Borrow tab state
  const [collateralAsset, setCollateralAsset] = useState<AaveAsset>('ETH')
  const [collateralAmount, setCollateralAmount] = useState('')
  const [borrowAsset, setBorrowAsset] = useState<AaveAsset>('USDC')
  const [borrowAmount, setBorrowAmount] = useState('')

  // Calculate preview health factor for supply + borrow
  const previewHF = useMemo(() => {
    const collateralNum = parseFloat(collateralAmount) || 0
    const borrowNum = parseFloat(borrowAmount) || 0
    return previewHealthFactor(
      collateralAsset,
      collateralNum,
      borrowAsset,
      borrowNum
    )
  }, [collateralAsset, collateralAmount, borrowAsset, borrowAmount, previewHealthFactor])

  // Calculate max borrow based on collateral
  const maxBorrow = useMemo(() => {
    const collateralNum = parseFloat(collateralAmount) || 0
    const collateralUSD = collateralNum * ASSET_PRICES[collateralAsset]
    const ltv = AAVE_MARKET_DATA.assets[collateralAsset].ltv
    const maxBorrowUSD = collateralUSD * ltv
    return maxBorrowUSD / ASSET_PRICES[borrowAsset]
  }, [collateralAsset, collateralAmount, borrowAsset])

  // Handle supply submit
  const handleSupply = async () => {
    const amount = parseFloat(supplyAmount)
    if (isNaN(amount) || amount <= 0) {
      toast.error('Please enter a valid amount')
      return
    }

    if (!userAddress) {
      toast.error('Please connect your wallet first')
      return
    }

    if (!smartWallet) {
      toast.error('Please create a Smart Wallet first (create Town Hall)')
      return
    }

    toast.loading('Supplying to Aave...', { id: 'supply' })
    
    try {
      const result = await supply(supplyAsset, amount)
      if (result.success) {
        toast.success('Supply successful!', { 
          id: 'supply',
          description: 'Your tokens have been supplied to Aave Pool'
        })
        setSupplyAmount('')
        // Switch to position tab to show result
        setActiveTab('position')
        onConfirm?.()
      } else {
        // Show detailed error with action button
        const errorMsg = result.error || 'Supply failed'
        toast.error(errorMsg, { 
          id: 'supply',
          duration: 10000, // Show longer for important errors
          action: errorMsg.includes('Insufficient') ? {
            label: 'Get Tokens',
            onClick: () => {
              window.open('https://www.coinbase.com/faucets/base-ethereum-goerli-faucet', '_blank')
            }
          } : undefined
        })
      }
    } catch (error: any) {
      toast.error(error.message || 'Supply failed', { 
        id: 'supply',
        duration: 10000
      })
    }
  }

  // Handle supply + borrow submit
  const handleSupplyAndBorrow = async () => {
    const collateralNum = parseFloat(collateralAmount)
    const borrowNum = parseFloat(borrowAmount)

    if (isNaN(collateralNum) || collateralNum <= 0) return

    // First supply collateral
    const supplyResult = await supply(collateralAsset, collateralNum)
    if (!supplyResult.success) return

    // Then borrow if amount specified
    if (!isNaN(borrowNum) && borrowNum > 0) {
      const borrowResult = await borrow(borrowAsset, borrowNum)
      if (!borrowResult.success) return
    }

    setCollateralAmount('')
    setBorrowAmount('')
    setActiveTab('position')
  }

  const tabs = [
    { id: 'supply' as TabType, label: 'Supply', icon: '📈' },
    { id: 'supply-borrow' as TabType, label: 'Supply + Borrow', icon: '🔄' },
    { id: 'position' as TabType, label: 'Position', icon: '📊' },
  ]

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      />

      {/* Modal */}
      <motion.div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl"
        style={{
          background: 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)',
          border: '1px solid rgba(148, 163, 184, 0.2)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        }}
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🏦</span>
              <div>
                <h2
                  className="text-xl font-bold text-white"
                  style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '14px' }}
                >
                  DEFI BANK
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Powered by Aave V3
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-slate-700/50 transition-colors"
            >
              <svg
                className="w-6 h-6 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mt-4">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all
                  ${
                    activeTab === tab.id
                      ? 'bg-blue-500 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }
                `}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          <AnimatePresence mode="wait">
            {activeTab === 'supply' && (
              <motion.div
                key="supply"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                {/* Smart Wallet Info */}
                {smartWallet && (
                  <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400">Smart Wallet:</span>
                      <span className="text-blue-400 font-mono">{smartWallet.slice(0, 6)}...{smartWallet.slice(-4)}</span>
                    </div>
                    <div className="mt-1 text-xs text-slate-500">
                      💡 Tokens ไม่ต้องถูก transfer ไป Smart Wallet - supply จะใช้ tokens จาก EOA wallet ของคุณโดยตรง
                    </div>
                  </div>
                )}
                <SupplyTab
                  selectedAsset={supplyAsset}
                  onSelectAsset={setSupplyAsset}
                  amount={supplyAmount}
                  onAmountChange={setSupplyAmount}
                  onSubmit={handleSupply}
                  loading={loading}
                  marketData={marketData}
                  tokenBalance={tokenBalance}
                  balanceLoading={balanceLoading}
                />
              </motion.div>
            )}

            {activeTab === 'supply-borrow' && (
              <motion.div
                key="supply-borrow"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <SupplyBorrowTab
                  collateralAsset={collateralAsset}
                  onSelectCollateral={setCollateralAsset}
                  collateralAmount={collateralAmount}
                  onCollateralChange={setCollateralAmount}
                  borrowAsset={borrowAsset}
                  onSelectBorrow={setBorrowAsset}
                  borrowAmount={borrowAmount}
                  onBorrowChange={setBorrowAmount}
                  maxBorrow={maxBorrow}
                  previewHF={previewHF}
                  onSubmit={handleSupplyAndBorrow}
                  loading={loading}
                  marketData={marketData}
                  position={position}
                />
              </motion.div>
            )}

            {activeTab === 'position' && (
              <motion.div
                key="position"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <AavePositionPanel position={position} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  )
}

// Supply Tab Component
function SupplyTab({
  selectedAsset,
  onSelectAsset,
  amount,
  onAmountChange,
  onSubmit,
  loading,
  marketData,
  tokenBalance,
  balanceLoading,
}: {
  selectedAsset: AaveAsset
  onSelectAsset: (asset: AaveAsset) => void
  amount: string
  onAmountChange: (value: string) => void
  onSubmit: () => void
  loading: boolean
  marketData: typeof AAVE_MARKET_DATA
  tokenBalance?: string
  balanceLoading?: boolean
}) {
  const assetInfo = marketData.assets[selectedAsset]
  const amountNum = parseFloat(amount) || 0
  const usdValue = amountNum * ASSET_PRICES[selectedAsset]
  const yearlyEarnings = usdValue * (assetInfo.supplyAPY / 100)
  const balanceNum = parseFloat(tokenBalance || '0')
  const hasInsufficientBalance = amountNum > 0 && amountNum > balanceNum

  return (
    <div className="space-y-6">
      {/* Asset Selection */}
      <div>
        <label className="block text-sm text-slate-400 mb-3">Select Asset to Supply</label>
        <AssetSelector
          selectedAsset={selectedAsset}
          onSelect={onSelectAsset}
          showAPY="supply"
        />
      </div>

      {/* Amount Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm text-slate-400">Amount</label>
          {balanceLoading ? (
            <span className="text-xs text-slate-500">Loading balance...</span>
          ) : (
            <span className="text-xs text-slate-400">
              Balance: <span className={hasInsufficientBalance ? 'text-red-400' : 'text-slate-300'}>{tokenBalance || '0'} {selectedAsset}</span>
            </span>
          )}
        </div>
        <div className="relative">
          <input
            type="number"
            value={amount}
            onChange={(e) => onAmountChange(e.target.value)}
            placeholder="0.00"
            className={`w-full px-4 py-4 rounded-xl bg-slate-800 border-2 text-white text-xl font-medium placeholder-slate-500
              focus:outline-none transition-colors ${
                hasInsufficientBalance 
                  ? 'border-red-500 focus:border-red-500' 
                  : 'border-slate-600 focus:border-blue-500'
              }`}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">
            {selectedAsset}
          </div>
          {balanceNum > 0 && (
            <button
              type="button"
              onClick={() => onAmountChange(balanceNum.toString())}
              className="absolute right-16 top-1/2 -translate-y-1/2 text-xs text-blue-400 hover:text-blue-300"
            >
              MAX
            </button>
          )}
        </div>
        {hasInsufficientBalance && (
          <div className="mt-2 p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
            <p className="text-xs text-red-400">
              Insufficient balance. You need {amountNum.toFixed(6)} {selectedAsset} but only have {tokenBalance} {selectedAsset}.
            </p>
          </div>
        )}
        {amountNum > 0 && !hasInsufficientBalance && (
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="text-slate-400">
              ≈ ${usdValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span className="text-emerald-400">
              +${yearlyEarnings.toFixed(2)}/year
            </span>
          </div>
        )}
      </div>

      {/* APY Info */}
      <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
        <div className="flex items-center justify-between">
          <span className="text-sm text-emerald-400">Supply APY</span>
          <span className="text-2xl font-bold text-emerald-400">
            {assetInfo.supplyAPY.toFixed(2)}%
          </span>
        </div>
      </div>

      {/* Submit Button */}
      <motion.button
        onClick={onSubmit}
        disabled={loading || amountNum <= 0}
        className={`
          w-full py-4 rounded-xl font-bold text-lg transition-all
          ${
            loading || amountNum <= 0
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
          }
        `}
        whileHover={!loading && amountNum > 0 ? { scale: 1.02 } : {}}
        whileTap={!loading && amountNum > 0 ? { scale: 0.98 } : {}}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              ⏳
            </motion.span>
            Processing...
          </span>
        ) : (
          `Supply ${selectedAsset}`
        )}
      </motion.button>
    </div>
  )
}

// Supply + Borrow Tab Component
function SupplyBorrowTab({
  collateralAsset,
  onSelectCollateral,
  collateralAmount,
  onCollateralChange,
  borrowAsset,
  onSelectBorrow,
  borrowAmount,
  onBorrowChange,
  maxBorrow,
  previewHF,
  onSubmit,
  loading,
  marketData,
  position,
}: {
  collateralAsset: AaveAsset
  onSelectCollateral: (asset: AaveAsset) => void
  collateralAmount: string
  onCollateralChange: (value: string) => void
  borrowAsset: AaveAsset
  onSelectBorrow: (asset: AaveAsset) => void
  borrowAmount: string
  onBorrowChange: (value: string) => void
  maxBorrow: number
  previewHF: number
  onSubmit: () => void
  loading: boolean
  marketData: typeof AAVE_MARKET_DATA
  position: ReturnType<typeof useAavePosition>['position']
}) {
  const collateralInfo = marketData.assets[collateralAsset]
  const borrowInfo = marketData.assets[borrowAsset]
  const collateralNum = parseFloat(collateralAmount) || 0
  const borrowNum = parseFloat(borrowAmount) || 0
  const collateralUSD = collateralNum * ASSET_PRICES[collateralAsset]
  const borrowUSD = borrowNum * ASSET_PRICES[borrowAsset]

  const isValid = collateralNum > 0 && (borrowNum === 0 || (borrowNum > 0 && previewHF > 1))

  return (
    <div className="space-y-6">
      {/* Collateral Section */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
        <h3 className="text-sm font-medium text-emerald-400 mb-4 flex items-center gap-2">
          <span>📈</span> Collateral (Supply)
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <AssetDropdown
            selectedAsset={collateralAsset}
            onSelect={onSelectCollateral}
            label="Asset"
          />
          <div>
            <label className="block text-xs text-slate-400 mb-1">Amount</label>
            <input
              type="number"
              value={collateralAmount}
              onChange={(e) => onCollateralChange(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl bg-slate-700 border-2 border-slate-600
                text-white font-medium placeholder-slate-500
                focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {collateralNum > 0 && (
          <div className="flex items-center justify-between mt-3 text-sm">
            <span className="text-slate-400">
              ≈ ${collateralUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span className="text-emerald-400">
              APY: +{collateralInfo.supplyAPY.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Arrow Divider */}
      <div className="flex justify-center">
        <div className="p-2 rounded-full bg-slate-700">
          <svg
            className="w-6 h-6 text-slate-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 14l-7 7m0 0l-7-7m7 7V3"
            />
          </svg>
        </div>
      </div>

      {/* Borrow Section */}
      <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
        <h3 className="text-sm font-medium text-amber-400 mb-4 flex items-center gap-2">
          <span>📉</span> Borrow
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <AssetDropdown
            selectedAsset={borrowAsset}
            onSelect={onSelectBorrow}
            label="Asset"
          />
          <div>
            <label className="block text-xs text-slate-400 mb-1">Amount</label>
            <input
              type="number"
              value={borrowAmount}
              onChange={(e) => onBorrowChange(e.target.value)}
              placeholder="0.00"
              className="w-full px-4 py-3 rounded-xl bg-slate-700 border-2 border-slate-600
                text-white font-medium placeholder-slate-500
                focus:outline-none focus:border-amber-500 transition-colors"
            />
          </div>
        </div>

        {collateralNum > 0 && (
          <div className="flex items-center justify-between mt-3 text-sm">
            <span className="text-slate-400">
              Max: {maxBorrow.toLocaleString(undefined, { maximumFractionDigits: 4 })} {borrowAsset}
            </span>
            <button
              onClick={() => onBorrowChange(maxBorrow.toString())}
              className="text-blue-400 hover:text-blue-300 text-xs"
            >
              Use Max
            </button>
          </div>
        )}

        {borrowNum > 0 && (
          <div className="flex items-center justify-between mt-2 text-sm">
            <span className="text-slate-400">
              ≈ ${borrowUSD.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
            <span className="text-amber-400">
              APY: -{borrowInfo.borrowAPY.toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      {/* Health Factor Preview */}
      {(collateralNum > 0 || borrowNum > 0) && (
        <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700">
          <HealthFactorBar
            value={position.healthFactor}
            previewValue={previewHF}
          />
        </div>
      )}

      {/* Warning for risky position */}
      {previewHF < 1.5 && previewHF !== Infinity && borrowNum > 0 && (
        <motion.div
          className="p-4 rounded-xl bg-red-500/20 border border-red-500/30"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex items-center gap-2 text-red-400">
            <span>⚠️</span>
            <span className="text-sm font-medium">
              {previewHF < 1
                ? 'This position would be immediately liquidatable!'
                : 'This is a risky position. Consider borrowing less.'}
            </span>
          </div>
        </motion.div>
      )}

      {/* Submit Button */}
      <motion.button
        onClick={onSubmit}
        disabled={loading || !isValid}
        className={`
          w-full py-4 rounded-xl font-bold text-lg transition-all
          ${
            loading || !isValid
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }
        `}
        whileHover={!loading && isValid ? { scale: 1.02 } : {}}
        whileTap={!loading && isValid ? { scale: 0.98 } : {}}
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              ⏳
            </motion.span>
            Processing...
          </span>
        ) : borrowNum > 0 ? (
          `Supply ${collateralAsset} & Borrow ${borrowAsset}`
        ) : (
          `Supply ${collateralAsset}`
        )}
      </motion.button>
    </div>
  )
}
