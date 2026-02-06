"use client";

/**
 * BottomBar - Status bar at the bottom of the game
 * Shows: Selected coordinates | SUPPLY/BORROW buttons | Camera controls
 */

export type DragBuildType = "supply" | "borrow" | "lp" | "lottery" | "megapot-lp";

interface BottomBarProps {
  selectedCoords: { x: number; y: number } | null;
  buildingCount: number;
  onResetCamera: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onDragBuildStart: (type: DragBuildType) => void;
  isMoving?: boolean;
  isLoading?: boolean;
  hasLotteryBuilding?: boolean;
}

function MegapotLPIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 12 12"
      style={{ imageRendering: "pixelated" as const }}
    >
      {/* Droplet (liquidity) */}
      <rect x="5" y="0" width="2" height="1" fill="#C084FC" />
      <rect x="4" y="1" width="4" height="2" fill="#A855F7" />
      <rect x="5" y="3" width="2" height="1" fill="#A855F7" />
      {/* Down arrow */}
      <rect x="5" y="4" width="2" height="1" fill="#7C3AED" />
      {/* Pool surface (waves) */}
      <rect x="1" y="6" width="2" height="1" fill="#7C3AED" />
      <rect x="5" y="6" width="2" height="1" fill="#7C3AED" />
      <rect x="9" y="6" width="2" height="1" fill="#7C3AED" />
      {/* Pool body */}
      <rect x="0" y="7" width="12" height="3" fill="#6D28D9" />
      {/* Coins in pool */}
      <rect x="2" y="8" width="2" height="1" fill="#FCD34D" />
      <rect x="8" y="8" width="2" height="1" fill="#FCD34D" />
      {/* Pool base */}
      <rect x="1" y="10" width="10" height="2" fill="#5B21B6" />
    </svg>
  );
}

const pixelFont = { fontFamily: '"Press Start 2P", monospace' } as const;

export function BottomBar({
  selectedCoords,
  buildingCount,
  onResetCamera,
  onZoomIn,
  onZoomOut,
  onDragBuildStart,
  isMoving,
  isLoading,
  hasLotteryBuilding,
}: BottomBarProps) {
  return (
    <div
      className="pointer-events-auto flex items-center justify-between px-4 py-1.5 bg-slate-900/85 backdrop-blur-sm border-t-2 border-slate-700/80 text-[7px]"
      style={pixelFont}
    >
      {/* Left: Status */}
      <div className="flex items-center gap-4">
        {isMoving ? (
          <span className="text-orange-400 animate-pulse">
            MOVING BUILDING...
          </span>
        ) : isLoading ? (
          <span className="text-amber-400 animate-pulse">SYNCING...</span>
        ) : selectedCoords ? (
          <span className="text-blue-400">
            SELECTED: ({selectedCoords.x}, {selectedCoords.y})
          </span>
        ) : (
          <span className="text-slate-500">
            DRAG TO BUILD | CLICK BUILDING TO MANAGE
          </span>
        )}
      </div>

      {/* Center: Drag-to-build buttons + Stats */}
      <div className="flex items-center gap-3">
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            onDragBuildStart("supply");
          }}
          className="px-3 py-1 bg-emerald-700 border-2 border-emerald-400 text-emerald-200 flex items-center gap-1.5 hover:bg-emerald-600 transition-colors cursor-grab active:cursor-grabbing select-none"
        >
          <span className="text-[8px]">+</span> SUPPLY
        </button>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            onDragBuildStart("borrow");
          }}
          className="px-3 py-1 bg-orange-700 border-2 border-orange-400 text-orange-200 flex items-center gap-1.5 hover:bg-orange-600 transition-colors cursor-grab active:cursor-grabbing select-none"
        >
          <span className="text-[8px]">+</span> BORROW
        </button>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            onDragBuildStart("lp");
          }}
          className="px-3 py-1 bg-cyan-700 border-2 border-cyan-400 text-cyan-200 flex items-center gap-1.5 hover:bg-cyan-600 transition-colors cursor-grab active:cursor-grabbing select-none"
        >
          <span className="text-[8px]">+</span> LP
        </button>
        <button
          disabled={hasLotteryBuilding}
          onPointerDown={(e) => {
            if (hasLotteryBuilding) return;
            e.preventDefault();
            onDragBuildStart("lottery");
          }}
          className={
            hasLotteryBuilding
              ? "px-3 py-1 bg-slate-700 border-2 border-slate-500 text-slate-400 flex items-center gap-1.5 opacity-50 cursor-not-allowed select-none"
              : "px-3 py-1 bg-amber-700 border-2 border-amber-400 text-amber-200 flex items-center gap-1.5 hover:bg-amber-600 transition-colors cursor-grab active:cursor-grabbing select-none"
          }
          title={hasLotteryBuilding ? "Already built" : undefined}
        >
          <span className="text-[8px]">{hasLotteryBuilding ? "✓" : "+"}</span>{" "}
          LOTTERY
        </button>
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            onDragBuildStart("megapot-lp");
          }}
          className="px-3 py-1 bg-purple-700 border-2 border-purple-400 text-purple-200 flex items-center gap-1.5 hover:bg-purple-600 transition-colors cursor-grab active:cursor-grabbing select-none"
        >
          <MegapotLPIcon size={10} /> MEGAPOT LP
        </button>
        <span className="text-slate-600 mx-1">|</span>
        <span className="text-slate-500">
          BUILDINGS: <span className="text-amber-400">{buildingCount}</span>
        </span>
      </div>

      {/* Right: Camera controls */}
      <div className="flex items-center gap-1">
        <button
          onClick={onZoomOut}
          className="w-6 h-6 bg-slate-800 border border-slate-600 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors text-[8px]"
        >
          -
        </button>
        <button
          onClick={onResetCamera}
          className="px-2 h-6 bg-slate-800 border border-slate-600 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors"
        >
          RESET
        </button>
        <button
          onClick={onZoomIn}
          className="w-6 h-6 bg-slate-800 border border-slate-600 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white transition-colors text-[8px]"
        >
          +
        </button>
      </div>
    </div>
  );
}
