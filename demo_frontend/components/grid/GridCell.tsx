"use client";

import { Building } from "@/types";
import { cn } from "@/lib/utils";

interface GridCellProps {
  x: number;
  y: number;
  building?: Building;
  onClick: () => void;
  onBuildingClick?: (building: Building) => void;
  disabled?: boolean;
}

const BUILDING_EMOJIS: Record<string, string> = {
  TownHall: "🏛️",
  townhall: "🏛️",
  Farm: "🌾",
  farm: "🌾",
  // Add more building types here
};

export function GridCell({ x, y, building, onClick, onBuildingClick, disabled }: GridCellProps) {
  const isEmpty = !building;

  // Get emoji for building type
  const buildingEmoji = building
    ? BUILDING_EMOJIS[building.buildingType] || "🏗️"
    : null;

  console.log("[GridCell]", x, y, "building:", building?.buildingType, "emoji:", buildingEmoji);

  const handleClick = () => {
    if (building && onBuildingClick) {
      onBuildingClick(building);
    } else if (isEmpty) {
      onClick();
    }
  };

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        "aspect-square w-full relative transition-all duration-200",
        "flex flex-col items-center justify-center",
        isEmpty && "border-2 border-dashed border-border hover:border-primary hover:bg-accent cursor-pointer",
        building && "bg-card border-2 border-border cursor-pointer hover:shadow-lg hover:scale-105",
        disabled && isEmpty && "opacity-50 cursor-not-allowed"
      )}
    >
      {building ? (
        <div className="flex flex-col items-center justify-center gap-1 p-2">
          <div className="text-3xl">{buildingEmoji}</div>
          <div className="text-xs font-medium text-center line-clamp-1">
            {building.buildingType}
          </div>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">
          {x},{y}
        </div>
      )}
    </button>
  );
}
