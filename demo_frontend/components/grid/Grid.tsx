"use client";

import { Building } from "@/types";
import { GridCell } from "./GridCell";
import { useMemo } from "react";

interface GridProps {
  buildings: Building[];
  onCellClick: (x: number, y: number) => void;
  onBuildingClick?: (building: Building) => void;
  disabled?: boolean;
}

export function Grid({ buildings, onCellClick, onBuildingClick, disabled }: GridProps) {
  const GRID_SIZE = 10;

  console.log("[Grid] Received buildings:", buildings, "count:", buildings.length);

  // Create a map of (x,y) -> building for fast lookup
  const buildingMap = useMemo(() => {
    const map = new Map<string, Building>();
    buildings.forEach((building) => {
      const key = `${Number(building.coordinateX)},${Number(building.coordinateY)}`;
      console.log("[Grid] Mapping building at:", key, building);
      map.set(key, building);
    });
    console.log("[Grid] BuildingMap size:", map.size);
    return map;
  }, [buildings]);

  const cells = useMemo(() => {
    const result = [];
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const key = `${x},${y}`;
        const building = buildingMap.get(key);
        result.push({ x, y, building });
      }
    }
    return result;
  }, [buildingMap]);

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))`,
        }}
      >
        {cells.map(({ x, y, building }) => (
          <GridCell
            key={`${x}-${y}`}
            x={x}
            y={y}
            building={building}
            onClick={() => onCellClick(x, y)}
            onBuildingClick={onBuildingClick}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  );
}
