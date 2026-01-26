export { useSmartWallet } from './useSmartWallet'
export { useDeposit } from './useDeposit'
export { useWithdraw } from './useWithdraw'
export { useWalletBalance } from './useWalletBalance'
export { useAavePosition } from './useAavePosition'
export { useTokenBalance } from './useTokenBalance'
export {
  useContractInstances,
  useHasWallet,
  useCreateTownHall,
  useUserBuildings,
  useUserStats
  // Note: useSmartWallet from useContracts is NOT exported to avoid naming conflict
  // Import directly from '@/hooks/useContracts' if needed
} from './useContracts'
