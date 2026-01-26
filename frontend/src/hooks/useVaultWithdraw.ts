import { useState, useCallback } from 'react'
import { useWriteContract } from 'wagmi'
import { createPublicClient, http, parseEther, parseUnits, encodeFunctionData } from 'viem'
import { baseSepolia } from 'viem/chains'
import { USDC_ADDRESS, ERC20ABI, SmartWalletABI } from '@/lib/contracts'
import { TokenType } from './useVaultDeposit'

interface WithdrawResult {
  success: boolean
  hash?: string
  error?: string
}

// Create a public client for reading data directly from RPC
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://base-sepolia-rpc.publicnode.com'),
})

export function useVaultWithdraw(
  ownerAddress?: `0x${string}`,
  smartWalletAddress?: `0x${string}` | null,
  refetchBalances?: () => void
) {
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const { writeContractAsync } = useWriteContract()

  // Withdraw ETH from Smart Wallet to EOA (Vault Withdraw)
  // Uses SmartWallet.execute(dest, value, func) where dest=owner, value=amount, func=empty
  const withdrawETH = useCallback(
    async (amount: string): Promise<WithdrawResult> => {
      if (!ownerAddress || !smartWalletAddress) {
        return { success: false, error: 'Wallet not connected or Smart Wallet not found' }
      }

      setIsWithdrawing(true)
      try {
        const amountInWei = parseEther(amount)

        // Check Smart Wallet balance
        const currentBalance = await publicClient.getBalance({ address: smartWalletAddress })
        if (amountInWei > currentBalance) {
          setIsWithdrawing(false)
          return { success: false, error: 'Insufficient ETH balance in Smart Wallet' }
        }

        console.log('[Vault Withdraw ETH] Sending', amount, 'ETH to', ownerAddress)

        setIsConfirming(true)

        // Call SmartWallet.execute(ownerAddress, amountInWei, "0x")
        // This sends ETH from Smart Wallet to owner
        const hash = await writeContractAsync({
          address: smartWalletAddress,
          abi: SmartWalletABI,
          functionName: 'execute',
          args: [ownerAddress, amountInWei, '0x'],
        })

        console.log('[Vault Withdraw ETH] Transaction sent:', hash)

        // Wait for confirmation
        try {
          await publicClient.waitForTransactionReceipt({ hash })
          console.log('[Vault Withdraw ETH] Transaction confirmed!')
        } catch (e) {
          console.log('[Vault Withdraw ETH] Wait for receipt error:', e)
        }

        setIsConfirming(false)
        setIsWithdrawing(false)

        // Refetch balances
        if (refetchBalances) {
          setTimeout(refetchBalances, 2000)
        }

        return { success: true, hash }
      } catch (error) {
        console.error('[Vault Withdraw ETH] Error:', error)
        setIsConfirming(false)
        setIsWithdrawing(false)
        const message = error instanceof Error ? error.message : 'Failed to withdraw ETH'
        return { success: false, error: message }
      }
    },
    [ownerAddress, smartWalletAddress, writeContractAsync, refetchBalances]
  )

  // Withdraw USDC from Smart Wallet to EOA (Vault Withdraw)
  // Uses SmartWallet.execute(usdcAddress, 0, encodedTransferCall)
  const withdrawUSDC = useCallback(
    async (amount: string): Promise<WithdrawResult> => {
      if (!ownerAddress || !smartWalletAddress) {
        return { success: false, error: 'Wallet not connected or Smart Wallet not found' }
      }

      setIsWithdrawing(true)
      try {
        const amountInUnits = parseUnits(amount, 6)

        // Check Smart Wallet USDC balance
        const currentBalance = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: ERC20ABI,
          functionName: 'balanceOf',
          args: [smartWalletAddress],
        }) as bigint

        if (amountInUnits > currentBalance) {
          setIsWithdrawing(false)
          return { success: false, error: 'Insufficient USDC balance in Smart Wallet' }
        }

        console.log('[Vault Withdraw USDC] Sending', amount, 'USDC to', ownerAddress)

        setIsConfirming(true)

        // Encode USDC transfer(owner, amount) call
        const transferCalldata = encodeFunctionData({
          abi: ERC20ABI,
          functionName: 'transfer',
          args: [ownerAddress, amountInUnits],
        })

        // Call SmartWallet.execute(usdcAddress, 0, transferCalldata)
        const hash = await writeContractAsync({
          address: smartWalletAddress,
          abi: SmartWalletABI,
          functionName: 'execute',
          args: [USDC_ADDRESS, BigInt(0), transferCalldata],
        })

        console.log('[Vault Withdraw USDC] Transaction sent:', hash)

        // Wait for confirmation
        try {
          await publicClient.waitForTransactionReceipt({ hash })
          console.log('[Vault Withdraw USDC] Transaction confirmed!')
        } catch (e) {
          console.log('[Vault Withdraw USDC] Wait for receipt error:', e)
        }

        setIsConfirming(false)
        setIsWithdrawing(false)

        // Refetch balances
        if (refetchBalances) {
          setTimeout(refetchBalances, 2000)
        }

        return { success: true, hash }
      } catch (error) {
        console.error('[Vault Withdraw USDC] Error:', error)
        setIsConfirming(false)
        setIsWithdrawing(false)
        const message = error instanceof Error ? error.message : 'Failed to withdraw USDC'
        return { success: false, error: message }
      }
    },
    [ownerAddress, smartWalletAddress, writeContractAsync, refetchBalances]
  )

  // Generic withdraw function
  const withdraw = useCallback(
    async (token: TokenType, amount: string): Promise<WithdrawResult> => {
      return token === 'ETH' ? withdrawETH(amount) : withdrawUSDC(amount)
    },
    [withdrawETH, withdrawUSDC]
  )

  return {
    withdraw,
    withdrawETH,
    withdrawUSDC,
    isWithdrawing,
    isConfirming,
  }
}
