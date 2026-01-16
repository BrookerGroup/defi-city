/**
 * Contract Hooks for DefiCity
 * Custom hooks for interacting with smart contracts
 */

import { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import { useWallets } from '@privy-io/react-auth';
import { CONTRACTS, ABIS, SUPPORTED_CHAINS } from '@/config/contracts';

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

        // Switch to Base Sepolia using Privy's best practice method
        try {
          console.log('Switching to Base Sepolia (Chain ID:', TARGET_CHAIN_ID, ')...');
          await wallet.switchChain(TARGET_CHAIN_ID);
          console.log('Successfully switched to Base Sepolia');
        } catch (switchError) {
          console.error('Error switching chain:', switchError);
          // Continue anyway - the chain might already be correct
        }

        const ethereumProvider = await wallet.getEthereumProvider();
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
      setError('Please connect your wallet first. Make sure you are logged in.');
      console.error('Factory contract not initialized - wallet may not be connected');
      return { success: false };
    }

    setLoading(true);
    setError(null);

    try {
      console.log('Creating Town Hall at position:', x, y);
      console.log('User address:', userAddress);
      console.log('Factory address:', await factory.getAddress());

      // First, try to estimate gas to see if the transaction will fail
      try {
        const gasEstimate = await factory.createTownHall.estimateGas(userAddress, x, y);
        console.log('Gas estimate:', gasEstimate.toString());
      } catch (estimateError: any) {
        console.error('Gas estimation failed:', estimateError);
        // Try to get more details about why it failed
        if (estimateError.data) {
          console.error('Error data:', estimateError.data);
        }
        throw new Error(`Transaction will fail: ${estimateError.reason || estimateError.message}`);
      }

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

      // Parse error message for better user experience
      let errorMessage = 'Failed to create Town Hall';
      if (err.reason) {
        errorMessage = err.reason;
      } else if (err.message) {
        if (err.message.includes('insufficient funds')) {
          errorMessage = 'Insufficient ETH for gas. Please add ETH to your wallet on Base Sepolia.';
        } else if (err.message.includes('user rejected')) {
          errorMessage = 'Transaction was rejected by user.';
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
