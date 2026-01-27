"use client";

import { useEffect, useRef } from "react";
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { DEFICITY_CORE_ADDRESS, DEFICITY_CORE_ABI } from "@/lib/contracts/DefiCityCore";
import { Building } from "@/types";
import { toast } from "sonner";
import { getTxUrl } from "@/lib/utils/explorer";

export function useDefiCity(address?: string) {
  console.log("[useDefiCity] Hook called with address:", address);

  // Track shown notifications to prevent duplicates
  const shownNotifications = useRef<Set<string>>(new Set());

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

  // Show confirmation notification
  useEffect(() => {
    if (isConfirmed && hash) {
      const notificationKey = `confirmed-${hash}`;

      // Check if we already showed this notification
      if (shownNotifications.current.has(notificationKey)) {
        return;
      }

      const explorerUrl = getTxUrl(hash);

      toast.success("Town Hall Created Successfully!", {
        duration: 10000,
        action: {
          label: "View on Explorer",
          onClick: () => window.open(explorerUrl, "_blank", "noopener,noreferrer"),
        },
      });

      shownNotifications.current.add(notificationKey);
      console.log("[useDefiCity] Transaction confirmed:", hash);
    }
  }, [isConfirmed, hash]);

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
    hasWallet: hasWallet as boolean | undefined,
    createTownHall,
    isPending: isPending || isConfirming,
    isConfirmed,
    refetchBuildings,
  };
}
