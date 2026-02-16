"use client";

import { useState, useRef, useEffect } from "react";

/**
 * BottomBar - Status bar at the bottom (design: BUY BUILDING, LOTTERY, stats, LP)
 */

export type DragBuildType = "supply" | "borrow" | "lp" | "lottery" | "megapot-lp";

interface BottomBarProps {
  selectedCoords: { x: number; y: number } | null;
  selectedBuilding?: { type: string } | null;
  buildingCount: number;
  suppliedUSD?: number;
  borrowedUSD?: number;
  healthFactor?: number;
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
  selectedBuilding,
  buildingCount,
  suppliedUSD = 0,
  borrowedUSD = 0,
  healthFactor = Infinity,
  onResetCamera,
  onZoomIn,
  onZoomOut,
  onDragBuildStart,
  isMoving,
  isLoading,
  hasLotteryBuilding,
}: BottomBarProps) {
  const [showBuyMenu, setShowBuyMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setShowBuyMenu(false);
    };
    if (showBuyMenu) document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [showBuyMenu]);

  const formatUSD = (n: number) =>
    n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n.toFixed(2);
  const healthStr =
    healthFactor === Infinity || !Number.isFinite(healthFactor) ? "—" : healthFactor.toFixed(2);

  const startDrag = (type: DragBuildType) => {
    setShowBuyMenu(false);
    onDragBuildStart(type);
  };

  return (
    <div
      className="pointer-events-auto flex items-center justify-between gap-4 px-4 py-2.5 bg-slate-900/90 backdrop-blur-sm border-t-2 border-slate-700"
      style={pixelFont}
    >
      {/* Left: BUY BUILDING (primary, dropdown) + LOTTERY */}
      <div className="flex items-center gap-3" ref={menuRef}>
        <div className="relative">
          <button
            onClick={() => setShowBuyMenu((v) => !v)}
            className="px-4 py-2.5 bg-emerald-700 border-2 border-emerald-400 text-emerald-100 flex items-center gap-2 hover:bg-emerald-600 transition-colors select-none text-[8px]"
          >
            <span className="w-5 h-5 bg-emerald-500/50 rounded flex items-center justify-center text-[10px]">+</span>
            BUY BUILDING
          </button>
          {showBuyMenu && (
            <div className="absolute bottom-full left-0 mb-1 py-1 bg-slate-800 border-2 border-slate-600 rounded z-50 min-w-[140px]">
              <button
                onPointerDown={(e) => { e.preventDefault(); startDrag("supply"); }}
                className="w-full px-3 py-1.5 text-left text-[7px] text-emerald-300 hover:bg-emerald-900/50 cursor-grab active:cursor-grabbing"
                style={pixelFont}
              >+ SUPPLY</button>
              <button
                onPointerDown={(e) => { e.preventDefault(); startDrag("borrow"); }}
                className="w-full px-3 py-1.5 text-left text-[7px] text-orange-300 hover:bg-orange-900/50 cursor-grab active:cursor-grabbing"
                style={pixelFont}
              >+ BORROW</button>
              <button
                onPointerDown={(e) => { e.preventDefault(); startDrag("lp"); }}
                className="w-full px-3 py-1.5 text-left text-[7px] text-cyan-300 hover:bg-cyan-900/50 cursor-grab active:cursor-grabbing"
                style={pixelFont}
              >+ LP</button>
              <button
                onPointerDown={(e) => { e.preventDefault(); startDrag("megapot-lp"); }}
                className="w-full px-3 py-1.5 text-left text-[7px] text-purple-300 hover:bg-purple-900/50 cursor-grab active:cursor-grabbing"
                style={pixelFont}
              >+ MEGAPOT LP</button>
            </div>
          )}
        </div>
        <button
          disabled={hasLotteryBuilding}
          onPointerDown={(e) => {
            if (hasLotteryBuilding) return;
            e.preventDefault();
            onDragBuildStart("lottery");
          }}
          className={
            hasLotteryBuilding
              ? "px-4 py-2 bg-slate-700 border-2 border-slate-500 text-slate-400 flex items-center opacity-50 cursor-not-allowed select-none text-[7px]"
              : "px-4 py-2 bg-blue-600 border-2 border-blue-400 text-white flex items-center hover:bg-blue-500 transition-colors cursor-grab active:cursor-grabbing select-none text-[7px]"
          }
        >
          LOTTERY
        </button>
      </div>

      {/* Center: 4 stat panels (design) */}
      <div className="flex items-center gap-2">
        <div className="bg-white/95 border border-slate-300 px-3 py-2 min-w-[90px] text-center">
          <p className="text-slate-600 text-[5px] mb-0.5" style={pixelFont}>SUPPLIED</p>
          <p className="text-slate-800 text-[7px]" style={pixelFont}>${formatUSD(suppliedUSD)}</p>
        </div>
        <div className="bg-white/95 border border-slate-300 px-3 py-2 min-w-[90px] text-center">
          <p className="text-slate-600 text-[5px] mb-0.5" style={pixelFont}>BORROWED</p>
          <p className="text-slate-800 text-[7px]" style={pixelFont}>${formatUSD(borrowedUSD)}</p>
        </div>
        <div className="bg-white/95 border border-slate-300 px-3 py-2 min-w-[70px] text-center">
          <p className="text-slate-600 text-[5px] mb-0.5" style={pixelFont}>HEALTH</p>
          <p className="text-slate-800 text-[7px]" style={pixelFont}>{healthStr}</p>
        </div>
        <div className="bg-white/95 border border-slate-300 px-3 py-2 min-w-[70px] text-center">
          <p className="text-slate-600 text-[5px] mb-0.5" style={pixelFont}>BUILDING</p>
          <p className="text-slate-800 text-[7px]" style={pixelFont}>{buildingCount}</p>
        </div>
      </div>

      {/* Right: LP + Camera */}
      <div className="flex items-center gap-3">
        <button
          onPointerDown={(e) => {
            e.preventDefault();
            onDragBuildStart("lp");
          }}
          className="px-4 py-2 bg-white/95 border-2 border-slate-400 text-slate-800 flex items-center gap-1.5 hover:bg-slate-100 transition-colors cursor-grab active:cursor-grabbing select-none text-[7px]"
        >
          LP
        </button>
        <div className="flex items-center gap-1 border-l border-slate-600 pl-2">
          <button onClick={onZoomOut} className="w-7 h-7 bg-slate-800 border border-slate-600 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white text-[10px]">
            −
          </button>
          <button onClick={onResetCamera} className="px-2 h-7 bg-slate-800 border border-slate-600 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white text-[6px]">
            RESET
          </button>
          <button onClick={onZoomIn} className="w-7 h-7 bg-slate-800 border border-slate-600 text-slate-400 flex items-center justify-center hover:bg-slate-700 hover:text-white text-[10px]">
            +
          </button>
        </div>
      </div>
    </div>
  );
}
