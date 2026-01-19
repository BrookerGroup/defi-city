/**
 * useAavePosition Hook
 * Manages user's Aave position with mock data (real integration later)
 */

import { useState, useCallback } from 'react'
import {
  AaveAsset,
  AaveUserPosition,
  AaveSupplyPosition,
  AaveBorrowPosition,
  AAVE_MARKET_DATA,
  ASSET_PRICES,
} from '@/types/aave'

// Initial empty position
const EMPTY_POSITION: AaveUserPosition = {
  supplies: [],
  borrows: [],
  totalSuppliedUSD: 0,
  totalBorrowedUSD: 0,
  netWorthUSD: 0,
  healthFactor: Infinity,
  netAPY: 0,
}

// Calculate health factor based on supplies and borrows
function calculateHealthFactor(
  supplies: AaveSupplyPosition[],
  borrows: AaveBorrowPosition[]
): number {
  if (borrows.length === 0) return Infinity

  let totalCollateralETH = 0
  let totalBorrowETH = 0

  // Calculate weighted collateral (considering liquidation threshold)
  for (const supply of supplies) {
    const assetInfo = AAVE_MARKET_DATA.assets[supply.asset]
    totalCollateralETH += supply.amountUSD * assetInfo.liquidationThreshold
  }

  // Calculate total borrow
  for (const borrow of borrows) {
    totalBorrowETH += borrow.amountUSD
  }

  if (totalBorrowETH === 0) return Infinity
  return totalCollateralETH / totalBorrowETH
}

// Calculate net APY
function calculateNetAPY(
  supplies: AaveSupplyPosition[],
  borrows: AaveBorrowPosition[],
  totalSuppliedUSD: number,
  totalBorrowedUSD: number
): number {
  if (totalSuppliedUSD === 0 && totalBorrowedUSD === 0) return 0

  let supplyInterest = 0
  let borrowInterest = 0

  for (const supply of supplies) {
    supplyInterest += supply.amountUSD * (supply.apy / 100)
  }

  for (const borrow of borrows) {
    borrowInterest += borrow.amountUSD * (borrow.apy / 100)
  }

  const netInterest = supplyInterest - borrowInterest
  const netWorth = totalSuppliedUSD - totalBorrowedUSD

  if (netWorth === 0) return 0
  return (netInterest / netWorth) * 100
}

export function useAavePosition() {
  const [position, setPosition] = useState<AaveUserPosition>(EMPTY_POSITION)
  const [loading, setLoading] = useState(false)

  // Supply asset
  const supply = useCallback(async (asset: AaveAsset, amount: number) => {
    setLoading(true)

    // Simulate transaction delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setPosition((prev) => {
      const assetInfo = AAVE_MARKET_DATA.assets[asset]
      const amountUSD = amount * ASSET_PRICES[asset]

      // Check if already has this asset supplied
      const existingIndex = prev.supplies.findIndex((s) => s.asset === asset)

      let newSupplies: AaveSupplyPosition[]
      if (existingIndex >= 0) {
        newSupplies = [...prev.supplies]
        newSupplies[existingIndex] = {
          ...newSupplies[existingIndex],
          amount: newSupplies[existingIndex].amount + amount,
          amountUSD: newSupplies[existingIndex].amountUSD + amountUSD,
        }
      } else {
        newSupplies = [
          ...prev.supplies,
          {
            asset,
            amount,
            amountUSD,
            apy: assetInfo.supplyAPY,
          },
        ]
      }

      const totalSuppliedUSD = newSupplies.reduce((sum, s) => sum + s.amountUSD, 0)
      const totalBorrowedUSD = prev.borrows.reduce((sum, b) => sum + b.amountUSD, 0)
      const healthFactor = calculateHealthFactor(newSupplies, prev.borrows)
      const netAPY = calculateNetAPY(newSupplies, prev.borrows, totalSuppliedUSD, totalBorrowedUSD)

      return {
        supplies: newSupplies,
        borrows: prev.borrows,
        totalSuppliedUSD,
        totalBorrowedUSD,
        netWorthUSD: totalSuppliedUSD - totalBorrowedUSD,
        healthFactor,
        netAPY,
      }
    })

    setLoading(false)
    return { success: true }
  }, [])

  // Borrow asset
  const borrow = useCallback(async (asset: AaveAsset, amount: number) => {
    setLoading(true)

    // Simulate transaction delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setPosition((prev) => {
      const assetInfo = AAVE_MARKET_DATA.assets[asset]
      const amountUSD = amount * ASSET_PRICES[asset]

      // Check borrowing capacity
      let maxBorrowUSD = 0
      for (const supply of prev.supplies) {
        const supplyAssetInfo = AAVE_MARKET_DATA.assets[supply.asset]
        maxBorrowUSD += supply.amountUSD * supplyAssetInfo.ltv
      }

      const currentBorrowUSD = prev.borrows.reduce((sum, b) => sum + b.amountUSD, 0)
      const availableBorrowUSD = maxBorrowUSD - currentBorrowUSD

      if (amountUSD > availableBorrowUSD) {
        console.error('Insufficient borrowing capacity')
        setLoading(false)
        return prev
      }

      // Check if already has this asset borrowed
      const existingIndex = prev.borrows.findIndex((b) => b.asset === asset)

      let newBorrows: AaveBorrowPosition[]
      if (existingIndex >= 0) {
        newBorrows = [...prev.borrows]
        newBorrows[existingIndex] = {
          ...newBorrows[existingIndex],
          amount: newBorrows[existingIndex].amount + amount,
          amountUSD: newBorrows[existingIndex].amountUSD + amountUSD,
        }
      } else {
        newBorrows = [
          ...prev.borrows,
          {
            asset,
            amount,
            amountUSD,
            apy: assetInfo.borrowAPY,
          },
        ]
      }

      const totalSuppliedUSD = prev.supplies.reduce((sum, s) => sum + s.amountUSD, 0)
      const totalBorrowedUSD = newBorrows.reduce((sum, b) => sum + b.amountUSD, 0)
      const healthFactor = calculateHealthFactor(prev.supplies, newBorrows)
      const netAPY = calculateNetAPY(prev.supplies, newBorrows, totalSuppliedUSD, totalBorrowedUSD)

      return {
        supplies: prev.supplies,
        borrows: newBorrows,
        totalSuppliedUSD,
        totalBorrowedUSD,
        netWorthUSD: totalSuppliedUSD - totalBorrowedUSD,
        healthFactor,
        netAPY,
      }
    })

    setLoading(false)
    return { success: true }
  }, [])

  // Withdraw asset
  const withdraw = useCallback(async (asset: AaveAsset, amount: number) => {
    setLoading(true)

    // Simulate transaction delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setPosition((prev) => {
      const existingIndex = prev.supplies.findIndex((s) => s.asset === asset)
      if (existingIndex < 0) {
        setLoading(false)
        return prev
      }

      const amountUSD = amount * ASSET_PRICES[asset]
      const existingSupply = prev.supplies[existingIndex]

      if (amount > existingSupply.amount) {
        console.error('Insufficient balance')
        setLoading(false)
        return prev
      }

      let newSupplies: AaveSupplyPosition[]
      if (amount === existingSupply.amount) {
        newSupplies = prev.supplies.filter((_, i) => i !== existingIndex)
      } else {
        newSupplies = [...prev.supplies]
        newSupplies[existingIndex] = {
          ...existingSupply,
          amount: existingSupply.amount - amount,
          amountUSD: existingSupply.amountUSD - amountUSD,
        }
      }

      // Check if withdrawal would cause health factor to drop below 1
      const newHealthFactor = calculateHealthFactor(newSupplies, prev.borrows)
      if (newHealthFactor < 1 && prev.borrows.length > 0) {
        console.error('Withdrawal would cause liquidation')
        setLoading(false)
        return prev
      }

      const totalSuppliedUSD = newSupplies.reduce((sum, s) => sum + s.amountUSD, 0)
      const totalBorrowedUSD = prev.borrows.reduce((sum, b) => sum + b.amountUSD, 0)
      const netAPY = calculateNetAPY(newSupplies, prev.borrows, totalSuppliedUSD, totalBorrowedUSD)

      return {
        supplies: newSupplies,
        borrows: prev.borrows,
        totalSuppliedUSD,
        totalBorrowedUSD,
        netWorthUSD: totalSuppliedUSD - totalBorrowedUSD,
        healthFactor: newHealthFactor,
        netAPY,
      }
    })

    setLoading(false)
    return { success: true }
  }, [])

  // Repay asset
  const repay = useCallback(async (asset: AaveAsset, amount: number) => {
    setLoading(true)

    // Simulate transaction delay
    await new Promise((resolve) => setTimeout(resolve, 1000))

    setPosition((prev) => {
      const existingIndex = prev.borrows.findIndex((b) => b.asset === asset)
      if (existingIndex < 0) {
        setLoading(false)
        return prev
      }

      const amountUSD = amount * ASSET_PRICES[asset]
      const existingBorrow = prev.borrows[existingIndex]

      const repayAmount = Math.min(amount, existingBorrow.amount)

      let newBorrows: AaveBorrowPosition[]
      if (repayAmount >= existingBorrow.amount) {
        newBorrows = prev.borrows.filter((_, i) => i !== existingIndex)
      } else {
        newBorrows = [...prev.borrows]
        newBorrows[existingIndex] = {
          ...existingBorrow,
          amount: existingBorrow.amount - repayAmount,
          amountUSD: existingBorrow.amountUSD - (repayAmount * ASSET_PRICES[asset]),
        }
      }

      const totalSuppliedUSD = prev.supplies.reduce((sum, s) => sum + s.amountUSD, 0)
      const totalBorrowedUSD = newBorrows.reduce((sum, b) => sum + b.amountUSD, 0)
      const healthFactor = calculateHealthFactor(prev.supplies, newBorrows)
      const netAPY = calculateNetAPY(prev.supplies, newBorrows, totalSuppliedUSD, totalBorrowedUSD)

      return {
        supplies: prev.supplies,
        borrows: newBorrows,
        totalSuppliedUSD,
        totalBorrowedUSD,
        netWorthUSD: totalSuppliedUSD - totalBorrowedUSD,
        healthFactor,
        netAPY,
      }
    })

    setLoading(false)
    return { success: true }
  }, [])

  // Get max borrowable amount for an asset
  const getMaxBorrow = useCallback((asset: AaveAsset): number => {
    let maxBorrowUSD = 0
    for (const supply of position.supplies) {
      const assetInfo = AAVE_MARKET_DATA.assets[supply.asset]
      maxBorrowUSD += supply.amountUSD * assetInfo.ltv
    }

    const currentBorrowUSD = position.borrows.reduce((sum, b) => sum + b.amountUSD, 0)
    const availableBorrowUSD = maxBorrowUSD - currentBorrowUSD

    return availableBorrowUSD / ASSET_PRICES[asset]
  }, [position])

  // Preview health factor after a potential action
  const previewHealthFactor = useCallback(
    (
      supplyAsset: AaveAsset | null,
      supplyAmount: number,
      borrowAsset: AaveAsset | null,
      borrowAmount: number
    ): number => {
      let newSupplies = [...position.supplies]
      let newBorrows = [...position.borrows]

      // Add supply preview
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

      // Add borrow preview
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

  return {
    position,
    loading,
    supply,
    borrow,
    withdraw,
    repay,
    getMaxBorrow,
    previewHealthFactor,
    marketData: AAVE_MARKET_DATA,
    assetPrices: ASSET_PRICES,
  }
}
