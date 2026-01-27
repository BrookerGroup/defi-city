"use client";

import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { DEFICITY_CORE_ADDRESS, DEFICITY_CORE_ABI } from "@/lib/contracts/DefiCityCore";
import { Building, UserStats } from "@/types";

export function useDefiCity(address?: string) {
  console.log("[useDefiCity] Hook called with address:", address);

  // Read user's buildings
  const { data: buildings, refetch: refetchBuildings } = useReadContract({
    address: DEFICITY_CORE_ADDRESS,
    abi: DEFICITY_CORE_ABI,
    functionName: "getUserBuildings",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    },
  });

  console.log("[useDefiCity] Buildings data:", buildings);

  // Read user stats
  const { data: stats, refetch: refetchStats } = useReadContract({
    address: DEFICITY_CORE_ADDRESS,
    abi: DEFICITY_CORE_ABI,
    functionName: "getUserStats",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Check if user has wallet
  const { data: hasWallet } = useReadContract({
    address: DEFICITY_CORE_ADDRESS,
    abi: DEFICITY_CORE_ABI,
    functionName: "hasWallet",
    args: address ? [address as `0x${string}`] : undefined,
    query: {
      enabled: !!address,
    },
  });

  // Write contract for creating town hall
  const { writeContract, data: hash, isPending } = useWriteContract();

  // Wait for transaction
  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  console.log("[useDefiCity] Transaction hash:", hash);
  console.log("[useDefiCity] isPending:", isPending, "isConfirming:", isConfirming, "isConfirmed:", isConfirmed);

  const createTownHall = async (x: number, y: number) => {
    console.log("[useDefiCity] Creating Town Hall at:", x, y);
    writeContract({
      address: DEFICITY_CORE_ADDRESS,
      abi: DEFICITY_CORE_ABI,
      functionName: "createTownHall",
      args: [BigInt(x), BigInt(y)],
    });
  };

  const buildingsArray = (buildings as Building[]) || [];
  console.log("[useDefiCity] Returning buildings array:", buildingsArray, "length:", buildingsArray.length);

  return {
    buildings: buildingsArray,
    stats: stats as UserStats | undefined,
    hasWallet: hasWallet as boolean | undefined,
    createTownHall,
    isPending: isPending || isConfirming,
    isConfirmed,
    refetchBuildings,
    refetchStats,
  };
}
