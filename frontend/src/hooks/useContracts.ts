/**
 * Contract Hooks for DefiCity
 * Custom hooks for interacting with smart contracts
 */

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallets } from '@privy-io/react-auth';
import { CONTRACTS, ABIS } from '@/config/contracts';

// Get current network (for now, hardcoded to localhost for development)
const getCurrentNetwork = () => {
  return 'localhost'; // Change to 'baseSepolia' for testnet
};

/**
 * Hook to get contract instances
 */
export function useContractInstances() {
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
      if (!wallets || wallets.length === 0) {
        return;
      }

      try {
        const embeddedWallet = wallets.find(
          (wallet) => wallet.walletClientType === 'privy'
        );

        if (!embeddedWallet) return;

        const ethereumProvider = await embeddedWallet.getEthereumProvider();
        const provider = new ethers.BrowserProvider(ethereumProvider);
        const signer = await provider.getSigner();

        const network = getCurrentNetwork();
        const addresses = CONTRACTS[network as keyof typeof CONTRACTS];

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
      if (!core || !userAddress) {
        setLoading(false);
        return;
      }

      try {
        const result = await core.hasWallet(userAddress);
        setHasWallet(result);
      } catch (error) {
        console.error('Error checking wallet:', error);
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
      if (!core || !userAddress) {
        setLoading(false);
        return;
      }

      try {
        const wallet = await core.userSmartWallets(userAddress);
        setSmartWallet(wallet === ethers.ZeroAddress ? null : wallet);
      } catch (error) {
        console.error('Error getting wallet:', error);
        setSmartWallet(null);
      } finally {
        setLoading(false);
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
 */
export function useCreateTownHall() {
  const { factory } = useContractInstances();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createTownHall = async (
    userAddress: string,
    x: number,
    y: number
  ): Promise<{ success: boolean; walletAddress?: string; buildingId?: number }> => {
    if (!factory) {
      setError('Factory contract not initialized');
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating Town Hall at position:', x, y);

      const tx = await factory.createTownHall(userAddress, x, y);
      console.log('Transaction sent:', tx.hash);

      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // Parse events to get wallet address and building ID
      // For now, we'll fetch them separately
      const walletAddress = await factory.walletsByOwner(userAddress);

      setLoading(false);
      return {
        success: true,
        walletAddress,
        buildingId: 1, // Will be determined from events
      };
    } catch (err: any) {
      console.error('Error creating Town Hall:', err);
      setError(err.message || 'Failed to create Town Hall');
      setLoading(false);
      return { success: false };
    }
  };

  return { createTownHall, loading, error };
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
