export interface WalletState {
  eoaAddress: `0x${string}` | null
  smartWalletAddress: `0x${string}` | null
  hasSmartWallet: boolean
  isCreatingWallet: boolean
}

export interface TransactionRecord {
  id: string
  type: 'deposit' | 'withdraw'
  amount: string
  token: 'ETH' | 'USDC'
  txHash: string
  timestamp: number
  status: 'pending' | 'confirmed' | 'failed'
}
