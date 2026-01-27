// Base Sepolia Testnet Configuration
export const CHAIN_ID = 84532
// Use public RPC endpoints - fallback options
export const RPC_URL =
  process.env.NEXT_PUBLIC_RPC_URL ||
  'https://base-sepolia-rpc.publicnode.com'

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''
export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

// Game Configuration
export const GRID_SIZE = 13
