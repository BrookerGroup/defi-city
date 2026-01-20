/**
 * Contract Hooks for DefiCity
 * Custom hooks for interacting with smart contracts
 */

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallets, usePrivy } from '@privy-io/react-auth';
import { CONTRACTS, ABIS, SUPPORTED_CHAINS } from '@/config/contracts';
import type { BuildingAsset } from '@/types';

// Get current network
const getCurrentNetwork = () => {
  return 'baseSepolia';
};

// Base Sepolia Chain ID
const TARGET_CHAIN_ID = SUPPORTED_CHAINS.baseSepolia.id; // 84532

/**
 * Hook to get contract instances
 */
export function useContractInstances() {
  const { ready } = usePrivy();
  const { wallets } = useWallets();
  const [contracts, setContracts] = useState<{
    factory: ethers.Contract | null;
    core: ethers.Contract | null;
    provider: ethers.BrowserProvider | null;
    signer: ethers.Signer | null;
  }>({
    factory: null,
    core: null,
    provider: null,
    signer: null,
  });

  useEffect(() => {
    async function initContracts() {
      // Skip if Privy not ready yet
      if (!ready) {
        console.log('Privy not ready, skipping contract initialization');
        return;
      }

      if (!wallets || wallets.length === 0) {
        console.log('No wallets available yet');
        return;
      }

      try {
        // Try to find the Privy embedded wallet first, then fall back to any available wallet
        let wallet = wallets.find(
          (w) => w.walletClientType === 'privy'
        );

        // If no embedded wallet, use the first available wallet
        if (!wallet && wallets.length > 0) {
          wallet = wallets[0];
          console.log('Using external wallet:', wallet.walletClientType);
        }

        if (!wallet) {
          console.log('No wallet found');
          return;
        }

        console.log('Initializing contracts with wallet:', wallet.address, wallet.walletClientType);

        // Get provider and check current chain
        const ethereumProvider = await wallet.getEthereumProvider();
        const provider = new ethers.BrowserProvider(ethereumProvider);

        // Check current chain ID
        const network = await provider.getNetwork();
        const currentChainId = Number(network.chainId);

        console.log('Current chain ID:', currentChainId, 'Target chain ID:', TARGET_CHAIN_ID);

        // Only switch if not on Base Sepolia
        if (currentChainId !== TARGET_CHAIN_ID) {
          try {
            console.log('Switching to Base Sepolia (Chain ID:', TARGET_CHAIN_ID, ')...');
            await wallet.switchChain(TARGET_CHAIN_ID);
            console.log('Successfully switched to Base Sepolia');

            // Wait a bit for the switch to complete
            await new Promise(resolve => setTimeout(resolve, 500));
          } catch (switchError: any) {
            console.error('Error switching chain:', switchError);

            // If switch fails, prompt user to switch manually
            if (switchError?.code === 4902 || switchError?.message?.includes('Unrecognized chain')) {
              console.warn('Base Sepolia not added to wallet. Please add it manually.');
            }

            // Don't throw - try to continue with current chain
          }
        } else {
          console.log('Already on Base Sepolia, no need to switch');
        }

        const signer = await provider.getSigner();

        const networkKey = getCurrentNetwork();
        const addresses = CONTRACTS[networkKey as keyof typeof CONTRACTS];

        // Only initialize if addresses are set
        if (!addresses.WALLET_FACTORY || !addresses.DEFICITY_CORE) {
          console.warn('Contract addresses not set. Please deploy contracts first.');
          return;
        }

        const factory = new ethers.Contract(
          addresses.WALLET_FACTORY,
          ABIS.WALLET_FACTORY,
          signer
        );

        const core = new ethers.Contract(
          addresses.DEFICITY_CORE,
          ABIS.DEFICITY_CORE,
          signer
        );

        console.log('Contracts initialized successfully');
        setContracts({
          factory,
          core,
          provider,
          signer,
        });
      } catch (error) {
        console.error('Error initializing contracts:', error);
      }
    }

    initContracts();
  }, [wallets]);

  return contracts;
}

/**
 * Hook to check if user has a SmartWallet
 */
export function useHasWallet(userAddress: string | undefined) {
  const { core } = useContractInstances();
  const [hasWallet, setHasWallet] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkWallet() {
      console.log('[useHasWallet] Checking wallet for:', userAddress);
      console.log('[useHasWallet] Core contract:', core ? 'initialized' : 'not initialized');

      if (!core || !userAddress) {
        console.log('[useHasWallet] Missing core or userAddress, skipping check');
        setLoading(false);
        return;
      }

      try {
        console.log('[useHasWallet] Calling core.hasWallet...');
        const result = await core.hasWallet(userAddress);
        console.log('[useHasWallet] Result:', result);
        setHasWallet(result);
      } catch (error) {
        console.error('[useHasWallet] Error checking wallet:', error);
        setHasWallet(false);
      } finally {
        setLoading(false);
      }
    }

    checkWallet();
  }, [core, userAddress]);

  return { hasWallet, loading };
}

/**
 * Hook to get user's SmartWallet address
 */
export function useSmartWallet(userAddress: string | undefined) {
  const { core } = useContractInstances();
  const [smartWallet, setSmartWallet] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getWallet() {
      console.log('[useSmartWallet] Starting wallet check for:', userAddress);
      console.log('[useSmartWallet] Core contract:', core ? 'initialized' : 'not initialized');
      
      if (!core || !userAddress) {
        console.log('[useSmartWallet] Missing core or userAddress');
        setLoading(false);
        return;
      }

      setLoading(true); // Ensure loading is true while checking
      
      try {
        const wallet = await core.userSmartWallets(userAddress);
        console.log('[useSmartWallet] Contract returned wallet:', wallet);
        const walletAddress = wallet === ethers.ZeroAddress ? null : wallet;
        setSmartWallet(walletAddress);
        console.log('[useSmartWallet] Final wallet state:', walletAddress);
      } catch (error) {
        console.error('[useSmartWallet] Error getting wallet:', error);
        setSmartWallet(null);
      } finally {
        setLoading(false);
        console.log('[useSmartWallet] Loading complete');
      }
    }

    getWallet();
  }, [core, userAddress]);

  return { smartWallet, loading };
}

/**
 * Hook to get user's buildings
 */
export function useUserBuildings(userAddress: string | undefined) {
  const { core } = useContractInstances();
  const [buildings, setBuildings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getBuildings() {
      if (!core || !userAddress) {
        setLoading(false);
        return;
      }

      try {
        const result = await core.getUserBuildings(userAddress);
        setBuildings(result);
      } catch (error) {
        console.error('Error getting buildings:', error);
        setBuildings([]);
      } finally {
        setLoading(false);
      }
    }

    getBuildings();
  }, [core, userAddress]);

  return { buildings, loading };
}

/**
 * Hook to create Town Hall
 * Calls DefiCityCore.createTownHall(x, y) which creates both wallet and townhall
 */
export function useCreateTownHall() {
  const { core } = useContractInstances();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTownHall = async (
    _userAddress: string, // Not used - contract uses msg.sender
    x: number,
    y: number
  ): Promise<{ success: boolean; walletAddress?: string; buildingId?: number }> => {
    if (!core) {
      setError('Please connect your wallet first. Make sure you are logged in.');
      console.error('Core contract not initialized - wallet may not be connected');
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating Town Hall at position:', x, y);
      console.log('Core address:', await core.getAddress());

      // First, try to estimate gas to see if the transaction will fail
      try {
        const gasEstimate = await core.createTownHall.estimateGas(x, y);
        console.log('Gas estimate:', gasEstimate.toString());
      } catch (estimateError: any) {
        console.error('Gas estimation failed:', estimateError);
        
        // Check for WalletAlreadyRegistered (0x792279f3)
        if (estimateError.data === '0x792279f3') {
          console.log('[createTownHall] User already has a wallet registered (0x792279f3)');
          // Try to get existing wallet
          try {
            // Get signer address from the user address parameter
            const existingWallet = await core.userSmartWallets(_userAddress);
            if (existingWallet && existingWallet !== ethers.ZeroAddress) {
              console.log('[createTownHall] Found existing wallet:', existingWallet);
              setLoading(false);
              return {
                success: true,
                walletAddress: existingWallet,
                buildingId: 0, // We don't know the building ID
              };
            }
          } catch (e) {
            console.error('[createTownHall] Error getting existing wallet:', e);
          }
          setError('You already have a Town Hall. Each user can only create one.');
          setLoading(false);
          return { success: false };
        }
        
        // Try to decode error
        if (estimateError.data) {
          console.error('Error data:', estimateError.data);
        }

        // Check for specific error messages
        const errorMsg = estimateError.message || '';
        if (errorMsg.includes('WalletAlreadyRegistered')) {
          throw new Error('You already have a Town Hall. Each user can only create one.');
        } else if (errorMsg.includes('GridOccupied')) {
          throw new Error('This position is already occupied. Choose another location.');
        }

        throw new Error(`Transaction will fail: ${estimateError.reason || estimateError.message}`);
      }

      const tx = await core.createTownHall(x, y);
      console.log('Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Parse events to get wallet address and building ID
      let walletAddress: string | undefined;
      let buildingId: number | undefined;

      // Look for BuildingPlaced event in logs
      for (const log of receipt.logs) {
        try {
          const parsed = core.interface.parseLog(log);
          if (parsed?.name === 'BuildingPlaced') {
            buildingId = Number(parsed.args.buildingId);
            walletAddress = parsed.args.smartWallet;
            console.log('Building placed:', { buildingId, walletAddress });
          }
        } catch {
          // Not our event, skip
        }
      }

      setLoading(false);
      return {
        success: true,
        walletAddress,
        buildingId,
      };
    } catch (err: any) {
      console.error('Error creating Town Hall:', err);

      // Parse error message for better user experience
      let errorMessage = 'Failed to create Town Hall';
      if (err.reason) {
        errorMessage = err.reason;
      } else if (err.message) {
        if (err.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient ETH for gas. Please add ETH to your wallet on Base Sepolia.';
        } else if (err.message.includes('user rejected')) {
          errorMessage = 'Transaction was rejected by user.';
        } else if (err.message.includes('WalletAlreadyRegistered')) {
          errorMessage = 'You already have a Town Hall. Each user can only create one.';
        } else if (err.message.includes('GridOccupied')) {
          errorMessage = 'This position is already occupied.';
        } else {
          errorMessage = err.message;
        }
      }

      setError(errorMessage);
      setLoading(false);
      return { success: false };
    }
  };

  return { createTownHall, loading, error };
}

/**
 * Hook to sync buildings from contract to localStorage
 * This ensures the game state is always in sync with blockchain
 */
export function useSyncBuildings(userAddress: string | undefined) {
  const { core } = useContractInstances();
  const [synced, setSynced] = useState(false);
  const [loading, setLoading] = useState(true);
  const [refetchTrigger, setRefetchTrigger] = useState(0);

  // Refetch function to manually trigger sync
  const refetch = () => {
    console.log('[useSyncBuildings] Manual refetch triggered');
    setRefetchTrigger(prev => prev + 1);
  };

  useEffect(() => {
    // Reset synced state when userAddress changes
    setSynced(false);
    setLoading(true);

    async function syncBuildings() {
      if (!core || !userAddress) {
        setLoading(false);
        return;
      }

      try {
        console.log('[useSyncBuildings] Fetching buildings from contract for:', userAddress);
        const contractBuildings = await core.getUserBuildings(userAddress);
        console.log('[useSyncBuildings] Contract buildings:', contractBuildings);

        // Only sync if there are buildings on-chain
        if (contractBuildings && contractBuildings.length > 0) {
          // Import gameStore dynamically to avoid circular dependencies
          const { useGameStore } = await import('@/store/gameStore');
          const gameStore = useGameStore.getState();

          // Get existing buildings
          const existingBuildings = gameStore.buildings;
          console.log('[useSyncBuildings] Existing buildings:', existingBuildings.length);

          // Create map of contract buildings
          const contractBuildingIds = new Set<string>();
          const contractBuildingsMap = new Map<string, any>();

          for (const building of contractBuildings) {
            if (!building.active) continue;
            const buildingId = `building-${building.id}`;
            contractBuildingIds.add(buildingId);
            contractBuildingsMap.set(buildingId, building);
          }

          // Remove buildings that don't exist in contract anymore
          for (const existingBuilding of existingBuildings) {
            if (!contractBuildingIds.has(existingBuilding.id)) {
              console.log('[useSyncBuildings] Removing building not in contract:', existingBuilding.id);
              gameStore.removeBuilding(existingBuilding.id);
            }
          }

          // Add new buildings from contract
          for (const [buildingId, building] of contractBuildingsMap) {
            const exists = existingBuildings.some(b => b.id === buildingId);

            if (!exists) {
              const gameBuilding = {
                id: buildingId,
                type: building.buildingType.toLowerCase() as any,
                position: {
                  x: Number(building.coordinateX),
                  y: Number(building.coordinateY),
                },
                createdAt: Number(building.placedAt) * 1000,
                // asset is BuildingAsset (string), not object
                asset: building.asset !== ethers.ZeroAddress ? 'ETH' as BuildingAsset : undefined,
                deposited: building.amount > 0n ? ethers.formatEther(building.amount) : undefined,
              };

              console.log('[useSyncBuildings] Adding new building to game store:', gameBuilding);
              gameStore.addBuilding(gameBuilding);
            }
          }

          setSynced(true);
          console.log('[useSyncBuildings] Sync completed. Contract buildings:', contractBuildingIds.size, 'Local buildings:', gameStore.buildings.length);
        } else {
          console.log('[useSyncBuildings] No buildings found on contract');
        }
      } catch (error) {
        console.error('[useSyncBuildings] Error syncing buildings:', error);
      } finally {
        setLoading(false);
      }
    }

    syncBuildings();
  }, [core, userAddress, refetchTrigger]);

  return { synced, loading, refetch };
}

/**
 * Hook to get user stats
 */
export function useUserStats(userAddress: string | undefined) {
  const { core } = useContractInstances();
  const [stats, setStats] = useState<{
    totalDeposited: bigint;
    totalWithdrawn: bigint;
    totalHarvested: bigint;
    buildingCount: bigint;
    cityCreatedAt: bigint;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function getStats() {
      if (!core || !userAddress) {
        setLoading(false);
        return;
      }

      try {
        const result = await core.userStats(userAddress);
        setStats(result);
      } catch (error) {
        console.error('Error getting stats:', error);
        setStats(null);
      } finally {
        setLoading(false);
      }
    }

    getStats();
  }, [core, userAddress]);

  return { stats, loading };
}
