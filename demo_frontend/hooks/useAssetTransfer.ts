"use client";

import { useState } from "react";
import { useWriteContract, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { ERC20_ABI } from "@/lib/config/tokens";
import { parseUnits } from "viem";
import { toast } from "sonner";

export function useAssetTransfer() {
  const [pendingTx, setPendingTx] = useState<string | null>(null);

  // For ERC20 transfers
  const { writeContract: writeERC20, data: erc20Hash } = useWriteContract();

  // For ETH transfers
  const { sendTransaction: sendETH, data: ethHash } = useSendTransaction();

  // Wait for transaction confirmation
  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: (erc20Hash || ethHash) as `0x${string}` | undefined,
  });

  const isPending = isConfirming;

  /**
   * Deposit assets from EOA to AA wallet (Smart Wallet)
   */
  const deposit = async (
    tokenAddress: string,
    amount: string,
    decimals: number,
    isNative: boolean,
    toAddress: string
  ) => {
    console.log("[useAssetTransfer] Deposit called with:", {
      tokenAddress,
      amount,
      decimals,
      isNative,
      toAddress,
    });

    try {
      setPendingTx("deposit");

      if (isNative) {
        // Deposit ETH
        const value = parseUnits(amount, decimals);
        console.log("[useAssetTransfer] Depositing ETH:", { amount, value: value.toString(), toAddress });

        sendETH({
          to: toAddress as `0x${string}`,
          value,
        });

        console.log("[useAssetTransfer] ETH transaction sent");
        toast.success("Depositing ETH to Smart Wallet...");
      } else {
        // Deposit ERC20
        const value = parseUnits(amount, decimals);
        console.log("[useAssetTransfer] Depositing ERC20:", {
          tokenAddress,
          amount,
          value: value.toString(),
          toAddress,
        });

        // Transfer ERC20 to smart wallet
        writeERC20({
          address: tokenAddress as `0x${string}`,
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [toAddress as `0x${string}`, value],
        });

        console.log("[useAssetTransfer] ERC20 transfer transaction sent");
        toast.success("Depositing tokens to Smart Wallet...");
      }
    } catch (error: any) {
      console.error("[useAssetTransfer] Deposit error:", error);
      toast.error(error?.message || "Failed to deposit");
      setPendingTx(null);
      throw error;
    }
  };

  /**
   * Withdraw assets from AA wallet (Smart Wallet) to EOA
   * Note: This requires calling SmartWallet's execute function with owner signature
   */
  const withdraw = async (
    tokenAddress: string,
    amount: string,
    decimals: number,
    isNative: boolean,
    smartWalletAddress: string,
    eoaAddress: string
  ) => {
    try {
      setPendingTx("withdraw");

      // TODO: Implement SmartWallet.execute() call
      // This requires:
      // 1. Encoding the transfer call (ETH or ERC20)
      // 2. Calling SmartWallet.execute(dest, value, data)
      // 3. Getting proper signature from owner

      console.log("[useAssetTransfer] Withdraw not yet implemented", {
        tokenAddress,
        amount,
        decimals,
        isNative,
        smartWalletAddress,
        eoaAddress,
      });

      toast.info("Withdraw functionality coming soon");
      setPendingTx(null);
    } catch (error: any) {
      console.error("[useAssetTransfer] Withdraw error:", error);
      toast.error(error?.message || "Failed to withdraw");
      setPendingTx(null);
      throw error;
    }
  };

  return {
    deposit,
    withdraw,
    isPending,
    isConfirmed,
    currentTx: pendingTx,
  };
}
