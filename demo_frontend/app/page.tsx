"use client";

import { useState, useEffect } from "react";
import { usePrivy, useWallets } from "@privy-io/react-auth";
import { WalletConnect } from "@/components/wallet/WalletConnect";
import { Grid } from "@/components/grid/Grid";
import { PlaceBuildingModal } from "@/components/modals/PlaceBuildingModal";
import { TownHallModal } from "@/components/modals/TownHallModal";
import { PortfolioPanel } from "@/components/portfolio/PortfolioPanel";
import { BuildingMenu } from "@/components/building/BuildingMenu";
import { Drawer } from "@/components/ui/drawer";
import { useDefiCity } from "@/hooks/useDefiCity";
import { toast } from "sonner";
import { Building } from "@/types";

export default function Home() {
  const { authenticated, user } = usePrivy();
  const { wallets, ready } = useWallets();

  console.log("[Page] authenticated:", authenticated);
  console.log("[Page] ready:", ready);
  console.log("[Page] user:", user);
  console.log("[Page] wallets:", wallets);
  console.log("[Page] wallets.length:", wallets.length);

  // Log each wallet's details
  wallets.forEach((w, i) => {
    console.log(`[Page] wallet[${i}]:`, {
      walletClientType: w.walletClientType,
      connectorType: w.connectorType,
      address: w.address,
      chainId: w.chainId?.toString(),
    });
  });

  // Get address - try multiple strategies
  let address: string | undefined;

  // Strategy 1: Try to get from ready wallets
  if (ready && wallets.length > 0) {
    address = wallets[0].address;
    console.log("[Page] Using wallets[0].address:", address);
  }

  // Strategy 2: Try user.wallet if available
  if (!address && user?.wallet) {
    address = user.wallet.address;
    console.log("[Page] Using user.wallet.address:", address);
  }

  console.log("[Page] Final address:", address);

  const {
    buildings,
    stats,
    hasWallet,
    createTownHall,
    isPending,
    isConfirmed,
    refetchBuildings,
  } = useDefiCity(address);

  console.log("[Page] Render - address:", address, "hasWallet:", hasWallet, "buildings.length:", buildings.length);

  const [modalOpen, setModalOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [townHallModalOpen, setTownHallModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [selectedBuildingType, setSelectedBuildingType] = useState<string | null>(null);

  // Check if Town Hall already exists
  const hasTownHall = buildings.some(
    (b) => b.buildingType.toLowerCase() === "townhall" || b.buildingType.toLowerCase() === "town hall"
  );

  console.log("[Page] Has Town Hall:", hasTownHall);

  // Handle cell click - open drawer to select building
  const handleCellClick = (x: number, y: number) => {
    if (!authenticated) {
      toast.error("Please connect your wallet first");
      return;
    }
    setSelectedCell({ x, y });
    setDrawerOpen(true);
  };

  // Handle building selection from drawer
  const handleBuildingSelect = (buildingId: string) => {
    setSelectedBuildingType(buildingId);
    setDrawerOpen(false);
    // Open modal to confirm placement
    setModalOpen(true);
  };

  // Handle building click (for existing buildings)
  const handleBuildingClick = (building: Building) => {
    console.log("[Page] Building clicked:", building);
    setSelectedBuilding(building);
    setTownHallModalOpen(true);
  };

  // Handle place building
  const handlePlaceBuilding = async () => {
    if (!selectedCell) return;

    try {
      await createTownHall(selectedCell.x, selectedCell.y);
      toast.success("Transaction submitted! Placing Town Hall...");
    } catch (error: any) {
      console.error(error);
      toast.error(error?.message || "Failed to place Town Hall");
    }
  };

  // Refetch on confirmation
  useEffect(() => {
    console.log("[Page] isConfirmed changed:", isConfirmed);
    if (isConfirmed) {
      console.log("[Page] Transaction confirmed! Refetching buildings...");
      toast.success("Town Hall placed successfully!");
      setModalOpen(false);
      refetchBuildings().then((result) => {
        console.log("[Page] Refetch result:", result);
      });
    }
  }, [isConfirmed, refetchBuildings]);

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">DeFi City</h1>
            <p className="text-sm text-muted-foreground">
              Build your DeFi portfolio
            </p>
          </div>
          <WalletConnect />
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto py-8 space-y-6">
        {/* Portfolio Stats */}
        <PortfolioPanel stats={stats} buildingCount={buildings.length} />

        {/* Empty State or Main Content */}
        {!authenticated ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="text-6xl mb-4">🏙️</div>
            <h2 className="text-2xl font-bold mb-2">Welcome to DeFi City</h2>
            <p className="text-muted-foreground mb-6 text-center max-w-md">
              Connect your wallet to start building your gamified DeFi portfolio
            </p>
          </div>
        ) : (
          <div className="flex justify-center">
            {/* Map Grid */}
            <Grid
              buildings={buildings}
              onCellClick={handleCellClick}
              onBuildingClick={handleBuildingClick}
              disabled={isPending}
            />
          </div>
        )}
      </div>

      {/* Building Selection Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <BuildingMenu
          selectedBuildingId={selectedBuildingType}
          onSelectBuilding={handleBuildingSelect}
          disabled={isPending}
          hasTownHall={hasTownHall}
          cellPosition={selectedCell}
        />
      </Drawer>

      {/* Place Building Modal */}
      <PlaceBuildingModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        x={selectedCell?.x ?? null}
        y={selectedCell?.y ?? null}
        buildingType={selectedBuildingType}
        onPlaceBuilding={handlePlaceBuilding}
        isLoading={isPending}
      />

      {/* Town Hall Management Modal */}
      <TownHallModal
        open={townHallModalOpen}
        onOpenChange={setTownHallModalOpen}
        building={selectedBuilding}
      />
    </main>
  );
}
