"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { usePrivy } from "@privy-io/react-auth";
import { Loader2 } from "lucide-react";

interface PlaceBuildingModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  x: number | null;
  y: number | null;
  buildingType: string | null;
  onPlaceBuilding: () => void;
  isLoading: boolean;
}

const BUILDING_INFO: Record<string, { emoji: string; name: string; description: string }> = {
  townhall: {
    emoji: "🏛️",
    name: "Town Hall",
    description: "Your city's central building",
  },
  // Future building types
  // farm: {
  //   emoji: "🌾",
  //   name: "Farm",
  //   description: "Generate yield from staking",
  // },
};

export function PlaceBuildingModal({
  open,
  onOpenChange,
  x,
  y,
  buildingType,
  onPlaceBuilding,
  isLoading,
}: PlaceBuildingModalProps) {
  const { authenticated, login } = usePrivy();

  const building = buildingType ? BUILDING_INFO[buildingType] : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Place Building</DialogTitle>
          <DialogDescription>
            {building ? (
              <>Place {building.name} at position ({x}, {y})</>
            ) : (
              <>Confirm building placement</>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4 py-6">
          <div className="text-6xl">{building?.emoji || "🏗️"}</div>
          <div className="text-center">
            <h3 className="font-semibold text-lg">{building?.name || "Building"}</h3>
            <p className="text-sm text-muted-foreground">
              {building?.description || "Place this building on your map"}
            </p>
          </div>
        </div>

        <DialogFooter>
          {!authenticated ? (
            <Button onClick={login} className="w-full">
              Connect Wallet to Continue
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button onClick={onPlaceBuilding} disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Placing...
                  </>
                ) : (
                  <>Place {building?.name || "Building"}</>
                )}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
