"use client";

import { useState, useEffect } from "react";
import { useWallets } from "@privy-io/react-auth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Building } from "@/types";
import { useWalletBalances } from "@/hooks/useWalletBalances";
import { useAssetTransfer } from "@/hooks/useAssetTransfer";
import { toast } from "sonner";

interface TownHallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  building: Building | null;
}

type TabType = "deposit" | "withdraw";

export function TownHallModal({
  open,
  onOpenChange,
  building,
}: TownHallModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>("deposit");
  const [selectedAsset, setSelectedAsset] = useState<string | null>(null);
  const [amount, setAmount] = useState("");

  // Get EOA wallet address
  const { wallets, ready } = useWallets();
  const eoaAddress = ready && wallets.length > 0 ? wallets[0].address : undefined;

  // Get AA wallet address from building
  const aaAddress = building?.smartWallet;

  console.log("[TownHallModal] EOA address:", eoaAddress);
  console.log("[TownHallModal] AA address:", aaAddress);

  // Fetch balances
  const { assets: eoaAssets, isLoading: eoaLoading } = useWalletBalances(eoaAddress);
  const { assets: aaAssets, isLoading: aaLoading } = useWalletBalances(aaAddress);

  // Asset transfer hook
  const { deposit, withdraw, isPending, isConfirmed } = useAssetTransfer();

  // Reset form when modal closes or tab changes
  useEffect(() => {
    if (!open) {
      setSelectedAsset(null);
      setAmount("");
    }
  }, [open]);

  useEffect(() => {
    setSelectedAsset(null);
    setAmount("");
  }, [activeTab]);

  // Refetch balances after transaction confirms
  useEffect(() => {
    if (isConfirmed) {
      toast.success("Transaction confirmed!");
      onOpenChange(false);
    }
  }, [isConfirmed, onOpenChange]);

  const handleDeposit = async () => {
    console.log("[TownHallModal] handleDeposit called", {
      selectedAsset,
      amount,
      aaAddress,
      eoaAssets,
    });

    if (!selectedAsset || !amount || !aaAddress) {
      toast.error("Please select an asset and enter an amount");
      return;
    }

    const asset = eoaAssets.find((a) => a.address === selectedAsset);
    console.log("[TownHallModal] Found asset:", asset);

    if (!asset) {
      toast.error("Asset not found");
      return;
    }

    try {
      console.log("[TownHallModal] Calling deposit function...");
      await deposit(asset.address, amount, asset.decimals, asset.isNative, aaAddress);
      console.log("[TownHallModal] Deposit function returned");
    } catch (error) {
      console.error("[TownHallModal] Deposit failed:", error);
    }
  };

  const handleWithdraw = async () => {
    if (!selectedAsset || !amount || !aaAddress || !eoaAddress) {
      toast.error("Please select an asset and enter an amount");
      return;
    }

    const asset = aaAssets.find((a) => a.address === selectedAsset);
    if (!asset) return;

    try {
      await withdraw(asset.address, amount, asset.decimals, asset.isNative, aaAddress, eoaAddress);
    } catch (error) {
      console.error("Withdraw failed:", error);
    }
  };

  const assets = activeTab === "deposit" ? eoaAssets : aaAssets;
  const walletType = activeTab === "deposit" ? "EOA Wallet" : "AA Wallet";
  const isLoading = activeTab === "deposit" ? eoaLoading : aaLoading;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Town Hall - Asset Management</DialogTitle>
          <DialogDescription>
            {building
              ? `Position: (${building.coordinateX}, ${building.coordinateY})`
              : "Manage your assets"}
          </DialogDescription>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 border-b">
          <button
            onClick={() => setActiveTab("deposit")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "deposit"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Deposit
          </button>
          <button
            onClick={() => setActiveTab("withdraw")}
            className={`px-4 py-2 font-medium transition-colors ${
              activeTab === "withdraw"
                ? "border-b-2 border-primary text-primary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Withdraw
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">
              {activeTab === "deposit" ? "Available Assets" : "Deposited Assets"}
            </h3>
            <Badge variant="secondary">{walletType}</Badge>
          </div>

          {/* Asset List */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading balances...
              </div>
            ) : assets.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No assets available
              </div>
            ) : (
              assets.map((asset) => (
                <Card
                  key={asset.address}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    selectedAsset === asset.address
                      ? "border-2 border-primary bg-primary/5"
                      : "border"
                  }`}
                  onClick={() => setSelectedAsset(asset.address)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{asset.symbol}</h4>
                      <p className="text-xs text-muted-foreground">
                        {asset.isNative ? "Native Token" : `${asset.address.substring(0, 10)}...`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold">
                        {Number(asset.balance).toFixed(asset.symbol === "USDC" ? 2 : 4)}
                      </p>
                      <p className="text-xs text-muted-foreground">Balance</p>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Amount Input */}
          {selectedAsset && (
            <div className="space-y-2 pt-4">
              <label className="text-sm font-medium">Amount</label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  placeholder="0.0"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="flex-1"
                  step="any"
                  min="0"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const selectedAssetData = assets.find((a) => a.address === selectedAsset);
                    if (selectedAssetData) {
                      setAmount(selectedAssetData.balance);
                    }
                  }}
                >
                  Max
                </Button>
              </div>
            </div>
          )}

          {/* Action Button */}
          <div className="flex gap-2 pt-4">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={activeTab === "deposit" ? handleDeposit : handleWithdraw}
              disabled={!selectedAsset || !amount || isPending}
              className="flex-1"
            >
              {isPending
                ? "Processing..."
                : activeTab === "deposit"
                ? "Deposit"
                : "Withdraw"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
