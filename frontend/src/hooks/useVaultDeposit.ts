import { useState, useCallback, useEffect } from 'react'
import { useWriteContract, useSendTransaction } from 'wagmi'
import { createPublicClient, http, parseEther, parseUnits, formatEther, formatUnits } from 'viem'
import { baseSepolia } from 'viem/chains'
import { USDC_ADDRESS, ERC20ABI } from '@/lib/contracts'
import { CONTRACTS } from '@/config/contracts'

const USDT_ADDRESS = CONTRACTS.baseSepolia.USDT as `0x${string}`
const ETH_ADDRESS = CONTRACTS.baseSepolia.ETH as `0x${string}`

export type TokenType = 'ETH' | 'USDC'

interface DepositResult {
  success: boolean
  hash?: string
  error?: string
}

// Create a public client for reading data directly from RPC
const publicClient = createPublicClient({
  chain: baseSepolia,
  transport: http('https://base-sepolia-rpc.publicnode.com'),
})

export function useVaultDeposit(
  ownerAddress?: `0x${string}`,
  smartWalletAddress?: `0x${string}` | null
) {
  const [isDepositing, setIsDepositing] = useState(false)
  const [isConfirming, setIsConfirming] = useState(false)
  const { writeContractAsync } = useWriteContract()
  const { sendTransactionAsync } = useSendTransaction()
  const [txHash, setTxHash] = useState<`0x${string}` | undefined>()

  // Balance states
  const [ethBalance, setEthBalance] = useState('0')
  const [usdcBalance, setUsdcBalance] = useState('0')
  const [smartWalletEthBalance, setSmartWalletEthBalance] = useState('0')
  const [smartWalletUsdcBalance, setSmartWalletUsdcBalance] = useState('0')
  const [smartWalletUsdtBalance, setSmartWalletUsdtBalance] = useState('0')
  const [isLoadingBalances, setIsLoadingBalances] = useState(false)

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

        try {
          const swUsdt = await publicClient.readContract({
            address: USDT_ADDRESS,
            abi: ERC20ABI,
            functionName: 'balanceOf',
            args: [smartWalletAddress],
          }) as bigint
          const swUsdtFormatted = formatUnits(swUsdt, 6)
          setSmartWalletUsdtBalance(swUsdtFormatted)
        } catch {
          setSmartWalletUsdtBalance('0')
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

  // Deposit ETH from EOA to Smart Wallet (Vault)
  const depositETH = useCallback(
    async (amount: string): Promise<DepositResult> => {
      if (!ownerAddress || !smartWalletAddress) {
        return { success: false, error: 'Wallet not connected or Smart Wallet not found' }
      }

      setIsDepositing(true)
      try {
        const amountInWei = parseEther(amount)

        // Check balance
        const currentBalance = await publicClient.getBalance({ address: ownerAddress })
        if (amountInWei > currentBalance) {
          setIsDepositing(false)
          return { success: false, error: 'Insufficient ETH balance' }
        }

        console.log('[Vault Deposit ETH] Sending', amount, 'ETH to', smartWalletAddress)

        // Send transaction via wagmi (works with Privy wallet connector)
        setIsConfirming(true)
        const hash = await sendTransactionAsync({
          to: smartWalletAddress,
          value: amountInWei,
        })

        console.log('[Vault Deposit ETH] Transaction sent:', hash)

        // Wait for confirmation using viem
        try {
          await publicClient.waitForTransactionReceipt({ hash })
          console.log('[Vault Deposit ETH] Transaction confirmed!')
        } catch (e) {
          console.log('[Vault Deposit ETH] Wait for receipt error (may still succeed):', e)
        }

        setIsConfirming(false)
        setIsDepositing(false)

        // Refetch balances after delay
        setTimeout(fetchBalances, 2000)

        return { success: true, hash }
      } catch (error) {
        console.error('[Vault Deposit ETH] Error:', error)
        setIsConfirming(false)
        setIsDepositing(false)
        const message = error instanceof Error ? error.message : 'Failed to deposit ETH'
        return { success: false, error: message }
      }
    },
    [ownerAddress, smartWalletAddress, fetchBalances]
  )

  // Deposit USDC from EOA to Smart Wallet (Vault)
  const depositUSDC = useCallback(
    async (amount: string): Promise<DepositResult> => {
      if (!ownerAddress || !smartWalletAddress) {
        return { success: false, error: 'Wallet not connected or Smart Wallet not found' }
      }

      setIsDepositing(true)
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
          setIsDepositing(false)
          setIsConfirming(false)
          return { success: false, error: 'Insufficient USDC balance' }
        }

        console.log('[Vault Deposit USDC] Sending', amount, 'USDC to', smartWalletAddress)

        const hash = await writeContractAsync({
          address: USDC_ADDRESS,
          abi: ERC20ABI,
          functionName: 'transfer',
          args: [smartWalletAddress, amountInUnits],
        })

        // Wait for confirmation using viem (more reliable for sequential logic)
        try {
          await publicClient.waitForTransactionReceipt({ hash })
          console.log('[Vault Deposit USDC] Transaction confirmed!')
        } catch (e) {
          console.log('[Vault Deposit USDC] Wait for receipt error:', e)
        }

        setIsConfirming(false)
        setIsDepositing(false)

        // Refetch balances after delay
        setTimeout(fetchBalances, 2000)

        return { success: true, hash }
      } catch (error) {
        console.error('[Vault Deposit USDC] Error:', error)
        setIsDepositing(false)
        setIsConfirming(false)
        const message = error instanceof Error ? error.message : 'Failed to deposit USDC'
        return { success: false, error: message }
      }
    },
    [ownerAddress, smartWalletAddress, writeContractAsync, fetchBalances]
  )

  // Generic deposit function
  const deposit = useCallback(
    async (token: TokenType, amount: string): Promise<DepositResult> => {
      return token === 'ETH' ? depositETH(amount) : depositUSDC(amount)
    },
    [depositETH, depositUSDC]
  )

  return {
    // Actions
    deposit,
    depositETH,
    depositUSDC,
    refetchBalances: fetchBalances,

    // State
    isDepositing,
    isConfirming,
    isLoadingBalances,
    txHash,

    // EOA Balances
    ethBalance,
    usdcBalance,

    // Smart Wallet Balances
    smartWalletEthBalance,
    smartWalletUsdcBalance,
    smartWalletUsdtBalance,
  }
}
