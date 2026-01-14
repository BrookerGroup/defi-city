import { create } from 'zustand'

interface WalletState {
  smartWalletAddress: `0x${string}` | null
  isCreatingWallet: boolean

  setSmartWalletAddress: (address: `0x${string}` | null) => void
  setIsCreatingWallet: (isCreating: boolean) => void
}

export const useWalletStore = create<WalletState>((set) => ({
  smartWalletAddress: null,
  isCreatingWallet: false,

  setSmartWalletAddress: (address) => set({ smartWalletAddress: address }),
  setIsCreatingWallet: (isCreating) => set({ isCreatingWallet: isCreating }),
}))
