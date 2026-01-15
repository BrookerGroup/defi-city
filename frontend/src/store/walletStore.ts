import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface WalletState {
  smartWalletAddress: `0x${string}` | null
  isCreatingWallet: boolean
  lastConnectedAt: number | null

  setSmartWalletAddress: (address: `0x${string}` | null) => void
  setIsCreatingWallet: (isCreating: boolean) => void
  clearWallet: () => void
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      smartWalletAddress: null,
      isCreatingWallet: false,
      lastConnectedAt: null,

      setSmartWalletAddress: (address) =>
        set({
          smartWalletAddress: address,
          lastConnectedAt: address ? Date.now() : null,
        }),

      setIsCreatingWallet: (isCreating) => set({ isCreatingWallet: isCreating }),

      clearWallet: () =>
        set({
          smartWalletAddress: null,
          isCreatingWallet: false,
          lastConnectedAt: null,
        }),
    }),
    {
      name: 'defi-city-wallet',
      partialize: (state) => ({
        smartWalletAddress: state.smartWalletAddress,
        lastConnectedAt: state.lastConnectedAt,
      }),
    }
  )
)
