import { useState, useCallback, useEffect } from 'react'
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import { createPublicClient, http, parseEther, parseUnits, formatEther, formatUnits } from 'viem'
import { baseSepolia } from 'viem/chains'
import { USDC_ADDRESS, ERC20ABI } from '@/lib/contracts'

export type TokenType = 'ETH' | 'USDC'

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

export function useWithdrawToSmartWallet(
  ownerAddress?: `0x${string}`,
  smartWalletAddress?: `0x${string}` | null
) {
  const [isWithdrawing, setIsWithdrawing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const { writeContractAsync } = useWriteContract()
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  // Balance states
  const [ethBalance, setEthBalance] = useState('0')
  const [usdcBalance, setUsdcBalance] = useState('0')
  const [smartWalletEthBalance, setSmartWalletEthBalance] = useState('0')
  const [smartWalletUsdcBalance, setSmartWalletUsdcBalance] = useState('0')
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)

  // Only use wagmi receipt for USDC (writeContractAsync)
  const { isLoading: isWaitingUsdcReceipt, isSuccess: isUsdcConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  })

  // Reset USDC txHash when confirmed
  useEffect(() => {
    if (isUsdcConfirmed && txHash) {
      setIsConfirming(false)
      const timer = setTimeout(() => {
        setTxHash(undefined)
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [isUsdcConfirmed, txHash])

  // Fetch balances directly from RPC
  const fetchBalances = useCallback(async () => {
    if (!ownerAddress) return

    setIsLoadingBalances(true)
    console.log('[Balances] Fetching for EOA:', ownerAddress)

    try {
      // Fetch EOA ETH balance
      const eoaEth = await publicClient.getBalance({ address: ownerAddress })
      const eoaEthFormatted = formatEther(eoaEth)
      setEthBalance(eoaEthFormatted)
      console.log('[Balances] EOA ETH:', eoaEthFormatted)

      // Fetch EOA USDC balance
      try {
        const eoaUsdc = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: ERC20ABI,
          functionName: 'balanceOf',
          args: [ownerAddress],
        }) as bigint
        const eoaUsdcFormatted = formatUnits(eoaUsdc, 6)
        setUsdcBalance(eoaUsdcFormatted)
        console.log('[Balances] EOA USDC:', eoaUsdcFormatted)
      } catch {
        setUsdcBalance('0')
      }

      // Fetch Smart Wallet balances
      if (smartWalletAddress) {
        console.log('[Balances] Fetching for Smart Wallet:', smartWalletAddress)

        const swEth = await publicClient.getBalance({ address: smartWalletAddress })
        const swEthFormatted = formatEther(swEth)
        setSmartWalletEthBalance(swEthFormatted)
        console.log('[Balances] Smart Wallet ETH:', swEthFormatted)

        try {
          const swUsdc = await publicClient.readContract({
            address: USDC_ADDRESS,
            abi: ERC20ABI,
            functionName: 'balanceOf',
            args: [smartWalletAddress],
          }) as bigint
          const swUsdcFormatted = formatUnits(swUsdc, 6)
          setSmartWalletUsdcBalance(swUsdcFormatted)
          console.log('[Balances] Smart Wallet USDC:', swUsdcFormatted)
        } catch {
          setSmartWalletUsdcBalance('0')
        }
      }
    } catch (err) {
      console.error('[Balances] Error:', err)
    } finally {
      setIsLoadingBalances(false)
    }
  }, [ownerAddress, smartWalletAddress])

  // Auto-fetch balances when addresses change
  useEffect(() => {
    fetchBalances()
  }, [fetchBalances])

  // Withdraw ETH from EOA to Smart Wallet
  const withdrawETH = useCallback(
    async (amount: string): Promise<WithdrawResult> => {
      if (!ownerAddress || !smartWalletAddress) {
        return { success: false, error: 'Wallet not connected or Smart Wallet not found' }
      }

      setIsWithdrawing(true)
      try {
        const amountInWei = parseEther(amount)

        // Check balance
        const currentBalance = await publicClient.getBalance({ address: ownerAddress })
        if (amountInWei > currentBalance) {
          setIsWithdrawing(false)
          return { success: false, error: 'Insufficient ETH balance' }
        }

        console.log('[Withdraw ETH] Sending', amount, 'ETH to', smartWalletAddress)

        const ethereum = (window as unknown as { ethereum?: { request: (args: { method: string; params: unknown[] }) => Promise<string> } }).ethereum
        if (!ethereum) {
          setIsWithdrawing(false)
          return { success: false, error: 'No wallet provider found' }
        }

        // Send transaction
        setIsConfirming(true)
        const hash = await ethereum.request({
          method: 'eth_sendTransaction',
          params: [{
            from: ownerAddress,
            to: smartWalletAddress,
            value: `0x${amountInWei.toString(16)}`,
          }],
        }) as `0x${string}`

        console.log('[Withdraw ETH] Transaction sent:', hash)

        // Wait for confirmation using viem
        try {
          await publicClient.waitForTransactionReceipt({ hash })
          console.log('[Withdraw ETH] Transaction confirmed!')
        } catch (e) {
          console.log('[Withdraw ETH] Wait for receipt error (may still succeed):', e)
        }

        setIsConfirming(false)
        setIsWithdrawing(false)

        // Refetch balances after delay
        setTimeout(fetchBalances, 2000)

        return { success: true, hash }
      } catch (error) {
        console.error('[Withdraw ETH] Error:', error)
        setIsConfirming(false)
        setIsWithdrawing(false)
        const message = error instanceof Error ? error.message : 'Failed to withdraw ETH'
        return { success: false, error: message }
      }
    },
    [ownerAddress, smartWalletAddress, fetchBalances]
  )

  // Withdraw USDC from EOA to Smart Wallet
  const withdrawUSDC = useCallback(
    async (amount: string): Promise<WithdrawResult> => {
      if (!ownerAddress || !smartWalletAddress) {
        return { success: false, error: 'Wallet not connected or Smart Wallet not found' }
      }

      setIsWithdrawing(true)
      setIsConfirming(true)
      try {
        const amountInUnits = parseUnits(amount, 6)

        // Check balance
        const currentBalance = await publicClient.readContract({
          address: USDC_ADDRESS,
          abi: ERC20ABI,
          functionName: 'balanceOf',
          args: [ownerAddress],
        }) as bigint

        if (amountInUnits > currentBalance) {
          setIsWithdrawing(false)
          setIsConfirming(false)
          return { success: false, error: 'Insufficient USDC balance' }
        }

        console.log('[Withdraw USDC] Sending', amount, 'USDC to', smartWalletAddress)

        const hash = await writeContractAsync({
          address: USDC_ADDRESS,
          abi: ERC20ABI,
          functionName: 'transfer',
          args: [smartWalletAddress, amountInUnits],
        })

        console.log('[Withdraw USDC] Transaction sent:', hash)
        setTxHash(hash)
        setIsWithdrawing(false)

        // Refetch balances after delay
        setTimeout(fetchBalances, 3000)

        return { success: true, hash }
      } catch (error) {
        console.error('[Withdraw USDC] Error:', error)
        setIsWithdrawing(false)
        setIsConfirming(false)
        const message = error instanceof Error ? error.message : 'Failed to withdraw USDC'
        return { success: false, error: message }
      }
    },
    [ownerAddress, smartWalletAddress, writeContractAsync, fetchBalances]
  )

  // Generic withdraw function
  const withdraw = useCallback(
    async (token: TokenType, amount: string): Promise<WithdrawResult> => {
      return token === 'ETH' ? withdrawETH(amount) : withdrawUSDC(amount)
    },
    [withdrawETH, withdrawUSDC]
  )

  return {
    // Actions
    withdraw,
    withdrawETH,
    withdrawUSDC,
    refetchBalances: fetchBalances,

    // State
    isWithdrawing,
    isConfirming: isConfirming || isWaitingUsdcReceipt,
    isConfirmed: isUsdcConfirmed,
    isLoadingBalances,
    txHash,

    // EOA Balances
    ethBalance,
    usdcBalance,

    // Smart Wallet Balances
    smartWalletEthBalance,
    smartWalletUsdcBalance,
  }
}
