/**
 * RoutePanel.tsx — Origin/destination picker + step-by-step instructions.
 *
 * This is the user-facing navigation UI. It lives as a slide-in panel
 * at the bottom of the screen on mobile, or as a sidebar on desktop.
 *
 * WHY separate from RoomSearch?
 * RoomSearch is for "show me where this room is."
 * RoutePanel is for "get me from A to B."
 * They're different mental models and different UX flows.
 */

"use client";

import { useState } from "react";
import { getAllRooms } from "@/data/map-data";
import { Route } from "@/lib/pathfinding";

interface RoutePanelProps {
  originId: string | null;
  destinationId: string | null;
  route: Route | null;
  onSetOrigin: (id: string | null) => void;
  onSetDestination: (id: string | null) => void;
  onClear: () => void;
  onFloorSwitch: (floor: number) => void;
}

const ALL_ROOMS = getAllRooms();
const FLOOR_LABELS = ["Ground", "First", "Second"];
const STEP_ICONS: Record<string, string> = {
  left: "↰",
  right: "↱",
  straight: "↑",
  up: "🏃",
  down: "🏃",
  default: "•",
};

export default function RoutePanel({
  originId,
  destinationId,
  route,
  onSetOrigin,
  onSetDestination,
  onClear,
  onFloorSwitch,
}: RoutePanelProps) {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex flex-col gap-2">
      {/* ── Picker row ── */}
      <div className="flex items-center gap-2">
        {/* Origin */}
        <div className="flex-1 min-w-0">
          <label className="text-[9px] text-slate-500 uppercase tracking-wider px-1">
            From
          </label>
          <select
            className="w-full bg-slate-900/80 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            value={originId ?? ""}
            onChange={(e) => onSetOrigin(e.target.value || null)}
          >
            <option value="">Select origin…</option>
            {ALL_ROOMS.map((r) => (
              <option key={r.id} value={r.id}>
                [{FLOOR_LABELS[r.floorId]}] {r.label.replace(/\n/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Swap arrow */}
        <button
          onClick={() => {
            onSetOrigin(destinationId);
            onSetDestination(originId);
          }}
          className="mt-4 p-1.5 rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-white hover:bg-slate-700/60 transition-all text-xs"
          title="Swap origin and destination"
        >
          ⇄
        </button>

        {/* Destination */}
        <div className="flex-1 min-w-0">
          <label className="text-[9px] text-slate-500 uppercase tracking-wider px-1">
            To
          </label>
          <select
            className="w-full bg-slate-900/80 border border-slate-700/50 rounded-lg px-2 py-1.5 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            value={destinationId ?? ""}
            onChange={(e) => onSetDestination(e.target.value || null)}
          >
            <option value="">Select destination…</option>
            {ALL_ROOMS.map((r) => (
              <option key={r.id} value={r.id}>
                [{FLOOR_LABELS[r.floorId]}] {r.label.replace(/\n/g, " ")}
              </option>
            ))}
          </select>
        </div>

        {/* Clear */}
        {(originId || destinationId) && (
          <button
            onClick={onClear}
            className="mt-4 p-1.5 rounded-lg bg-red-950/40 border border-red-800/30 text-red-400 hover:bg-red-900/40 transition-all text-xs"
            title="Clear route"
          >
            ✕
          </button>
        )}
      </div>

      {/* ── Route summary ── */}
      {route?.found && (
        <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
          <div className="text-indigo-300 text-xs font-semibold">
            ~{route.estimatedMinutes} min
          </div>
          <div className="text-slate-400 text-[10px]">
            {route.floorSegments.length > 1
              ? `${route.floorSegments.length} floors`
              : FLOOR_LABELS[route.floorSegments[0]?.floor ?? 0] + " Floor"}
          </div>
          <div className="ml-auto">
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-[10px] text-indigo-400 hover:text-indigo-200 transition"
            >
              {expanded ? "Hide steps" : "Show steps"}
            </button>
          </div>
        </div>
      )}

      {/* ── Pick destination hint ── */}
      {originId && !destinationId && (
        <p className="text-[10px] text-indigo-400 text-center py-1 animate-pulse">
          📍 Now tap your destination on the map
        </p>
      )}

      {/* ── No route found warning ── */}
      {route && !route.found && (
        <div className="text-[11px] text-red-400 px-3 py-2 rounded-lg bg-red-950/30 border border-red-800/30">
          No path found between these locations.
        </div>
      )}

      {/* ── Step list ── */}
      {route?.found && expanded && (
        <div className="max-h-40 overflow-y-auto flex flex-col gap-1 pr-1">
          {route.steps.map((step, i) => (
            <button
              key={step.nodeId + i}
              onClick={() => onFloorSwitch(step.floor)}
              className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-left
                         bg-slate-900/50 border border-slate-800/40
                         hover:bg-slate-800/60 hover:border-slate-700/50
                         transition-all group"
            >
              {/* Step number */}
              <span className="text-[10px] text-slate-500 w-4 shrink-0 group-hover:text-slate-400">
                {i + 1}
              </span>
              {/* Direction icon */}
              <span className="text-sm shrink-0">
                {step.isFloorChange
                  ? STEP_ICONS[step.direction ?? "default"]
                  : STEP_ICONS[step.direction ?? "default"]}
              </span>
              {/* Instruction */}
              <span className="text-[11px] text-slate-300 leading-snug group-hover:text-white transition">
                {step.instruction}
              </span>
              {/* Floor badge */}
              {step.isFloorChange && (
                <span className="ml-auto text-[9px] text-amber-400 shrink-0">
                  Floor {step.floor}
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}