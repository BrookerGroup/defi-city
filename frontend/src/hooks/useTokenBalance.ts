'use client'

import { useReadContract } from 'wagmi'
import { formatUnits } from 'viem'
import { TOKEN_ADDRESSES, TOKEN_DECIMALS } from '@/lib/constants'

// Standard ERC20 ABI for balanceOf
const ERC20_ABI = [
  {
    inputs: [{ name: 'account', type: 'address' }],
    name: 'balanceOf',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function',
  },
] as const

export type TokenSymbol = 'USDC' | 'USDT' | 'WBTC' | 'WETH'

export function useTokenBalance(
  address: `0x${string}` | undefined,
  token: TokenSymbol
) {
  const tokenAddress = TOKEN_ADDRESSES[token]
  const decimals = TOKEN_DECIMALS[token]

  const { data: balance, isLoading, error, refetch } = useReadContract({
    address: tokenAddress,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && tokenAddress !== '0x0000000000000000000000000000000000000000',
    },
  })

  const formatted = balance ? formatUnits(balance, decimals) : '0'

  return {
    balance,
    formatted,
    decimals,
    isLoading,
    error,
    refetch,
  }
}

// Hook to get all token balances at once
export function useMultiTokenBalance(address: `0x${string}` | undefined) {
  const usdc = useTokenBalance(address, 'USDC')
  const usdt = useTokenBalance(address, 'USDT')
  const wbtc = useTokenBalance(address, 'WBTC')
  const weth = useTokenBalance(address, 'WETH')

  return {
    USDC: usdc,
    USDT: usdt,
    WBTC: wbtc,
    WETH: weth,
    isLoading: usdc.isLoading || usdt.isLoading || wbtc.isLoading || weth.isLoading,
  }
}
