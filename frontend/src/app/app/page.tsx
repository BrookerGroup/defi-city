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
import { AavePanel } from "@/components/aave";
import { CityGrid } from "@/components/game/CityGrid";

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

  // Auto-trigger wallet connection when authenticated but no address
  useEffect(() => {
    if (authenticated && !address) {
      const triggerWallet = async () => {
        try {
          const ethereum = (window as any).ethereum;
          if (ethereum) {
            await ethereum.request({ method: "eth_requestAccounts" });
          }
        } catch (err) {
          setWaitingTooLong(true);
        }
      };
      triggerWallet();
    } else {
      setWaitingTooLong(false);
    }
  }, [authenticated, address]);

  // Smart Account
  const {
    smartWallet,
    loading: smartWalletLoading,
    hasSmartWallet,
    isError,
    error,
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
  const [showBuildModal, setShowBuildModal] = useState(false);

  // Compute used assets (assets that already have buildings) and selected building
  const usedAssets = useMemo(
    () => buildings.filter((b) => b.type !== "townhall").map((b) => b.asset),
    [buildings],
  );

  const selectedBuilding = useMemo(() => {
    if (!selectedCoords) return null;
    // Only match active buildings - demolished buildings (active=false) should be treated
    // as empty tiles so a new building can be created via recordBuildingPlacement
    const found =
      allBuildings.find(
        (b) => b.x === selectedCoords.x && b.y === selectedCoords.y && b.active,
      ) || null;
    console.log(
      `[App] Selected building at ${selectedCoords.x},${selectedCoords.y}:`,
      found,
    );
    return found;
  }, [selectedCoords, allBuildings]);

  useEffect(() => {
    console.log(
      `[App] Current buildings in state: ${buildings.length}`,
      buildings,
    );
  }, [buildings]);

  // UI State
  const [activeVaultTab, setActiveVaultTab] = useState<"deposit" | "withdraw">(
    "deposit",
  );

  // Deposit form state
  const [selectedToken, setSelectedToken] = useState<TokenType>("ETH");
  const [depositAmount, setDepositAmount] = useState("");
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositSuccess, setDepositSuccess] = useState(false);

  // Withdraw form state
  const [withdrawToken, setWithdrawToken] = useState<TokenType>("ETH");
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawError, setWithdrawError] = useState<string | null>(null);
  const [withdrawSuccess, setWithdrawSuccess] = useState(false);

  // Check for insufficient balance for deposit
  const currentTokenBalance = useMemo(() => {
    switch (selectedToken) {
      case 'ETH': return parseFloat(ethBalance);
      case 'USDC': return parseFloat(usdcBalance);
      case 'USDT': return parseFloat(usdtBalance);
      case 'WBTC': return parseFloat(wbtcBalance);
      case 'LINK': return parseFloat(linkBalance);
      default: return 0;
    }
  }, [selectedToken, ethBalance, usdcBalance, usdtBalance, wbtcBalance, linkBalance]);

  const hasInsufficientDepositBalance = useMemo(() => {
    const amount = parseFloat(depositAmount);
    return !isNaN(amount) && amount > 0 && amount > currentTokenBalance;
  }, [depositAmount, currentTokenBalance]);

  // Check for insufficient balance for withdraw
  const currentVaultBalance = useMemo(() => {
    switch (withdrawToken) {
      case 'ETH': return parseFloat(smartWalletEthBalance);
      case 'USDC': return parseFloat(smartWalletUsdcBalance);
      case 'USDT': return parseFloat(smartWalletUsdtBalance);
      case 'WBTC': return parseFloat(smartWalletWbtcBalance);
      case 'LINK': return parseFloat(smartWalletLinkBalance);
      default: return 0;
    }
  }, [withdrawToken, smartWalletEthBalance, smartWalletUsdcBalance, smartWalletUsdtBalance, smartWalletWbtcBalance, smartWalletLinkBalance]);

  const hasInsufficientWithdrawBalance = useMemo(() => {
    const amount = parseFloat(withdrawAmount);
    return !isNaN(amount) && amount > 0 && amount > currentVaultBalance;
  }, [withdrawAmount, currentVaultBalance]);

  const handleCreateTownHall = async () => {
    if (!address) return;
    const result = await createSmartAccount();
    if (result.success) {
      refetch();
    }
  };

  const handleDeposit = async () => {
    if (!depositAmount || parseFloat(depositAmount) <= 0) {
      setDepositError("Please enter a valid amount");
      return;
    }
    setDepositError(null);
    setDepositSuccess(false);
    const result = await vaultDeposit(selectedToken, depositAmount);
    if (result.success) {
      setDepositSuccess(true);
      setDepositAmount("");
      refreshBuildings();
    } else {
      setDepositError(result.error || "Deposit failed");
    }
  };

  const handleWithdrawFromVault = async () => {
    if (!withdrawAmount || parseFloat(withdrawAmount) <= 0) {
      setWithdrawError("Please enter a valid amount");
      return;
    }
    setWithdrawError(null);
    setWithdrawSuccess(false);
    const result = await vaultWithdraw(withdrawToken, withdrawAmount);
    if (result.success) {
      setWithdrawSuccess(true);
      setWithdrawAmount("");
      refreshBuildings();
    } else {
      setWithdrawError(result.error || "Withdrawal failed");
    }
  };

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

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900">
      {/* Mandatory Town Hall Creation Modal */}
      {!smartWallet && !smartWalletLoading && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/95 backdrop-blur-sm">
          {/* Animated background sparkles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {[...Array(20)].map((_, i) => (
              <div
                key={i}
                className="absolute w-2 h-2 bg-amber-400/60 rounded-full animate-ping"
                style={{
                  left: `${10 + Math.random() * 80}%`,
                  top: `${10 + Math.random() * 80}%`,
                  animationDelay: `${Math.random() * 3}s`,
                  animationDuration: `${2 + Math.random() * 2}s`,
                }}
              />
            ))}
          </div>

          {/* Modal Content */}
          <div className="relative max-w-lg mx-4">
            {/* Shadow */}
            <div className="absolute inset-0 bg-amber-900 translate-x-4 translate-y-4" />

            {/* Main Card */}
            <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 border-4 border-amber-500 p-8">
              {/* Top Banner */}
              <div className="absolute -top-6 left-1/2 -translate-x-1/2 px-6 py-2 bg-amber-600 border-4 border-amber-400">
                <p
                  className="text-white text-[10px]"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  ⚠️ REQUIRED ⚠️
                </p>
              </div>

              {/* Building Icon */}
              <div className="flex justify-center mb-6 mt-4">
                <div className="relative">
                  <div
                    className="text-8xl animate-bounce"
                    style={{ animationDuration: "2s" }}
                  >
                    🏛️
                  </div>
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-amber-400/30 blur-2xl animate-pulse" />
                </div>
              </div>

              {/* Title */}
              <h2
                className="text-center text-amber-400 text-xl mb-4"
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  textShadow: "3px 3px 0px #92400E",
                }}
              >
                BUILD YOUR
                <br />
                TOWN HALL
              </h2>

              {/* Description */}
              <p
                className="text-center text-slate-400 text-xs leading-relaxed mb-6"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                Every great city starts with a Town Hall! This creates your
                Smart Wallet vault to manage assets.
              </p>

              {/* Benefits List */}
              <div className="bg-slate-900/80 border-2 border-slate-700 p-4 mb-6">
                <p
                  className="text-slate-500 text-[8px] mb-3"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  UNLOCKS:
                </p>
                <div className="space-y-2">
                  {[
                    "🏦 AAVE Bank Building",
                    "💰 Deposit & Withdraw",
                    "🎮 City Management",
                    "📈 DeFi Strategies",
                  ].map((item, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 text-[10px] text-green-400"
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      <span className="text-green-500">✓</span> {item}
                    </div>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleCreateTownHall}
                disabled={isCreating}
                className="relative w-full group"
              >
                <div className="absolute inset-0 bg-green-900 translate-x-2 translate-y-2 transition-transform group-hover:translate-x-1 group-hover:translate-y-1" />
                <div
                  className={`relative px-6 py-4 border-4 transition-all ${
                    isCreating
                      ? "bg-slate-700 border-slate-600"
                      : "bg-green-600 border-green-400 group-hover:-translate-y-1 group-hover:shadow-lg group-hover:shadow-green-500/30"
                  }`}
                >
                  <p
                    className="text-white text-sm"
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    {isCreating ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="animate-spin">⚙️</span> BUILDING...
                      </span>
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        🔨 CREATE TOWN HALL
                      </span>
                    )}
                  </p>
                </div>
              </button>

              {/* Cost Info */}
              <p
                className="text-center text-slate-600 text-[8px] mt-4"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                * ONE-TIME GAS FEE REQUIRED
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Build Modal - Shows Aave Bank when clicking tile */}
      {showBuildModal && selectedCoords && hasSmartWallet && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-900/90 backdrop-blur-sm">
          <div className="relative max-w-2xl w-full mx-4">
            {/* Close Button */}
            <button
              onClick={() => setShowBuildModal(false)}
              className="absolute -top-4 -right-4 z-10 w-10 h-10 bg-red-600 border-4 border-red-400 text-white flex items-center justify-center hover:bg-red-500 transition-colors"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              ✕
            </button>

            {/* Shadow */}
            <div className="absolute inset-0 bg-emerald-900 translate-x-4 translate-y-4" />

            {/* Main Card */}
            <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 border-4 border-emerald-500 p-6">
              {/* Header */}
              <div className="text-center mb-6">
                <p
                  className="text-emerald-400 text-[10px] mb-2"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {selectedBuilding
                    ? `📍 ${selectedBuilding.asset} BANK (${selectedCoords.x}, ${selectedCoords.y})`
                    : `📍 BUILDING AT (${selectedCoords.x}, ${selectedCoords.y})`}
                </p>
                <h2
                  className="text-white text-lg"
                  style={{
                    fontFamily: '"Press Start 2P", monospace',
                    textShadow: "2px 2px 0px #065f46",
                  }}
                >
                  🏦 AAVE BANK
                </h2>
                <p
                  className="text-slate-400 text-[8px] mt-2"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {selectedBuilding
                    ? `Supply more ${selectedBuilding.asset} to upgrade!`
                    : "Supply assets to build your bank!"}
                </p>
              </div>

              {/* Aave Panel */}
              <AavePanel
                smartWallet={smartWallet ?? null}
                hasSmartWallet={hasSmartWallet}
                userAddress={address}
                onSuccess={() => {
                  refetchBalances();
                  refreshBuildings();
                  // Second refresh after 3 seconds to ensure on-chain state is synced
                  setTimeout(() => {
                    console.log("[App] Performing delayed building refresh...");
                    refreshBuildings();
                  }, 3000);
                  setShowBuildModal(false);
                  setSelectedCoords(null);
                }}
                selectedCoords={selectedCoords}
                usedAssets={usedAssets}
                existingAsset={selectedBuilding?.asset}
                buildingId={selectedBuilding?.id}
                allBuildings={allBuildings}
                vaultBalances={{
                  USDC: smartWalletUsdcBalance,
                  USDT: smartWalletUsdtBalance,
                  ETH: smartWalletEthBalance,
                  WBTC: smartWalletWbtcBalance,
                  LINK: smartWalletLinkBalance,
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Top Bar with Wallet & Balance Data */}
      <header className="border-b-4 border-slate-700 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3">
          {/* Top row: Logo and Exit */}
          <div className="flex items-center justify-between mb-3">
            <h1
              className="text-amber-400 text-lg"
              style={{
                fontFamily: '"Press Start 2P", monospace',
                textShadow: "2px 2px 0px #92400E",
              }}
            >
              DEFICITY
            </h1>
            <button onClick={logout} className="relative group">
              <div className="absolute inset-0 bg-red-900 translate-x-1 translate-y-1" />
              <div
                className="relative px-4 py-2 bg-red-600 border-2 border-red-400 text-white text-xs transition-transform group-hover:-translate-y-0.5"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                EXIT
              </div>
            </button>
          </div>

          {/* Second row: Wallet & Vault Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Wallet Address */}
            <div className="bg-slate-800/60 border border-slate-700 px-3 py-2">
              <p
                className="text-slate-500 text-[6px] mb-1"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                WALLET
              </p>
              <p className="text-cyan-400 text-[8px] truncate">{address}</p>
            </div>

            {/* Wallet Balances */}
            <div className="bg-slate-800/60 border border-slate-700 px-3 py-2">
              <p
                className="text-slate-500 text-[6px] mb-1"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                WALLET BAL
              </p>
              <div
                className="flex flex-wrap gap-2 text-[8px]"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                <span className="text-green-400">
                  ETH: {parseFloat(ethBalance).toFixed(4)}
                </span>
                <span className="text-green-400">
                  USDC: {parseFloat(usdcBalance).toFixed(2)}
                </span>
                <span className="text-green-400">
                  USDT: {parseFloat(usdtBalance).toFixed(2)}
                </span>
                <span className="text-green-400">
                  WBTC: {parseFloat(wbtcBalance).toFixed(6)}
                </span>
                <span className="text-green-400">
                  LINK: {parseFloat(linkBalance).toFixed(2)}
                </span>
              </div>
            </div>

            {/* Vault Address */}
            <div className="bg-slate-800/60 border border-amber-700/50 px-3 py-2">
              <p
                className="text-slate-500 text-[6px] mb-1"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                VAULT
              </p>
              {hasSmartWallet && smartWallet ? (
                <p className="text-amber-400 text-[8px] truncate">
                  {smartWallet}
                </p>
              ) : (
                <button
                  onClick={handleCreateTownHall}
                  disabled={isCreating}
                  className="text-amber-400 text-[8px] hover:text-amber-300"
                  style={{ fontFamily: '"Press Start 2P", monospace' }}
                >
                  {isCreating ? "BUILDING..." : "CREATE VAULT →"}
                </button>
              )}
            </div>

            {/* Vault Balances */}
            <div className="bg-slate-800/60 border border-amber-700/50 px-3 py-2">
              <p
                className="text-slate-500 text-[6px] mb-1"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                VAULT BAL
              </p>
              <div
                className="flex flex-wrap gap-2 text-[8px]"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                <span className="text-amber-400">
                  ETH: {parseFloat(smartWalletEthBalance).toFixed(4)}
                </span>
                <span className="text-amber-400">
                  USDC: {parseFloat(smartWalletUsdcBalance).toFixed(2)}
                </span>
                <span className="text-amber-400">
                  USDT: {parseFloat(smartWalletUsdtBalance).toFixed(2)}
                </span>
                <span className="text-amber-400">
                  WBTC: {parseFloat(smartWalletWbtcBalance).toFixed(6)}
                </span>
                <span className="text-amber-400">
                  LINK: {parseFloat(smartWalletLinkBalance).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* City Map - Full Width */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2
              className="text-amber-400 text-sm"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              CITY MAP
            </h2>
            <div
              className="flex gap-4 text-[6px]"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-slate-700 border border-slate-600" />
                <span className="text-slate-500">EMPTY</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500/30 border border-blue-400" />
                <span className="text-blue-400">SELECTED</span>
              </div>
            </div>
          </div>
          <CityGrid
            buildings={buildings}
            selectedCoords={selectedCoords}
            onSelectTile={(x, y) => {
              // Skip Town Hall tile
              const clickedBuilding = buildings.find(
                (b) => b.x === x && b.y === y,
              );
              if (clickedBuilding?.type === "townhall") return;
              setSelectedCoords({ x, y });
              setShowBuildModal(true);
            }}
            isLoading={buildingsLoading}
            onMoveBuilding={handleMoveBuilding}
            isMoving={isMovingBuilding}
          />
          <div className="mt-4 p-4 bg-slate-900/50 border-2 border-slate-800 text-center">
            <p
              className="text-slate-400 text-[8px] leading-relaxed"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              {selectedCoords ? (
                <span className="text-blue-400">
                  📍 SELECTED: ({selectedCoords.x}, {selectedCoords.y}) - CLICK
                  TILE TO BUILD
                </span>
              ) : (
                "🏗️ CLICK TILE TO BUILD | DRAG BUILDING TO MOVE"
              )}
            </p>
          </div>
        </div>

        {/* Vault Management */}
        <div className="max-w-xl mx-auto">
          {/* Vault Management */}
          {hasSmartWallet && (
            <div className="relative">
              <div
                className={`absolute inset-0 ${activeVaultTab === "deposit" ? "bg-blue-900" : "bg-purple-900"} translate-x-2 translate-y-2`}
              />
              <div
                className={`relative bg-slate-800 border-4 p-6 h-full flex flex-col ${activeVaultTab === "deposit" ? "border-blue-500" : "border-purple-500"}`}
              >
                <div className="flex justify-between mb-6">
                  <h3
                    className={`text-sm ${activeVaultTab === "deposit" ? "text-blue-400" : "text-purple-400"}`}
                    style={{ fontFamily: '"Press Start 2P", monospace' }}
                  >
                    VAULT MGMT
                  </h3>
                  <div className="flex bg-slate-900 p-1 border-2 border-slate-700">
                    <button
                      onClick={() => setActiveVaultTab("deposit")}
                      className={`px-2 py-1 text-[8px] ${activeVaultTab === "deposit" ? "bg-blue-600 text-white" : "text-slate-500"}`}
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      DEPOSIT
                    </button>
                    <button
                      onClick={() => setActiveVaultTab("withdraw")}
                      className={`px-2 py-1 text-[8px] ${activeVaultTab === "withdraw" ? "bg-purple-600 text-white" : "text-slate-500"}`}
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      WITHDRAW
                    </button>
                  </div>
                </div>
                {activeVaultTab === "deposit" ? (
                  <div className="space-y-4">
                    {/* EOA Balance Display */}
                    <div className="bg-slate-900/50 border border-slate-700 p-4">
                      <p
                        className="text-slate-500 text-[8px] mb-1"
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                      >
                        YOUR WALLET (EOA)
                      </p>
                      <p
                        className="text-cyan-400 text-[7px] mb-3 truncate"
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                      >
                        {address}
                      </p>
                      <div
                        className="flex flex-wrap gap-1 text-[7px]"
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                      >
                        <span className="text-green-400">
                          ETH: {parseFloat(ethBalance).toFixed(4)}
                        </span>
                        <span className="text-green-400">
                          USDC: {parseFloat(usdcBalance).toFixed(2)}
                        </span>
                        <span className="text-green-400">
                          USDT: {parseFloat(usdtBalance).toFixed(2)}
                        </span>
                        <span className="text-green-400">
                          WBTC: {parseFloat(wbtcBalance).toFixed(6)}
                        </span>
                        <span className="text-green-400">
                          LINK: {parseFloat(linkBalance).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {["ETH", "USDC", "USDT", "WBTC", "LINK"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setSelectedToken(t as any)}
                          className={`flex-1 min-w-[50px] py-2 border-2 text-[7px] ${selectedToken === t ? "bg-blue-600 text-white border-blue-400" : "bg-slate-900 text-slate-400 border-slate-700"}`}
                          style={{ fontFamily: '"Press Start 2P", monospace' }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      className={`w-full bg-slate-900 border-2 p-3 text-white text-xs ${hasInsufficientDepositBalance ? 'border-red-500' : 'border-slate-700'}`}
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    />
                    
                    {hasInsufficientDepositBalance && (
                      <p className="text-red-500 text-[8px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                        ⚠️ INSUFFICIENT {selectedToken} BALANCE
                      </p>
                    )}

                    <button
                      onClick={handleDeposit}
                      disabled={isDepositing || isConfirmingDeposit || hasInsufficientDepositBalance}
                      className={`w-full py-4 border-4 text-white text-xs ${hasInsufficientDepositBalance ? 'bg-slate-700 border-slate-600' : 'bg-blue-600 border-blue-400'}`}
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      {hasInsufficientDepositBalance ? `INSUFFICIENT ${selectedToken}` : 'DEPOSIT TO VAULT'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Smart Wallet Balance Display */}
                    <div className="bg-slate-900/50 border border-slate-700 p-4">
                      <p
                        className="text-slate-500 text-[8px] mb-1"
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                      >
                        VAULT (SMART WALLET)
                      </p>
                      <p
                        className="text-amber-400 text-[7px] mb-3 truncate"
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                      >
                        {smartWallet}
                      </p>
                      <div
                        className="flex flex-wrap gap-1 text-[7px]"
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                      >
                        <span className="text-purple-400">
                          ETH: {parseFloat(smartWalletEthBalance).toFixed(4)}
                        </span>
                        <span className="text-purple-400">
                          USDC: {parseFloat(smartWalletUsdcBalance).toFixed(2)}
                        </span>
                        <span className="text-purple-400">
                          USDT: {parseFloat(smartWalletUsdtBalance).toFixed(2)}
                        </span>
                        <span className="text-purple-400">
                          WBTC: {parseFloat(smartWalletWbtcBalance).toFixed(6)}
                        </span>
                        <span className="text-purple-400">
                          LINK: {parseFloat(smartWalletLinkBalance).toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {["ETH", "USDC", "USDT", "WBTC", "LINK"].map((t) => (
                        <button
                          key={t}
                          onClick={() => setWithdrawToken(t as any)}
                          className={`flex-1 min-w-[50px] py-2 border-2 text-[7px] ${withdrawToken === t ? "bg-purple-600 text-white border-purple-400" : "bg-slate-900 text-slate-400 border-slate-700"}`}
                          style={{ fontFamily: '"Press Start 2P", monospace' }}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                    <input
                      type="number"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      placeholder="0.00"
                      className={`w-full bg-slate-900 border-2 p-3 text-white text-xs ${hasInsufficientWithdrawBalance ? 'border-red-500' : 'border-slate-700'}`}
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    />

                    {hasInsufficientWithdrawBalance && (
                      <p className="text-red-500 text-[8px]" style={{ fontFamily: '"Press Start 2P", monospace' }}>
                        ⚠️ INSUFFICIENT {withdrawToken} IN VAULT
                      </p>
                    )}

                    <button
                      onClick={handleWithdrawFromVault}
                      disabled={isWithdrawingFromVault || isConfirmingWithdraw || hasInsufficientWithdrawBalance}
                      className={`w-full py-4 border-4 text-white text-xs ${hasInsufficientWithdrawBalance ? 'bg-slate-700 border-slate-600' : 'bg-purple-600 border-purple-400'}`}
                      style={{ fontFamily: '"Press Start 2P", monospace' }}
                    >
                      {hasInsufficientWithdrawBalance ? `NOT ENOUGH ${withdrawToken}` : 'WITHDRAW TO WALLET'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="mt-8 grid grid-cols-3 gap-4 max-w-6xl mx-auto">
          {["LEVEL", "COINS", "LAND"].map((l) => (
            <div
              key={l}
              className="bg-slate-800 border-2 border-slate-700 p-4 text-center"
            >
              <p
                className="text-slate-500 text-[8px] mb-1"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                {l}
              </p>
              <p
                className="text-amber-400 text-sm"
                style={{ fontFamily: '"Press Start 2P", monospace' }}
              >
                {l === "LEVEL" ? "01" : "0"}
              </p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
