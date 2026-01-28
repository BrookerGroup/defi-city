'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Building, BUILDING_INFO } from '@/types'
import { Trash2, X, ExternalLink } from 'lucide-react'
import { ethers } from 'ethers'
import { useContractInstances } from '@/hooks/useContracts'
import { CONTRACTS, ABIS } from '@/config/contracts'

interface BuildingInfoProps {
  building: Building | null
  open: boolean
  onClose: () => void
  onRemove: (id: string) => void
}

// Pixel Art Building Preview
function PixelBuildingPreview({ type }: { type: Building['type'] }) {
  const info = BUILDING_INFO[type]
  const { colors } = info

  return (
    <motion.svg
      width={64}
      height={64}
      viewBox="0 0 16 16"
      style={{ imageRendering: 'pixelated' }}
      animate={{ y: [0, -2, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
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
    </motion.svg>
  )
}

// Helper to get asset symbol from address
function getAssetSymbol(assetAddress?: string): string {
  if (!assetAddress) return 'N/A'
  
  // Normalize address to lowercase for comparison
  const normalizedAddress = assetAddress.toLowerCase()
  
  // Common token addresses on Base Sepolia
  const tokenMap: Record<string, string> = {
    '0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f': 'USDC',
    '0x0a215d8ba66387dca84b284d18c3b4ec3de6e54a': 'USDT',
    '0x4200000000000000000000000000000000000006': 'WETH',
    '0x54114591963cf60ef3aa63befd6ec263d98145a4': 'WBTC',
  }
  
  const symbol = tokenMap[normalizedAddress]
  if (symbol) {
    return symbol
  }
  
  // If not found, return shortened address
  console.warn('Unknown asset address:', assetAddress)
  return assetAddress.slice(0, 6) + '...'
}

// Helper to get asset decimals from address
function getAssetDecimals(assetAddress?: string): number {
  if (!assetAddress) return 18 // Default to 18 decimals
  
  // Common token addresses on Base Sepolia with their decimals
  const decimalsMap: Record<string, number> = {
    '0xba50cd2a20f6da35d788639e581bca8d0b5d4d5f': 6,  // USDC
    '0x0a215D8ba66387DCA84B284D18c3B4ec3de6E54a': 6,  // USDT
    '0x4200000000000000000000000000000000000006': 18, // WETH
    '0x54114591963CF60EF3aA63bEfD6eC263D98145a4': 8,  // WBTC
  }
  
  return decimalsMap[assetAddress.toLowerCase()] || 18
}

// Helper to format amount with decimals (convert from wei to human-readable)
function formatAmount(amount?: string, assetAddress?: string): string {
  if (!amount) return 'N/A'
  
  try {
    // Amount from contract is in wei (smallest unit), need to convert using decimals
    const decimals = getAssetDecimals(assetAddress)
    
    // Convert to BigInt
    const amountWei = BigInt(amount)
    console.log(`[formatAmount] Input: ${amount}, Decimals: ${decimals}, BigInt: ${amountWei.toString()}`)
    
    // Format using ethers
    const formatted = ethers.formatUnits(amountWei, decimals)
    console.log(`[formatAmount] Formatted by ethers: ${formatted}`)
    
    // Parse to number for formatting
    const num = parseFloat(formatted)
    if (isNaN(num)) {
      console.warn(`[formatAmount] Failed to parse as number: ${formatted}`)
      return formatted
    }
    
    console.log(`[formatAmount] Parsed number: ${num}`)
    
    // For very small amounts, always show decimals
    // Format based on asset type with minimumFractionDigits to show decimals even for 0
    let result: string
    if (decimals === 6) {
      // USDC, USDT - show up to 6 decimal places, minimum 2 to show small amounts
      result = num.toLocaleString(undefined, { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 6 
      })
    } else if (decimals === 18) {
      // WETH - show up to 4 decimal places, minimum 4 to show small amounts
      result = num.toLocaleString(undefined, { 
        minimumFractionDigits: 4,
        maximumFractionDigits: 4 
      })
    } else if (decimals === 8) {
      // WBTC - show up to 8 decimal places, minimum 4 to show small amounts
      // But if the number is very small (like 0.005), show all significant digits
      if (num < 1) {
        // For numbers < 1, show up to 8 decimals but remove trailing zeros
        result = num.toLocaleString(undefined, { 
          minimumFractionDigits: 0,
          maximumFractionDigits: 8 
        })
        // Remove trailing zeros but keep at least one decimal place if number is not whole
        if (num > 0 && num < 1) {
          result = result.replace(/\.?0+$/, '') || '0'
          // Ensure at least one decimal place for small numbers
          if (!result.includes('.')) {
            result = num.toFixed(3) // Show at least 3 decimal places for small numbers
          }
        }
      } else {
        result = num.toLocaleString(undefined, { 
          minimumFractionDigits: 4,
          maximumFractionDigits: 8 
        })
      }
    } else {
      // Default: show minimum 2 decimal places
      result = num.toLocaleString(undefined, { 
        minimumFractionDigits: 2,
        maximumFractionDigits: 6 
      })
    }
    
    console.log(`[formatAmount] Final result: ${result}`)
    return result
  } catch (error) {
    // If parsing fails, return original amount
    console.error('[formatAmount] Error formatting amount:', error)
    return amount
  }
}

// Helper to get BaseScan URL
function getBaseScanUrl(txHash: string): string {
  return `https://sepolia.basescan.org/tx/${txHash}`
}

export function BuildingInfo({ building, open, onClose, onRemove }: BuildingInfoProps) {
  if (!building) return null

  const info = BUILDING_INFO[building.type]
  const isTownHall = building.type === 'townhall'
  const { core } = useContractInstances()
  
  // State for on-chain building data
  const [onChainData, setOnChainData] = useState<{
    amount?: string
    asset?: string
  } | null>(null)
  const [loadingOnChain, setLoadingOnChain] = useState(false)
  
  // Fetch building data from contract if buildingId is available
  useEffect(() => {
    async function fetchBuildingData() {
      if (!building || !building.buildingId || !core || !open) return
      
      setLoadingOnChain(true)
      try {
        console.log('Fetching building data for buildingId:', building.buildingId)
        const buildingData = await core.buildings(building.buildingId)
        
        console.log('Fetched building data from contract:', {
          id: buildingData.id.toString(),
          asset: buildingData.asset,
          amount: buildingData.amount.toString(),
          amountHex: buildingData.amount.toString(16),
          active: buildingData.active,
          buildingType: buildingData.buildingType,
        })
        
        // Convert amount to string (it's a BigInt)
        const amountStr = buildingData.amount.toString()
        console.log('Amount as string:', amountStr)
        
        // Check if amount is 0
        if (buildingData.amount === 0n) {
          console.warn('⚠️ Building amount is 0 in contract! This might be incorrect.')
        }
        
        setOnChainData({
          amount: amountStr,
          asset: buildingData.asset,
        })
      } catch (error) {
        console.error('Error fetching building data from contract:', error)
        // Don't set onChainData on error, so we fall back to building props
      } finally {
        setLoadingOnChain(false)
      }
    }
    
    fetchBuildingData()
  }, [building?.buildingId, core, open])
  
  // Use on-chain data if available, otherwise use building props
  const assetAddress = onChainData?.asset || building.asset
  const amountRaw = onChainData?.amount || building.amount
  
  // Debug logging
  console.log('Building Info Debug:', {
    buildingId: building.buildingId,
    assetAddress,
    amountRaw,
    onChainData,
    buildingAmount: building.amount,
    buildingDeposited: building.deposited,
  })
  
  const assetSymbol = getAssetSymbol(assetAddress)
  
  // Format amount from contract (in wei) to human-readable format using formatAmount helper
  const formattedAmount = amountRaw 
    ? formatAmount(amountRaw, assetAddress) 
    : building.deposited // Fallback to deposited if amount not available
  
  // Debug logging
  console.log('Final values:', {
    formattedAmount,
    assetSymbol,
    assetAddress,
    amountRaw,
    onChainData,
  })

  const handleRemove = () => {
    if (isTownHall) return
    onRemove(building.id)
    onClose()
  }

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
            onClick={onClose}
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
                <PixelBuildingPreview type={building.type} />
                <div>
                  <h3
                    className="text-lg"
                    style={{
                      fontFamily: '"Press Start 2P", monospace',
                      fontSize: '14px',
                      color: info.colors.roof
                    }}
                  >
                    {info.name}
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
                onClick={onClose}
                className="p-2 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4">
              <p className="text-sm text-slate-400">{info.description}</p>

              {/* Building Stats */}
              <div className="space-y-3">
                {building.buildingId !== undefined && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-700">
                    <span className="text-xs text-slate-500">Building ID</span>
                    <span
                      className="text-xs font-mono"
                      style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#94a3b8' }}
                    >
                      #{building.buildingId}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-b border-slate-700">
                  <span className="text-xs text-slate-500">Position</span>
                  <span
                    className="text-xs"
                    style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#94a3b8' }}
                  >
                    ({building.position.x}, {building.position.y})
                  </span>
                </div>

                {(assetAddress || building.asset) && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-700">
                    <span className="text-xs text-slate-500">Asset</span>
                    <span
                      className="text-xs"
                      style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#10b981' }}
                    >
                      {assetSymbol}
                      {loadingOnChain && <span className="ml-2 text-slate-500">(loading...)</span>}
                    </span>
                  </div>
                )}

                {(formattedAmount || building.deposited || amountRaw) && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-700">
                    <span className="text-xs text-slate-500">Amount</span>
                    <span
                      className="text-xs"
                      style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px', color: '#10b981' }}
                    >
                      {loadingOnChain ? (
                        <span className="text-slate-500">Loading...</span>
                      ) : (
                        (() => {
                          const amountValue = formattedAmount || building.deposited || '0'
                          // Always show asset symbol if we have asset info
                          if (assetSymbol !== 'N/A' && amountValue !== 'N/A' && amountValue !== '') {
                            return `${amountValue} ${assetSymbol}`
                          }
                          return amountValue
                        })()
                      )}
                    </span>
                  </div>
                )}

                {building.smartWallet && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-700">
                    <span className="text-xs text-slate-500">Smart Wallet</span>
                    <span
                      className="text-xs font-mono"
                      style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px', color: '#3b82f6' }}
                    >
                      {building.smartWallet.slice(0, 6)}...{building.smartWallet.slice(-4)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between py-2 border-b border-slate-700">
                  <span className="text-xs text-slate-500">Built on</span>
                  <span className="text-xs text-slate-400">
                    {new Date(building.createdAt).toLocaleDateString()}
                  </span>
                </div>

                {building.txHash && (
                  <div className="flex items-center justify-between py-2 border-b border-slate-700">
                    <span className="text-xs text-slate-500">Transaction</span>
                    <a
                      href={getBaseScanUrl(building.txHash)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 transition-colors"
                      style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '8px' }}
                    >
                      {building.txHash.slice(0, 6)}...{building.txHash.slice(-4)}
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}

                <div className="flex items-center justify-between py-2">
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
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-4 border-t-2" style={{ borderColor: info.colors.accent }}>
              <button
                onClick={onClose}
                className="flex-1 py-3 border-2 border-slate-600 text-slate-400 hover:bg-slate-800 transition-colors"
                style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
              >
                Close
              </button>
              {!isTownHall && (
                <button
                  onClick={handleRemove}
                  className="flex-1 py-3 border-2 border-red-500 bg-red-500/20 text-red-400 hover:bg-red-500/30 transition-colors flex items-center justify-center gap-2"
                  style={{ fontFamily: '"Press Start 2P", monospace', fontSize: '10px' }}
                >
                  <Trash2 className="w-4 h-4" />
                  Remove
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
