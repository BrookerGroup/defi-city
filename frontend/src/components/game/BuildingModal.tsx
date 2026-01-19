'use client'

import { useState, useEffect, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BUILDING_INFO, BuildingType } from '@/types'
import { useSmartWallet, useWalletBalance, useMultiTokenBalance, useTokenPrices } from '@/hooks'
import { usePrivy } from '@privy-io/react-auth'
import { formatEther } from 'viem'
import { X } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

// Building asset types
type BuildingAsset = 'ETH' | 'USDC' | 'USDT' | 'WBTC' | 'WETH'

// Building fee (0.05%)
const BUILDING_FEE_BPS = 5

// Placeable buildings (exclude Town Hall)
const PLACEABLE_BUILDINGS: BuildingType[] = ['bank', 'shop', 'lottery']

interface BuildingModalProps {
  open: boolean
  onClose: () => void
  buildingType: BuildingType | null
  position: { x: number; y: number } | null
  onConfirm: (buildingType: BuildingType, asset: BuildingAsset, amount: string) => void
}

// Pixel Art Building Preview
function PixelBuildingPreview({ type }: { type: BuildingType }) {
  const info = BUILDING_INFO[type]
  const { colors } = info

  return (
    <svg
      width={80}
      height={80}
      viewBox="0 0 16 16"
      style={{ imageRendering: 'pixelated' }}
    >
      <rect x="2" y="14" width="12" height="2" fill={colors.accent} />
      <rect x="3" y="6" width="10" height="8" fill={colors.wall} />

      {type === 'townhall' ? (
        <>
          <rect x="4" y="4" width="8" height="2" fill={colors.roof} />
          <rect x="5" y="2" width="6" height="2" fill={colors.roof} />
          <rect x="7" y="1" width="2" height="1" fill={colors.roof} />
          <rect x="7" y="0" width="1" height="1" fill={colors.accent} />
        </>
      ) : type === 'bank' ? (
        <>
          <rect x="2" y="5" width="12" height="1" fill={colors.roof} />
          <rect x="3" y="4" width="10" height="1" fill={colors.roof} />
          <rect x="4" y="6" width="1" height="8" fill={colors.accent} />
          <rect x="7" y="6" width="2" height="8" fill={colors.accent} />
          <rect x="11" y="6" width="1" height="8" fill={colors.accent} />
        </>
      ) : type === 'shop' ? (
        <>
          <rect x="2" y="5" width="12" height="2" fill={colors.roof} />
          <rect x="2" y="5" width="2" height="2" fill={colors.accent} />
          <rect x="6" y="5" width="2" height="2" fill={colors.accent} />
          <rect x="10" y="5" width="2" height="2" fill={colors.accent} />
          <rect x="5" y="3" width="6" height="2" fill={colors.accent} />
        </>
      ) : (
        <>
          <rect x="3" y="4" width="10" height="2" fill={colors.roof} />
          <rect x="6" y="2" width="4" height="2" fill={colors.roof} />
          <rect x="7" y="1" width="2" height="1" fill={colors.accent} />
          <rect x="7" y="0" width="2" height="1" fill="#FCD34D" />
        </>
      )}

      <rect x="4" y="7" width="2" height="2" fill={colors.window} />
      <rect x="10" y="7" width="2" height="2" fill={colors.window} />
      <rect x="6" y="10" width="4" height="4" fill={colors.accent} />
      <rect x="7" y="11" width="2" height="3" fill={colors.window} />
    </svg>
  )
}

export function BuildingModal({
  open,
  onClose,
  buildingType,
  position,
  onConfirm,
}: BuildingModalProps) {
  const [selectedType, setSelectedType] = useState<BuildingType | null>(buildingType)
  const [selectedAsset, setSelectedAsset] = useState<BuildingAsset | null>(null)
  const [amount, setAmount] = useState('')
  const [isAssetSelectorOpen, setIsAssetSelectorOpen] = useState(false)
  const [step, setStep] = useState<'select-building' | 'configure'>(
    buildingType ? 'configure' : 'select-building'
  )

  const { user } = usePrivy()
  const eoaAddress = user?.wallet?.address as `0x${string}` | undefined
  const { walletAddress } = useSmartWallet(eoaAddress)

  // Get balances
  const { formatted: ethBalance } = useWalletBalance(walletAddress ?? undefined)
  const tokenBalances = useMultiTokenBalance(walletAddress ?? undefined)
  const { getPrice, formatUSD, calculateUSDValue } = useTokenPrices()

  // Get balance for selected asset
  const getBalance = (asset: BuildingAsset): string => {
    switch (asset) {
      case 'ETH': return ethBalance
      case 'USDC': return tokenBalances.USDC.formatted
      case 'USDT': return tokenBalances.USDT.formatted
      case 'WBTC': return tokenBalances.WBTC.formatted
      case 'WETH': return tokenBalances.WETH.formatted
      default: return '0'
    }
  }

  // Calculate USD value of input amount
  const amountUSD = useMemo(() => {
    if (!selectedAsset || !amount) return 0
    return calculateUSDValue(selectedAsset, amount)
  }, [selectedAsset, amount, calculateUSDValue])

  // Calculate fee
  const feeUSD = useMemo(() => {
    return amountUSD * (BUILDING_FEE_BPS / 10000)
  }, [amountUSD])

  // Validation
  const info = selectedType ? BUILDING_INFO[selectedType] : null
  const minDeposit = info?.minDeposit ?? 0
  const isAmountValid = amountUSD >= minDeposit
  const hasEnoughBalance = selectedAsset ? parseFloat(amount || '0') <= parseFloat(getBalance(selectedAsset)) : false

  // Sync state when modal opens
  useEffect(() => {
    if (open && buildingType) {
      setSelectedType(buildingType)
      setStep('configure')
      const buildingInfo = BUILDING_INFO[buildingType]
      if (buildingInfo.supportedAssets.length > 0) {
        setSelectedAsset(buildingInfo.supportedAssets[0])
      }
    }
  }, [open, buildingType])

  const handleSelectBuilding = (type: BuildingType) => {
    setSelectedType(type)
    const buildingInfo = BUILDING_INFO[type]
    // Auto-select first supported asset
    if (buildingInfo.supportedAssets.length > 0) {
      setSelectedAsset(buildingInfo.supportedAssets[0])
    }
    setStep('configure')
  }

  const handleConfirm = () => {
    if (!selectedType || !selectedAsset || !amount || !isAmountValid || !hasEnoughBalance) return
    onConfirm(selectedType, selectedAsset, amount)
    handleClose()
  }

  const handleClose = () => {
    setSelectedType(buildingType)
    setSelectedAsset(null)
    setAmount('')
    setStep('select-building')
    onClose()
  }

  const handleBack = () => {
    setStep('select-building')
    setSelectedAsset(null)
    setAmount('')
  }

  const handleCancel = () => {
    handleClose()
  }

  // Get formatted balance for selected asset
  const formattedBalance = selectedAsset ? getBalance(selectedAsset) : '0'

  // Building selection step
  if (step === 'select-building') {
    return (
      <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Select Building Type</DialogTitle>
            <DialogDescription>
              Choose a building to place at position ({position?.x}, {position?.y})
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 gap-3 py-4">
            {PLACEABLE_BUILDINGS.map((type) => {
              const buildingInfo = BUILDING_INFO[type]
              return (
                <Card
                  key={type}
                  className="cursor-pointer hover:border-primary transition-colors"
                  onClick={() => handleSelectBuilding(type)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                        style={{ backgroundColor: `${buildingInfo.colors.accent}30` }}
                      >
                        {type === 'bank' ? '🏦' : type === 'shop' ? '🏪' : type === 'lottery' ? '🎰' : '🏛️'}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{buildingInfo.name}</h3>
                          <Badge variant="outline">{buildingInfo.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {buildingInfo.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          {buildingInfo.minDeposit && buildingInfo.minDeposit > 0 && (
                            <span className="text-muted-foreground">
                              Min: ${buildingInfo.minDeposit}
                            </span>
                          )}
                          <Badge
                            variant="outline"
                            className={
                              buildingInfo.risk === 'Conservative'
                                ? 'text-green-500 border-green-500/30'
                                : buildingInfo.risk === 'Moderate'
                                ? 'text-amber-500 border-amber-500/30'
                                : 'text-red-500 border-red-500/30'
                            }
                          >
                            {buildingInfo.risk}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )
  }

  // Configuration step
  if (!selectedType || !info) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60"
            onClick={handleCancel}
          />

          {/* Modal */}
          <motion.div
            className="relative z-10 w-full max-w-md mx-4 border-4"
            style={{
              backgroundColor: '#0f172a',
              borderColor: info.colors.accent,
              boxShadow: `8px 8px 0px ${info.colors.accent}40`
            }}
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
          >
            {/* Header */}
            <div
              className="flex items-center justify-between px-4 py-3 border-b-2"
              style={{ borderColor: info.colors.accent }}
            >
              <div className="flex items-center gap-3">
                <PixelBuildingPreview type={selectedType!} />
                <div>
                  <h3
                    className="text-lg"
                    style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: '14px',
                      color: info.colors.roof
                    }}
                  >
                    Build {info.name}
                  </h3>
                  <p
                    className="text-sm mt-1"
                    style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: '8px',
                      color: '#64748b'
                    }}
                  >
                    {info.category}
                  </p>
                </div>
              </div>
              <button
                onClick={handleCancel}
                className="p-2 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-400">{info.description}</p>

              {/* Features */}
              <div className="space-y-2">
                {info.features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <div
                      className="w-2 h-2"
                      style={{ backgroundColor: info.colors.roof }}
                    />
                    <span className="text-sm text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>

              {/* Risk Level */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-700">
                <span className="text-xs text-slate-500">Risk Level</span>
                <span
                  className="text-xs px-2 py-1 border"
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    fontSize: '8px',
                    color: info.riskColor,
                    borderColor: info.riskColor,
                    backgroundColor: `${info.riskColor}15`
                  }}
                >
                  {info.risk}
                </span>
              </div>

              {/* Deposit Input */}
              <div className="pt-4 border-t border-slate-700">
                <div className="flex justify-between text-xs mb-2">
                  <span className="text-slate-500">Deposit Amount (Optional)</span>
                  <span className="text-slate-400">
                    Balance: {parseFloat(formattedBalance).toFixed(4)} ETH
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="0.0"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    step="0.001"
                    min="0"
                    className="flex-1 px-3 py-2 bg-slate-800 border-2 border-slate-600 text-white font-mono focus:border-emerald-500 focus:outline-none"
                  />
                  <span className="flex items-center px-3 bg-slate-800 border-2 border-slate-600 text-sm text-slate-400">
                    ETH
                  </span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t-2" style={{ borderColor: info.colors.accent }}>
              <button
                onClick={handleCancel}
                className="flex-1 py-3 border-2 border-slate-600 text-slate-400 hover:bg-slate-800 transition-colors"
                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 py-3 border-2 text-white transition-all hover:brightness-110"
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: '10px',
                  borderColor: info.colors.roof,
                  backgroundColor: info.colors.accent,
                  boxShadow: `3px 3px 0px ${info.colors.roof}`
                }}
              >
                Build
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
