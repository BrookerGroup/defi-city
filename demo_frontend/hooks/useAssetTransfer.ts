"use client";

import { useState } from "react";
import { useWriteContract, useSendTransaction, useWaitForTransactionReceipt } from "wagmi";
import { ERC20_ABI } from "@/lib/config/tokens";
import { SMART_WALLET_ABI } from "@/lib/contracts/SmartWallet";
import { parseUnits, encodeFunctionData } from "viem";
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
   * Note: This calls SmartWallet's execute function as the owner
   */
  const withdraw = async (
    tokenAddress: string,
    amount: string,
    decimals: number,
    isNative: boolean,
    smartWalletAddress: string,
    eoaAddress: string
  ) => {
    console.log("[useAssetTransfer] Withdraw called with:", {
      tokenAddress,
      amount,
      decimals,
      isNative,
      smartWalletAddress,
      eoaAddress,
    });

    try {
      setPendingTx("withdraw");

      const value = parseUnits(amount, decimals);

      if (isNative) {
        // Withdraw ETH: SmartWallet.execute(eoaAddress, amount, "0x")
        console.log("[useAssetTransfer] Withdrawing ETH via SmartWallet.execute:", {
          smartWalletAddress,
          dest: eoaAddress,
          value: value.toString(),
        });

        writeERC20({
          address: smartWalletAddress as `0x${string}`,
          abi: SMART_WALLET_ABI,
          functionName: "execute",
          args: [eoaAddress as `0x${string}`, value, "0x"],
        });

        console.log("[useAssetTransfer] ETH withdraw transaction sent");
        toast.success("Withdrawing ETH from Smart Wallet...");
      } else {
        // Withdraw ERC20: SmartWallet.execute(tokenAddress, 0, encodedTransfer)
        const transferCalldata = encodeFunctionData({
          abi: ERC20_ABI,
          functionName: "transfer",
          args: [eoaAddress as `0x${string}`, value],
        });

        console.log("[useAssetTransfer] Withdrawing ERC20 via SmartWallet.execute:", {
          smartWalletAddress,
          tokenAddress,
          transferCalldata,
          value: value.toString(),
        });

        writeERC20({
          address: smartWalletAddress as `0x${string}`,
          abi: SMART_WALLET_ABI,
          functionName: "execute",
          args: [tokenAddress as `0x${string}`, BigInt(0), transferCalldata],
        });

        console.log("[useAssetTransfer] ERC20 withdraw transaction sent");
        toast.success("Withdrawing tokens from Smart Wallet...");
      }
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
