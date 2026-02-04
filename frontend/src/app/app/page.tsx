"use client";

import { usePrivy, useWallets } from "@privy-io/react-auth";
import { useMemo, useState, useEffect, useCallback, useRef } from "react";
import { toast } from "react-hot-toast";
import {
  useSmartWallet,
  useCreateSmartAccount,
  useVaultDeposit,
  useVaultWithdraw,
  useCityBuildings,
  useMoveBuilding,
  useUniswapSwap,
  TokenType,
} from "@/hooks";
import type { Building } from "@/hooks/useCityBuildings";
import { GameCanvas } from "@/components/game/GameCanvas";
import { useGameState } from "@/components/game/useGameState";
import { GameHUD } from "@/components/game/ui/GameHUD";
import { BuildPanel } from "@/components/game/ui/BuildPanel";
import { BuildingDialog } from "@/components/game/ui/BuildingDialog";
import { LotteryDialog } from "@/components/game/ui/LotteryDialog";
import { VaultPanel } from "@/components/game/ui/VaultPanel";
import { TransactionHistoryPanel } from "@/components/game/ui/TransactionHistoryPanel";
import { BottomBar } from "@/components/game/ui/BottomBar";
import { TownHallModal } from "@/components/game/ui/TownHallModal";
import { TownHallInfoPanel } from "@/components/game/ui/TownHallInfoPanel";

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
    mpusdcBalance,
    smartWalletEthBalance,
    smartWalletWethBalance,
    smartWalletUsdcBalance,
    smartWalletUsdtBalance,
    smartWalletWbtcBalance,
    smartWalletLinkBalance,
    smartWalletMpusdcBalance,
    refetchBalances,
  } = useVaultDeposit(address, smartWallet);

  const {
    withdraw: vaultWithdraw,
    isWithdrawing: isWithdrawingFromVault,
    isConfirming: isConfirmingWithdraw,
  } = useVaultWithdraw(address, smartWallet, refetchBalances);

  // Swap (Uniswap V3)
  const {
    swap,
    getQuote,
    loading: swapLoading,
    error: swapError,
  } = useUniswapSwap(smartWallet ?? null);

  const handleSwap = useCallback(
    async (
      tokenIn: Parameters<typeof swap>[0],
      tokenOut: Parameters<typeof swap>[1],
      amountInRaw: bigint,
      amountOutMin: bigint,
      fee?: number
    ) => {
      const result = await swap(tokenIn, tokenOut, amountInRaw, amountOutMin, fee);
      if (result.success) {
        refetchBalances();
      }
      return result;
    },
    [swap, refetchBalances]
  );

  // Move Building
  const { moveBuilding, loading: isMovingBuilding } = useMoveBuilding();

  // City Map & Buildings
  const {
    buildings,
    allBuildings,
    loading: buildingsLoading,
    refresh: refreshBuildings,
    optimisticMove,
  } = useCityBuildings(address, smartWallet);

  const [selectedCoords, setSelectedCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [showBuildPanel, setShowBuildPanel] = useState(false);
  const [showVaultPanel, setShowVaultPanel] = useState(false);
  const [showHistoryPanel, setShowHistoryPanel] = useState(false);
  const [showTownHallPanel, setShowTownHallPanel] = useState(false);

  // Drag-to-build state
  const [dragBuildType, setDragBuildType] = useState<'supply' | 'borrow' | 'lp' | 'lottery' | null>(null);
  const [dragPos, setDragPos] = useState<{ x: number; y: number } | null>(null);
  const dragBuildTypeRef = useRef<'supply' | 'borrow' | 'lp' | 'lottery' | null>(null);
  // Dialog state (set on drop, cleared on dialog close)
  const [showBuildDialog, setShowBuildDialog] = useState(false);
  const [showLotteryDialog, setShowLotteryDialog] = useState(false);
  const [dialogBuildType, setDialogBuildType] = useState<'supply' | 'borrow' | 'lp' | 'lottery' | null>(null);

  // Compute used assets
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
      // Open Town Hall info panel when clicking Town Hall
      // Use allBuildings to ensure LP buildings are selectable too
      const clickedBuilding = allBuildings.find((b) => b.x === x && b.y === y && b.active);
      if (clickedBuilding?.type === "townhall") {
        setShowTownHallPanel(true);
        setShowBuildPanel(false);
        setSelectedCoords(null);
        return;
      }
      // Existing building → open manage panel
      if (clickedBuilding) {
        setSelectedCoords({ x, y });
        setShowBuildPanel(true);
        setShowTownHallPanel(false);
        return;
      }
      // Empty tile click → do nothing (build only via drag)
    },
    [allBuildings],
  );

  const handleMoveBuilding = useCallback(
    async (building: Building, newX: number, newY: number) => {
      if (!smartWallet || !address) return;

      // Optimistic update — move building in UI immediately
      const prevX = building.x;
      const prevY = building.y;
      optimisticMove(building.id, newX, newY);

      const result = await moveBuilding(address, smartWallet, building, newX, newY);
      if (result.success) {
        refreshBuildings();
        setTimeout(() => refreshBuildings(), 3000);
      } else {
        // Revert on failure
        optimisticMove(building.id, prevX, prevY);
      }
    },
    [address, smartWallet, moveBuilding, refreshBuildings, optimisticMove],
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
        toast.success(`${amount} ${token} deposited to vault!`);
        refreshBuildings();
      } else {
        toast.error(`Deposit failed: ${result.error || 'Unknown error'}`);
      }
    },
    [vaultDeposit, refreshBuildings],
  );

  const handleVaultWithdraw = useCallback(
    async (token: TokenType, amount: string) => {
      if (!amount || parseFloat(amount) <= 0) return;
      const result = await vaultWithdraw(token, amount);
      if (result.success) {
        toast.success(`${amount} ${token} withdrawn to wallet!`);
        refreshBuildings();
      } else {
        toast.error(`Withdrawal failed: ${result.error || 'Unknown error'}`);
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
    screenToGrid,
    showDragHover,
    clearDragHover,
  } = useGameState({
    buildings,
    selectedCoords,
    onSelectTile: handleSelectTile,
    onMoveBuilding: handleMoveBuilding,
  });

  // Drag-to-build: start drag from BottomBar button
  const handleDragBuildStart = useCallback(
    (type: 'supply' | 'borrow' | 'lp' | 'lottery') => {
      setDragBuildType(type);
      dragBuildTypeRef.current = type;

      const onPointerMove = (e: PointerEvent) => {
        setDragPos({ x: e.clientX, y: e.clientY });
        showDragHover(e.clientX, e.clientY);
      };

      const onPointerUp = (e: PointerEvent) => {
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerup', onPointerUp);

        const currentType = dragBuildTypeRef.current;
        const gridCoords = screenToGrid(e.clientX, e.clientY);
        if (gridCoords) {
          // Check tile is empty (no existing building)
          const occupied = buildings.find(
            (b) => b.x === gridCoords.x && b.y === gridCoords.y,
          );
          if (!occupied) {
            setDialogBuildType(currentType);
            setSelectedCoords(gridCoords);
            setShowTownHallPanel(false);
            if (currentType === 'lottery') {
              setShowLotteryDialog(true);
            } else {
              setShowBuildDialog(true);
            }
          }
        }

        clearDragHover();
        setDragBuildType(null);
        setDragPos(null);
        dragBuildTypeRef.current = null;
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
    },
    [buildings, screenToGrid, showDragHover, clearDragHover],
  );

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

  // Vault balances for the build panel (WETH = ERC20 wrapped ETH from swap)
  const vaultBalances = {
    USDC: smartWalletUsdcBalance,
    USDT: smartWalletUsdtBalance,
    ETH: smartWalletEthBalance,
    WETH: smartWalletWethBalance,
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
          onToggleVault={() => {
            setShowVaultPanel((v) => !v);
            if (!showVaultPanel) {
              setShowHistoryPanel(false);
              setShowTownHallPanel(false);
            }
          }}
          showHistory={showHistoryPanel}
          onToggleHistory={() => {
            setShowHistoryPanel((v) => !v);
            if (!showHistoryPanel) {
              setShowVaultPanel(false);
              setShowTownHallPanel(false);
            }
          }}
          onLogout={logout}
        />

        {/* Middle: Side panels */}
        <div className="flex-1 relative">
          {/* Left: Town Hall Info Panel */}
          <TownHallInfoPanel
            visible={showTownHallPanel && hasSmartWallet}
            smartWallet={smartWallet ?? null}
            smartWalletEthBalance={smartWalletEthBalance}
            smartWalletUsdcBalance={smartWalletUsdcBalance}
            smartWalletUsdtBalance={smartWalletUsdtBalance}
            smartWalletWbtcBalance={smartWalletWbtcBalance}
            smartWalletLinkBalance={smartWalletLinkBalance}
            onClose={() => setShowTownHallPanel(false)}
          />

          {/* Left: Build Panel - for existing buildings only */}
          <BuildPanel
            visible={showBuildPanel && hasSmartWallet && !!selectedBuilding}
            selectedCoords={selectedCoords}
            selectedBuilding={selectedBuilding}
            smartWallet={smartWallet ?? null}
            hasSmartWallet={hasSmartWallet}
            userAddress={address}
            usedAssets={usedAssets}
            allBuildings={allBuildings}
            vaultBalances={vaultBalances}
            isBorrowDrag={false}
            onSuccess={() => {
              handleBuildSuccess();
            }}
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
            mpusdcBalance={mpusdcBalance}
            smartWallet={smartWallet ?? null}
            smartWalletEthBalance={smartWalletEthBalance}
            smartWalletWethBalance={smartWalletWethBalance}
            smartWalletUsdcBalance={smartWalletUsdcBalance}
            smartWalletUsdtBalance={smartWalletUsdtBalance}
            smartWalletWbtcBalance={smartWalletWbtcBalance}
            smartWalletLinkBalance={smartWalletLinkBalance}
            smartWalletMpusdcBalance={smartWalletMpusdcBalance}
            onDeposit={handleVaultDeposit}
            onWithdraw={handleVaultWithdraw}
            isDepositing={isDepositing || isConfirmingDeposit}
            isWithdrawing={isWithdrawingFromVault || isConfirmingWithdraw}
            onClose={() => setShowVaultPanel(false)}
            onSwap={handleSwap}
            onGetQuote={getQuote}
            swapLoading={swapLoading}
            swapError={swapError}
          />

          {/* Right: Transaction History Panel */}
          <TransactionHistoryPanel
            visible={showHistoryPanel && hasSmartWallet}
            userAddress={address}
            smartWalletAddress={smartWallet}
            onClose={() => setShowHistoryPanel(false)}
          />
        </div>

        {/* Bottom: Status bar */}
        <BottomBar
          selectedCoords={selectedCoords}
          buildingCount={buildings.filter((b) => b.type !== "townhall").length}
          onResetCamera={resetCamera}
          onZoomIn={zoomIn}
          onZoomOut={zoomOut}
          onDragBuildStart={handleDragBuildStart}
          isMoving={isMovingBuilding}
          isLoading={buildingsLoading}
        />
      </div>

      {/* Drag ghost that follows cursor */}
      {dragBuildType && dragPos && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: dragPos.x,
            top: dragPos.y,
            transform: 'translate(-50%, -50%)',
            fontFamily: '"Press Start 2P", monospace',
          }}
        >
          <div
            className={`px-3 py-1.5 text-[8px] border-2 rounded ${
              dragBuildType === 'supply'
                ? 'bg-emerald-700/90 border-emerald-400 text-emerald-200'
                : dragBuildType === 'borrow'
                ? 'bg-orange-700/90 border-orange-400 text-orange-200'
                : dragBuildType === 'lp'
                ? 'bg-cyan-700/90 border-cyan-400 text-cyan-200'
                : 'bg-amber-700/90 border-amber-400 text-amber-200'
            }`}
          >
            {dragBuildType === 'supply' ? 'SUPPLY' : dragBuildType === 'borrow' ? 'BORROW' : dragBuildType === 'lp' ? 'LP' : 'MEGAPOT'}
          </div>
        </div>
      )}

      {/* Building Dialog - shown when dropping SUPPLY/BORROW on map */}
      <BuildingDialog
        visible={showBuildDialog && hasSmartWallet}
        selectedCoords={selectedCoords}
        selectedBuilding={null}
        buildType={dialogBuildType === 'lp' ? 'lp' : dialogBuildType === 'borrow' ? 'borrow' : 'supply'}
        smartWallet={smartWallet ?? null}
        hasSmartWallet={hasSmartWallet}
        userAddress={address}
        usedAssets={usedAssets}
        allBuildings={allBuildings}
        vaultBalances={vaultBalances}
        isBorrowDrag={dialogBuildType === 'borrow'}
        onRefetchBalances={refetchBalances}
        onSuccess={() => {
          handleBuildSuccess();
          setShowBuildDialog(false);
          setDialogBuildType(null);
          setSelectedCoords(null);
        }}
        onClose={() => {
          setShowBuildDialog(false);
          setDialogBuildType(null);
          setSelectedCoords(null);
        }}
      />

      {/* Lottery Dialog - shown when dropping MEGAPOT on map */}
      <LotteryDialog
        visible={showLotteryDialog && hasSmartWallet}
        selectedCoords={selectedCoords}
        smartWallet={smartWallet ?? null}
        hasSmartWallet={hasSmartWallet}
        userAddress={address}
        onSuccess={() => {
          handleBuildSuccess();
          setShowLotteryDialog(false);
          setDialogBuildType(null);
          setSelectedCoords(null);
        }}
        onClose={() => {
          setShowLotteryDialog(false);
          setDialogBuildType(null);
          setSelectedCoords(null);
        }}
      />

      {/* Town Hall Modal - Full screen, above everything */}
      <TownHallModal
        visible={!smartWallet && !smartWalletLoading && authenticated}
        isCreating={isCreating}
        onCreateTownHall={handleCreateTownHall}
      />
    </div>
  );
}
