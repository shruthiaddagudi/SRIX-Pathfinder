"use client";

import { FloorData } from "@/types";

interface MapControlsProps {
  currentFloor: FloorData;
  floors: FloorData[];
  onSwitchFloor: (id: number) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}

/**
 * MapControls — Floor selector tabs + zoom buttons.
 *
 * WHY separate from FloorMap?
 * - Controls might be repositioned (bottom sheet, sidebar, etc.)
 * - Keeps FloorMap focused on rendering only
 * - Controls will gain more buttons in later phases (scan QR, toggle tracking)
 */
export default function MapControls({
  currentFloor,
  floors,
  onSwitchFloor,
  onZoomIn,
  onZoomOut,
  onReset,
}: MapControlsProps) {
  return (
    <div className="flex items-center justify-between gap-3">
      {/* Floor tabs */}
      <div className="flex bg-slate-900/80 backdrop-blur-sm rounded-xl p-1 border border-slate-800/50">
        {floors.map((floor) => (
          <button
            key={floor.id}
            onClick={() => onSwitchFloor(floor.id)}
            className={`
              px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200
              ${
                currentFloor.id === floor.id
                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-500/25"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
              }
            `}
          >
            {floor.label}
          </button>
        ))}
      </div>

      {/* Zoom controls */}
      <div className="flex bg-slate-900/80 backdrop-blur-sm rounded-xl border border-slate-800/50 overflow-hidden">
        <button
          onClick={onZoomOut}
          className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors text-lg leading-none"
          aria-label="Zoom out"
        >
          −
        </button>
        <button
          onClick={onReset}
          className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors text-xs border-x border-slate-800/50"
          aria-label="Reset view"
        >
          ⟲
        </button>
        <button
          onClick={onZoomIn}
          className="px-3 py-2 text-slate-400 hover:text-white hover:bg-slate-800/50 transition-colors text-lg leading-none"
          aria-label="Zoom in"
        >
          +
        </button>
      </div>
    </div>
  );
}
