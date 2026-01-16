// Base Sepolia Testnet Configuration
export const CHAIN_ID = 84532
export const RPC_URL = 'https://sepolia.base.org'

// Deployed Contract Addresses (Base Sepolia)
export const ENTRY_POINT_ADDRESS = '0x4290Cd4e3c7a781856c507EeaA02A4F8192d0922' as `0x${string}`
export const CORE_ADDRESS = '0xaDc51D79177BA89E1b3c99994F95E5A825194e59' as `0x${string}`
export const FACTORY_ADDRESS = '0xD7e5Ef23F53c98a01b63e99A91e1547229579c7A' as `0x${string}`

export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID || ''
export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || ''

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const
