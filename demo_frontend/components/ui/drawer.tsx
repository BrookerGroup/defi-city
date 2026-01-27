"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function Drawer({ open, onOpenChange, children }: DrawerProps) {
  React.useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [open]);

  if (!open) return null;

  return (
    <>
      {/* Overlay - blur only */}
      <div
        className="fixed inset-0 backdrop-blur-sm z-40"
        onClick={() => onOpenChange(false)}
      />

      {/* Drawer - explicit white background with border */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-full max-w-md shadow-2xl z-50",
          "transform transition-transform duration-300 ease-in-out",
          "flex flex-col"
        )}
        style={{
          backgroundColor: "white",
          borderLeft: "2px solid #e5e7eb",
        }}
      >
        {/* Header with close button */}
        <div
          className="flex items-center justify-between p-4 border-b border-gray-200"
          style={{ backgroundColor: "white" }}
        >
          <h2 className="text-lg font-semibold text-gray-900">Select Building</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-sm opacity-70 hover:opacity-100 transition-opacity text-gray-900"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
        </div>

        {/* Content */}
        <div
          className="flex-1 overflow-y-auto p-4"
          style={{ backgroundColor: "white" }}
        >
          {children}
        </div>
      </div>
    </>
  );
}
