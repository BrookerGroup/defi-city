"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface BuildingType {
  id: string;
  name: string;
  emoji: string;
  description: string;
  cost: string;
}

const BUILDING_TYPES: BuildingType[] = [
  {
    id: "townhall",
    name: "Town Hall",
    emoji: "🏛️",
    description: "Start your city with a Town Hall",
    cost: "Free",
  },
  // Future building types can be added here
  // {
  //   id: "farm",
  //   name: "Farm",
  //   emoji: "🌾",
  //   description: "Generate yield from staking",
  //   cost: "100 USDC",
  // },
];

interface BuildingMenuProps {
  selectedBuildingId: string | null;
  onSelectBuilding: (buildingId: string) => void;
  disabled?: boolean;
  hasTownHall?: boolean;
}

export function BuildingMenu({
  selectedBuildingId,
  onSelectBuilding,
  disabled = false,
  hasTownHall = false,
}: BuildingMenuProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-bold mb-1">Buildings</h2>
        <p className="text-sm text-muted-foreground">
          Select a building to place on the map
        </p>
      </div>

      <div className="space-y-2">
        {BUILDING_TYPES.map((building) => {
          const isTownHall = building.id === "townhall";
          const isDisabled = disabled || (isTownHall && hasTownHall);

          return (
            <Card
              key={building.id}
              className={cn(
                "p-4 transition-all",
                selectedBuildingId === building.id
                  ? "border-2 border-primary bg-primary/5"
                  : "border",
                isDisabled
                  ? "opacity-50 cursor-not-allowed"
                  : "cursor-pointer hover:shadow-md"
              )}
              onClick={() => !isDisabled && onSelectBuilding(building.id)}
            >
              <div className="flex items-start gap-3">
                <div className="text-3xl">{building.emoji}</div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-semibold">{building.name}</h3>
                    <Badge variant="secondary" className="text-xs">
                      {building.cost}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {isTownHall && hasTownHall
                      ? "Already built"
                      : building.description}
                  </p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {selectedBuildingId && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-900">
            💡 Click any empty cell on the map to place your building
          </p>
        </div>
      )}
    </div>
  );
}
