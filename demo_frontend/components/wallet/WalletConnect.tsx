"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { truncateAddress } from "@/lib/utils";
import { Wallet, LogOut } from "lucide-react";

export function WalletConnect() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();

  const embeddedWallet = wallets.find(
    (wallet) => wallet.walletClientType === "privy"
  );

  if (!ready) {
    return (
      <Button variant="outline" disabled>
        Loading...
      </Button>
    );
  }

  if (!authenticated) {
    return (
      <Button onClick={login} className="gap-2">
        <Wallet className="w-4 h-4" />
        Connect Wallet
      </Button>
    );
  }

  const address = embeddedWallet?.address;

  return (
    <div className="flex items-center gap-2">
      {address && (
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          {truncateAddress(address)}
        </Badge>
      )}
      <Button variant="outline" size="icon" onClick={logout}>
        <LogOut className="w-4 h-4" />
      </Button>
    </div>
  );
}
