// Validate required environment variables
const validateEnv = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`${name} is not configured. Please set it in .env.local`)
  }
  return value
}

// Base Sepolia Chain Config
export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '84532')
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://sepolia.base.org'
export const FACTORY_ADDRESS = validateEnv(
  process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
  'NEXT_PUBLIC_FACTORY_ADDRESS'
) as `0x${string}`
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''
export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

// Token Addresses on Base Sepolia
export const TOKEN_ADDRESSES = {
  USDC: (process.env.NEXT_PUBLIC_USDC_ADDRESS || '0x036CbD53842c5426634e7929541eC2318f3dCF7e') as `0x${string}`,
  USDT: (process.env.NEXT_PUBLIC_USDT_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  WBTC: (process.env.NEXT_PUBLIC_WBTC_ADDRESS || '0x0000000000000000000000000000000000000000') as `0x${string}`,
  WETH: (process.env.NEXT_PUBLIC_WETH_ADDRESS || '0x4200000000000000000000000000000000000006') as `0x${string}`,
} as const

// Token Decimals
export const TOKEN_DECIMALS = {
  USDC: 6,
  USDT: 6,
  WBTC: 8,
  WETH: 18,
  ETH: 18,
} as const
