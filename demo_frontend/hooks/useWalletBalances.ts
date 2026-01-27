"use client";

import { useBalance, useReadContract } from "wagmi";
import { TOKENS, TOKEN_LIST, ERC20_ABI } from "@/lib/config/tokens";
import { formatUnits } from "viem";

export interface WalletAsset {
  symbol: string;
  balance: string;
  decimals: number;
  address: string;
  isNative: boolean;
}

export function useWalletBalances(address?: string) {
  console.log("[useWalletBalances] Fetching balances for:", address);

  // Fetch ETH balance
  const { data: ethBalance } = useBalance({
    address: address as `0x${string}` | undefined,
    query: {
      enabled: !!address,
    },
  });

  // Fetch USDC balance
  const { data: usdcBalance } = useReadContract({
    address: TOKENS.USDC.address,
    abi: ERC20_ABI,
    functionName: "balanceOf",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    },
  });

  console.log("[useWalletBalances] ETH balance:", ethBalance);
  console.log("[useWalletBalances] USDC balance:", usdcBalance);

  // Build assets array
  const assets: WalletAsset[] = [];

  // Add ETH
  if (ethBalance) {
    assets.push({
      symbol: TOKENS.ETH.symbol,
      balance: formatUnits(ethBalance.value, TOKENS.ETH.decimals),
      decimals: TOKENS.ETH.decimals,
      address: TOKENS.ETH.address,
      isNative: true,
    });
  }

  // Add USDC
  if (usdcBalance !== undefined) {
    assets.push({
      symbol: TOKENS.USDC.symbol,
      balance: formatUnits(usdcBalance as bigint, TOKENS.USDC.decimals),
      decimals: TOKENS.USDC.decimals,
      address: TOKENS.USDC.address,
      isNative: false,
    });
  }

  console.log("[useWalletBalances] Returning assets:", assets);

  return {
    assets,
    isLoading: !ethBalance && !usdcBalance,
  };
}
