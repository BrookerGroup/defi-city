/**
 * useLotteryBuyTickets Hook
 * Buy Megapot lottery tickets via SmartWallet.executeBatch
 * Batch: [MPUSDC.approve → Megapot.purchaseTickets]
 * Building placement is recorded separately (best-effort, non-blocking)
 */

import { useState, useCallback } from 'react'
import { ethers } from 'ethers'
import { useWallets } from '@privy-io/react-auth'
import { CONTRACTS, ABIS } from '@/config/contracts'
import { MEGAPOT_REFERRER, MPUSDC_DECIMALS } from '@/lib/constants'

export function useLotteryBuyTickets() {
  const { wallets } = useWallets()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const buyTickets = useCallback(
    async (
      userAddress: string,
      smartWalletAddress: string,
      ticketCount: number,
      ticketPrice: number,
      x: number,
      y: number,
      isUpgrade?: boolean
    ): Promise<{ success: boolean; txHash?: string; error?: string }> => {
      setLoading(true)
      setError(null)

      console.log(`[Lottery] Buying ${ticketCount} tickets at (${x}, ${y})`)

      try {
        if (!wallets || wallets.length === 0) throw new Error('Wallet not connected')

        const wallet = wallets.find((w) => w.walletClientType === 'privy') || wallets[0]
        const ethereumProvider = await wallet.getEthereumProvider()
        const provider = new ethers.BrowserProvider(ethereumProvider)
        const signer = await provider.getSigner()

        const addresses = CONTRACTS.baseSepolia
        const totalCost = ethers.parseUnits(
          (ticketCount * ticketPrice).toFixed(MPUSDC_DECIMALS),
          MPUSDC_DECIMALS
        )

        // Build batch calls for ticket purchase (approve + buy only)
        const mpusdcInterface = new ethers.Interface(ABIS.MPUSDC)
        const megapotInterface = new ethers.Interface(ABIS.MEGAPOT)

        const targets: string[] = []
        const values: bigint[] = []
        const datas: string[] = []

        // 1. Approve MPUSDC spend
        targets.push(addresses.MPUSDC)
        values.push(0n)
        datas.push(mpusdcInterface.encodeFunctionData('approve', [addresses.MEGAPOT, totalCost]))

        // 2. Purchase tickets (amount = MPUSDC amount, not ticket count)
        targets.push(addresses.MEGAPOT)
        values.push(0n)
        datas.push(
          megapotInterface.encodeFunctionData('purchaseTickets', [
            MEGAPOT_REFERRER,
            totalCost,
            smartWalletAddress,
          ])
        )

        const smartWallet = new ethers.Contract(smartWalletAddress, ABIS.SMART_WALLET, signer)

        // Debug: Log the actual values being sent
        console.log('[Lottery] Debug - ticketCount:', ticketCount)
        console.log('[Lottery] Debug - ticketPrice:', ticketPrice)
        console.log('[Lottery] Debug - totalCost (raw):', totalCost.toString())
        console.log('[Lottery] Debug - totalCost (formatted):', ethers.formatUnits(totalCost, MPUSDC_DECIMALS))

        // Check if round is active
        const megapot = new ethers.Contract(addresses.MEGAPOT, ABIS.MEGAPOT, provider)
        const [allowPurchasing, contractTicketPrice] = await Promise.all([
          megapot.allowPurchasing(),
          megapot.ticketPrice(),
        ])
        console.log('[Lottery] Contract allowPurchasing:', allowPurchasing)
        console.log('[Lottery] Contract ticketPrice:', ethers.formatUnits(contractTicketPrice, MPUSDC_DECIMALS))

        if (!allowPurchasing) {
          throw new Error('Ticket purchasing is currently disabled. Wait for next round.')
        }

        // Verify totalCost meets minimum
        if (totalCost < contractTicketPrice) {
          throw new Error(`Amount too low. Minimum: ${ethers.formatUnits(contractTicketPrice, MPUSDC_DECIMALS)} MPUSDC`)
        }

        const gasEstimate = await smartWallet.executeBatch.estimateGas(targets, values, datas)
        console.log('[Lottery] Gas estimate:', gasEstimate.toString())

        const tx = await smartWallet.executeBatch(targets, values, datas, {
          gasLimit: gasEstimate + 100_000n,
        })

        console.log('[Lottery] Tx sent:', tx.hash)
        const receipt = await tx.wait()
        console.log('[Lottery] Confirmed:', receipt?.hash)

        // Record building placement separately (non-blocking, best-effort)
        // Use USDC address instead of MPUSDC because DefiCity Core only supports whitelisted assets.
        // The building type 'lottery' ensures correct display in the UI.
        if (!isUpgrade) {
          try {
            console.log(`[Lottery] Recording building placement at (${x}, ${y})`)
            const coreInterface = new ethers.Interface(ABIS.DEFICITY_CORE)
            const placeTx = await smartWallet.execute(
              addresses.DEFICITY_CORE,
              0n,
              coreInterface.encodeFunctionData('recordBuildingPlacement', [
                userAddress,
                'lottery',
                addresses.USDC,
                totalCost,
                x,
                y,
                '0x',
              ])
            )
            await placeTx.wait()
            console.log('[Lottery] Building placement recorded')
          } catch (placeErr) {
            console.warn('[Lottery] Building placement failed (non-critical):', placeErr)
          }
        }

        setLoading(false)
        return { success: true, txHash: receipt?.hash }
      } catch (err: any) {
        console.error('Error buying lottery tickets:', err)
        const errorMessage = err.reason || err.message || 'Buy tickets failed'
        setError(errorMessage)
        setLoading(false)
        return { success: false, error: errorMessage }
      }
    },
    [wallets]
  )

  return {
    buyTickets,
    loading,
    error,
  }
}
