// Validate required environment variables
const validateEnv = (value: string | undefined, name: string): string => {
  if (!value) {
    throw new Error(`${name} is not configured. Please set it in .env.local`)
  }
  return value
}

export const CHAIN_ID = parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111')
export const RPC_URL = process.env.NEXT_PUBLIC_RPC_URL || 'https://rpc.sepolia.org'
export const FACTORY_ADDRESS = validateEnv(
  process.env.NEXT_PUBLIC_FACTORY_ADDRESS,
  'NEXT_PUBLIC_FACTORY_ADDRESS'
) as `0x${string}`
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''
export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
