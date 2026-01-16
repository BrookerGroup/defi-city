'use client'

import { useState, useMemo } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import {
  BUILDING_INFO,
  BuildingType,
  BuildingAsset,
  BUILDING_FEE_BPS,
  PLACEABLE_BUILDINGS,
} from '@/types'
import { useSmartWallet, useMultiTokenBalance, useWalletBalance, useTokenPrices } from '@/hooks'
import { usePrivy } from '@privy-io/react-auth'
import { ChevronDown, Check, AlertCircle, Loader2 } from 'lucide-react'

interface BuildingModalProps {
  open: boolean
  onClose: () => void
  buildingType: BuildingType | null
  position: { x: number; y: number } | null
  onConfirm: (asset: BuildingAsset, amount: string) => void
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
  const [step, setStep] = useState<'select-building' | 'configure'>('select-building')

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
    if (!selectedAsset || !amount || !isAmountValid || !hasEnoughBalance) return
    onConfirm(selectedAsset, amount)
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
                        style={{ backgroundColor: `#${buildingInfo.color.toString(16).padStart(6, '0')}30` }}
                      >
                        {buildingInfo.icon}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h3 className="font-semibold">{buildingInfo.name}</h3>
                          <Badge variant="outline">{buildingInfo.protocol}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {buildingInfo.description}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs">
                          {buildingInfo.apy && (
                            <span className="text-green-500">APY: {buildingInfo.apy}</span>
                          )}
                          {buildingInfo.minDepositDisplay && (
                            <span className="text-muted-foreground">
                              Min: {buildingInfo.minDepositDisplay}
                            </span>
                          )}
                          <Badge
                            variant="outline"
                            className={
                              buildingInfo.risk === 'low'
                                ? 'text-green-500 border-green-500/30'
                                : buildingInfo.risk === 'medium'
                                ? 'text-amber-500 border-amber-500/30'
                                : 'text-red-500 border-red-500/30'
                            }
                          >
                            {buildingInfo.risk} risk
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
    <Dialog open={open} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="text-2xl">{info.icon}</span>
            Build {info.name}
          </DialogTitle>
          <DialogDescription>{info.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Building Info */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Protocol</span>
              <Badge variant="secondary">{info.protocol}</Badge>
            </div>
            {info.apy && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Expected APY</span>
                <span className="font-mono text-green-500">{info.apy}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Min Deposit</span>
              <span className="font-mono">{info.minDepositDisplay || 'None'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Building Fee</span>
              <span className="font-mono">{BUILDING_FEE_BPS / 100}%</span>
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            {/* Asset Selector */}
            <div className="space-y-2">
              <label className="text-sm text-muted-foreground">Select Asset</label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsAssetSelectorOpen(!isAssetSelectorOpen)}
                  className="w-full flex items-center justify-between px-3 py-2 border rounded-md bg-background hover:bg-muted/50 transition-colors"
                >
                  {selectedAsset ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{selectedAsset}</span>
                      <span className="text-muted-foreground text-sm">
                        (Balance: {parseFloat(getBalance(selectedAsset)).toFixed(4)})
                      </span>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Select an asset</span>
                  )}
                  <ChevronDown className={`h-4 w-4 transition-transform ${isAssetSelectorOpen ? 'rotate-180' : ''}`} />
                </button>

                {isAssetSelectorOpen && (
                  <div className="absolute z-10 w-full mt-1 border rounded-md bg-background shadow-lg">
                    {info.supportedAssets.map((asset) => {
                      const balance = getBalance(asset)
                      const balanceUSD = calculateUSDValue(asset, balance)

                      return (
                        <button
                          key={asset}
                          type="button"
                          onClick={() => {
                            setSelectedAsset(asset)
                            setIsAssetSelectorOpen(false)
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 hover:bg-muted/50 first:rounded-t-md last:rounded-b-md ${
                            selectedAsset === asset ? 'bg-muted/50' : ''
                          }`}
                        >
                          <span className="font-medium">{asset}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-muted-foreground">
                              {parseFloat(balance).toFixed(4)} ({formatUSD(balanceUSD)})
                            </span>
                            {selectedAsset === asset && (
                              <Check className="h-4 w-4 text-primary" />
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Amount Input */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Deposit Amount</span>
                {selectedAsset && (
                  <button
                    onClick={() => setAmount(getBalance(selectedAsset))}
                    className="text-primary hover:underline text-xs"
                  >
                    Max: {parseFloat(getBalance(selectedAsset)).toFixed(4)} {selectedAsset}
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  step="0.001"
                  min="0"
                />
                <span className="flex items-center px-3 bg-muted rounded-md text-sm font-medium min-w-[60px] justify-center">
                  {selectedAsset || '---'}
                </span>
              </div>
              {amount && (
                <div className="text-sm text-muted-foreground">
                  ≈ {formatUSD(amountUSD)}
                </div>
              )}
            </div>

            {/* Fee Display */}
            {amount && amountUSD > 0 && (
              <div className="p-3 bg-muted/50 rounded-md space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deposit</span>
                  <span className="font-mono">{formatUSD(amountUSD)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Fee ({BUILDING_FEE_BPS / 100}%)</span>
                  <span className="font-mono text-amber-500">-{formatUSD(feeUSD)}</span>
                </div>
                <div className="border-t pt-1 mt-1 flex justify-between text-sm font-medium">
                  <span>Net Deposit</span>
                  <span className="font-mono">{formatUSD(amountUSD - feeUSD)}</span>
                </div>
              </div>
            )}

            {/* Validation Messages */}
            {amount && !isAmountValid && (
              <div className="flex items-center gap-2 text-sm text-amber-500">
                <AlertCircle className="h-4 w-4" />
                Minimum deposit is {info.minDepositDisplay}
              </div>
            )}
            {amount && selectedAsset && !hasEnoughBalance && (
              <div className="flex items-center gap-2 text-sm text-red-500">
                <AlertCircle className="h-4 w-4" />
                Insufficient {selectedAsset} balance
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={handleBack}>
            Back
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selectedAsset || !amount || !isAmountValid || !hasEnoughBalance}
          >
            Build {info.name}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
