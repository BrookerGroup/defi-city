"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useMemo, useState, useEffect, useCallback } from "react";
import {
  useSmartWallet,
  useCreateSmartAccount,
  useVaultDeposit,
  useVaultWithdraw,
  useCityBuildings,
  useMoveBuilding,
  TokenType,
} from "@/hooks";
import type { Building } from "@/hooks/useCityBuildings";
import { GameCanvas } from "@/components/game/GameCanvas";
import { useGameState } from "@/components/game/useGameState";
import { GameHUD } from "@/components/game/ui/GameHUD";
import { BuildPanel } from "@/components/game/ui/BuildPanel";
import { VaultPanel } from "@/components/game/ui/VaultPanel";
import { BottomBar } from "@/components/game/ui/BottomBar";
import { TownHallModal } from "@/components/game/ui/TownHallModal";

export default function AppPage() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallets } = useWallets();

  // Get external wallet address
  const wallet = useMemo(() => {
    return wallets.find((w) => w.walletClientType !== "privy");
  }, [wallets]);

  const address = wallet?.address as `0x${string}` | undefined;

  // Track if waiting too long for wallet
  const [waitingTooLong, setWaitingTooLong] = useState(false);

  // Auto-trigger wallet connection and network switch when authenticated
  useEffect(() => {
    if (authenticated) {
      const handleNetworkAndWallet = async () => {
        try {
          if (wallet && wallet.chainId !== 'eip155:84532' && wallet.chainId !== '84532') {
            console.log("[App] Switching to Base Sepolia...");
            await wallet.switchChain(84532);
          }
          if (!address) {
            const ethereum = (window as any).ethereum;
            if (ethereum) {
              await ethereum.request({ method: "eth_requestAccounts" });
            }
          }
        } catch (err) {
          console.error("[App] External wallet error:", err);
          setWaitingTooLong(true);
        }
      };
      handleNetworkAndWallet();
    } else {
      setWaitingTooLong(false);
    }
  }, [authenticated, address, wallet]);

  // Smart Account
  const {
    smartWallet,
    loading: smartWalletLoading,
    hasSmartWallet,
    refetch,
  } = useSmartWallet(address);
  const { createSmartAccount, isPending: isCreating } = useCreateSmartAccount();

  // Vault Actions
  const {
    deposit: vaultDeposit,
    isDepositing,
    isConfirming: isConfirmingDeposit,
    ethBalance,
    usdcBalance,
    usdtBalance,
    wbtcBalance,
    linkBalance,
    smartWalletEthBalance,
    smartWalletUsdcBalance,
    smartWalletUsdtBalance,
    smartWalletWbtcBalance,
    smartWalletLinkBalance,
    refetchBalances,
  } = useVaultDeposit(address, smartWallet);

  const {
    withdraw: vaultWithdraw,
    isWithdrawing: isWithdrawingFromVault,
    isConfirming: isConfirmingWithdraw,
  } = useVaultWithdraw(address, smartWallet, refetchBalances);

  // Move Building
  const { moveBuilding, loading: isMovingBuilding } = useMoveBuilding();

  // City Map & Buildings
  const {
    buildings,
    allBuildings,
    loading: buildingsLoading,
    refresh: refreshBuildings,
  } = useCityBuildings(address, smartWallet);

  const [selectedCoords, setSelectedCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showBuildPanel, setShowBuildPanel] = useState(false);
  const [showVaultPanel, setShowVaultPanel] = useState(false);

  // Compute used assets and selected building
  const usedAssets = useMemo(
    () => buildings.filter((b) => b.type !== "townhall").map((b) => b.asset),
    [buildings],
  );

  const selectedBuilding = useMemo(() => {
    if (!selectedCoords) return null;
    const found =
      allBuildings.find(
        (b) => b.x === selectedCoords.x && b.y === selectedCoords.y && b.active,
      ) || null;
    return found;
  }, [selectedCoords, allBuildings]);

  // Handlers
  const handleCreateTownHall = async () => {
    if (!address) return;
    const result = await createSmartAccount();
    if (result.success) {
      refetch();
    }
  };

  const handleSelectTile = useCallback(
    (x: number, y: number) => {
      // Skip Town Hall tile
      const clickedBuilding = buildings.find((b) => b.x === x && b.y === y);
      if (clickedBuilding?.type === "townhall") return;
      setSelectedCoords({ x, y });
      setShowBuildPanel(true);
    },
    [buildings],
  );

  const handleMoveBuilding = useCallback(
    async (building: Building, newX: number, newY: number) => {
      if (!smartWallet) return;
      const result = await moveBuilding(smartWallet, building, newX, newY);
      if (result.success) {
        refreshBuildings();
        setTimeout(() => refreshBuildings(), 3000);
      }
    },
    [smartWallet, moveBuilding, refreshBuildings],
  );

  const handleBuildSuccess = useCallback(() => {
    refetchBalances();
    refreshBuildings();
    setTimeout(() => {
      console.log("[App] Performing delayed building refresh...");
      refreshBuildings();
    }, 3000);
    setSelectedCoords(null);
  }, [refetchBalances, refreshBuildings]);

  const handleVaultDeposit = useCallback(
    async (token: TokenType, amount: string) => {
      if (!amount || parseFloat(amount) <= 0) return;
      const result = await vaultDeposit(token, amount);
      if (result.success) {
        refreshBuildings();
      }
    },
    [vaultDeposit, refreshBuildings],
  );

  const handleVaultWithdraw = useCallback(
    async (token: TokenType, amount: string) => {
      if (!amount || parseFloat(amount) <= 0) return;
      const result = await vaultWithdraw(token, amount);
      if (result.success) {
        refreshBuildings();
      }
    },
    [vaultWithdraw, refreshBuildings],
  );

  // PixiJS game state bridge
  const {
    initWorld,
    loading: gameLoading,
    resetCamera,
    zoomIn,
    zoomOut,
  } = useGameState({
    buildings,
    selectedCoords,
    onSelectTile: handleSelectTile,
    onMoveBuilding: handleMoveBuilding,
  });

  // Loading state
  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <p
          className="text-amber-400 text-sm animate-pulse"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          LOADING...
        </p>
      </div>
    );
  }

  // Not authenticated
  if (!authenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-8 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
        <h1
          className="text-amber-400 text-3xl"
          style={{
            fontFamily: '"Press Start 2P", monospace',
            textShadow: "4px 4px 0px #92400E",
          }}
        >
          DEFICITY
        </h1>
        <button onClick={login} className="relative group">
          <div className="absolute inset-0 bg-amber-900 translate-x-2 translate-y-2" />
          <div
            className="relative px-8 py-4 bg-amber-600 border-4 border-amber-400 text-white font-bold transition-transform group-hover:-translate-y-1"
            style={{ fontFamily: '"Press Start 2P", monospace' }}
          >
            CONNECT WALLET
          </div>
        </button>
      </div>
    );
  }

  // Waiting for wallet address
  if (!address) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-slate-900">
        <p
          className="text-amber-400 text-sm animate-pulse"
          style={{ fontFamily: '"Press Start 2P", monospace' }}
        >
          CONNECTING WALLET...
        </p>
        {waitingTooLong && (
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-slate-700 text-white text-xs"
          >
            REFRESH
          </button>
        )}
      </div>
    );
  }

  // Vault balances for the build panel
  const vaultBalances = {
    USDC: smartWalletUsdcBalance,
    USDT: smartWalletUsdtBalance,
    ETH: smartWalletEthBalance,
    WBTC: smartWalletWbtcBalance,
    LINK: smartWalletLinkBalance,
  };

  return (
    <div className="fixed inset-0 overflow-hidden">
      {/* PixiJS Canvas - Full screen */}
      <GameCanvas onReady={initWorld} />

      {/* Game loading overlay */}
      {gameLoading && (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-slate-900/80">
          <div className="flex flex-col items-center gap-4">
            <div className="flex gap-2">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="w-3 h-3 bg-amber-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.1}s` }}
                />
              ))}
            </div>
            <p
              className="text-amber-400 text-[10px]"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              LOADING CITY...
            </p>
          </div>
        </div>
      )}

      {/* UI Overlay Layer - pointer-events-none so clicks pass to canvas */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col">
        {/* Top: HUD */}
        <GameHUD
          address={address}
          ethBalance={ethBalance}
          usdcBalance={usdcBalance}
          usdtBalance={usdtBalance}
          wbtcBalance={wbtcBalance}
          linkBalance={linkBalance}
          smartWalletEthBalance={smartWalletEthBalance}
          smartWalletUsdcBalance={smartWalletUsdcBalance}
          smartWalletUsdtBalance={smartWalletUsdtBalance}
          smartWalletWbtcBalance={smartWalletWbtcBalance}
          smartWalletLinkBalance={smartWalletLinkBalance}
          hasSmartWallet={hasSmartWallet}
          showVault={showVaultPanel}
          onToggleVault={() => setShowVaultPanel((v) => !v)}
          onLogout={logout}
        />

        {/* Middle: Side panels */}
        <div className="flex-1 relative">
          {/* Left: Build Panel */}
          <BuildPanel
            visible={showBuildPanel && hasSmartWallet}
            selectedCoords={selectedCoords}
            selectedBuilding={selectedBuilding}
            smartWallet={smartWallet ?? null}
            hasSmartWallet={hasSmartWallet}
            userAddress={address}
            usedAssets={usedAssets}
            allBuildings={allBuildings}
            vaultBalances={vaultBalances}
            onSuccess={handleBuildSuccess}
            onClose={() => {
              setShowBuildPanel(false);
              setSelectedCoords(null);
            }}
          />

          {/* Right: Vault Panel */}
          <VaultPanel
            visible={showVaultPanel && hasSmartWallet}
            address={address}
            ethBalance={ethBalance}
            usdcBalance={usdcBalance}
            usdtBalance={usdtBalance}
            wbtcBalance={wbtcBalance}
            linkBalance={linkBalance}
            smartWallet={smartWallet ?? null}
            smartWalletEthBalance={smartWalletEthBalance}
            smartWalletUsdcBalance={smartWalletUsdcBalance}
            smartWalletUsdtBalance={smartWalletUsdtBalance}
            smartWalletWbtcBalance={smartWalletWbtcBalance}
            smartWalletLinkBalance={smartWalletLinkBalance}
            onDeposit={handleVaultDeposit}
            onWithdraw={handleVaultWithdraw}
            isDepositing={isDepositing || isConfirmingDeposit}
            isWithdrawing={isWithdrawingFromVault || isConfirmingWithdraw}
            onClose={() => setShowVaultPanel(false)}
          />
        </div>

        {/* Bottom: Status bar */}
        <BottomBar
          selectedCoords={selectedCoords}
          buildingCount={buildings.filter((b) => b.type !== "townhall").length}
          onResetCamera={resetCamera}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          isMoving={isMovingBuilding}
          isLoading={buildingsLoading}
        />
      </div>

      {/* Town Hall Modal - Full screen, above everything */}
      <TownHallModal
        visible={!smartWallet && !smartWalletLoading && authenticated}
        isCreating={isCreating}
        onCreateTownHall={handleCreateTownHall}
      />
    </div>
  );
}
