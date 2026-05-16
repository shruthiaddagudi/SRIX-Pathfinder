"use client";

import { memo, useState, useEffect, useMemo, useCallback } from "react";
import { MAP_CONFIG } from "@/data/floors";
import { FloorData, GraphNode, GraphEdge } from "@/types";
import { FLOOR_MAP_DATA, FloorMapData } from "@/data/map-data";
import GraphDebugOverlay from "./GraphDebugOverlay";

interface FloorMapProps {
  floor: FloorData;
  viewBox: string;
  handlers: React.SVGAttributes<SVGSVGElement>;
  highlightedRoomId?: string | null;
  onRoomSelect?: (roomId: string | null, floorId: number) => void;
  /** Phase 3: pass in to render graph debug overlay */
  debugMode?: boolean;
  graphNodes?: GraphNode[];
  graphEdges?: GraphEdge[];
  routeOverlay?: React.ReactNode;
  originRoomId?: string | null;
  destinationRoomId?: string | null;
  onSetNavMode?: (enabled: boolean) => void;
  onSetOrigin?: (roomId: string | null) => void;
  onSetHighlightedRoom?: (roomId: string | null) => void;
}

function FloorMap({
  floor,
  viewBox,
  handlers,
  highlightedRoomId,
  onRoomSelect,
  debugMode = false,
  graphNodes = [],
  graphEdges = [],
  routeOverlay,
  originRoomId,
  destinationRoomId,
  onSetNavMode,
  onSetOrigin,
  onSetHighlightedRoom,
}: FloorMapProps) {
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [hoveredGraphNode, setHoveredGraphNode] = useState<string | null>(null);

  const floorData: FloorMapData = FLOOR_MAP_DATA[floor.id] ?? FLOOR_MAP_DATA[0];

  const handleRoomClick = useCallback((id: string) => {
    const next = selectedRoom === id ? null : id;
    setSelectedRoom(next);
    onRoomSelect?.(next, floor.id);
  }, [selectedRoom, floor.id, onRoomSelect]);

  const getRoomFill = useCallback(
    (roomId: string) => {
      if (roomId === originRoomId) return "rgba(34,197,94,0.35)";
      if (roomId === destinationRoomId) return "rgba(239,68,68,0.35)";
      if (roomId === highlightedRoomId) return "rgba(99,102,241,0.25)";
      return "rgba(255,255,255,0.04)";
    },
    [originRoomId, destinationRoomId, highlightedRoomId]
  );

  const renderedCorridors = useMemo(
    () => floorData.corridors.map((c, i) => (
      <line
        key={`band-${i}`}
        x1={c.x1}
        y1={c.y1}
        x2={c.x2}
        y2={c.y2}
        stroke="rgba(99,102,241,0.06)"
        strokeWidth="48"
        strokeLinecap="round"
      />
    )),
    [floorData.corridors]
  );

  const renderedCenterLines = useMemo(
    () => floorData.corridors.map((c, i) => (
      <line
        key={`cl-${i}`}
        x1={c.x1}
        y1={c.y1}
        x2={c.x2}
        y2={c.y2}
        stroke="rgba(99,102,241,0.18)"
        strokeWidth="1.5"
        strokeDasharray="8 5"
      />
    )),
    [floorData.corridors]
  );

  const renderedRooms = useMemo(
    () => floorData.rooms.map((room) => {
      const isSelected = selectedRoom === room.id;
      const color = getRoomColor(room.type);
      const lines = room.label.split("\n");

      return (
        <g
          key={room.id}
          onClick={() => handleRoomClick(room.id)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              handleRoomClick(room.id);
            }
          }}
          role="button"
          aria-label={room.label}
          tabIndex={0}
          style={{ cursor: "pointer" }}
        >
          {isSelected && (
            <rect
              x={room.x - 4}
              y={room.y - 4}
              width={room.w + 8}
              height={room.h + 8}
              fill="url(#roomHighlight)"
              rx="6"
              filter="url(#glow)"
            />
          )}
          <rect
            x={room.x}
            y={room.y}
            width={room.w}
            height={room.h}
            fill={getRoomFill(room.id)}
            stroke={isSelected ? color.selectedStroke : color.stroke}
            strokeWidth={isSelected ? 2 : 1}
            rx="3"
            className="transition-all duration-150"
          />
          {lines.map((line, li) => (
            <text
              key={li}
              x={room.x + room.w / 2}
              y={room.y + room.h / 2 + (li - (lines.length - 1) / 2) * 13}
              textAnchor="middle"
              dominantBaseline="central"
              fill={isSelected ? "rgba(255,255,255,0.95)" : "rgba(203,213,225,0.82)"}
              fontSize={room.fontSize ?? 10}
              fontFamily="system-ui"
              fontWeight={isSelected ? "600" : "400"}
              className="pointer-events-none select-none"
            >
              {line}
            </text>
          ))}
          <circle
            cx={room.x + room.w - 7}
            cy={room.y + 7}
            r="3.5"
            fill={color.badge}
            className="pointer-events-none"
          />
        </g>
      );
    }),
    [floorData.rooms, selectedRoom, highlightedRoomId, originRoomId, destinationRoomId, handleRoomClick, getRoomFill]
  );

  useEffect(() => {
    if (highlightedRoomId !== undefined) {
      setSelectedRoom(highlightedRoomId);
    }
  }, [highlightedRoomId]);

  return (
    <div className="relative w-full h-full overflow-hidden bg-slate-950 rounded-2xl border border-slate-800/50">
      <svg
        viewBox={viewBox}
        className="w-full h-full cursor-grab"
        style={{ touchAction: "pan-x pan-y" }}
        {...handlers}
      >
        <defs>
          <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
            <path d="M 50 0 L 0 0 0 50" fill="none" stroke="rgba(148,163,184,0.05)" strokeWidth="0.5" />
          </pattern>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="softShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="4" floodColor="rgba(0,0,0,0.5)" />
          </filter>
          <radialGradient id="roomHighlight" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(99,102,241,0.35)" />
            <stop offset="100%" stopColor="rgba(99,102,241,0.05)" />
          </radialGradient>
        </defs>

        {/* Background grid */}
        <rect width={MAP_CONFIG.WIDTH} height={MAP_CONFIG.HEIGHT} fill="url(#grid)" />

        {/* Building outer wall */}
        <rect
          x={floorData.building.x} y={floorData.building.y}
          width={floorData.building.w} height={floorData.building.h}
          fill="rgba(15,23,42,0.5)"
          stroke="rgba(99,102,241,0.4)"
          strokeWidth="3" rx="6"
          filter="url(#softShadow)"
        />

        {/* Corridor bands */}
        {renderedCorridors}

        {/* Corridor centerlines — only when debug is OFF (graph overlay shows them instead) */}
        {!debugMode && renderedCenterLines}

        {/* Junction dots — only when debug is OFF */}
        {!debugMode && floorData.junctions.map((j) => (
          <circle key={`junc-${j.id}`} cx={j.x} cy={j.y} r="4"
            fill="rgba(99,102,241,0.15)" stroke="rgba(99,102,241,0.35)" strokeWidth="1"
          />
        ))}

        {/* Center feature */}
        {floorData.centerFeature && (
          <g>
            <rect
              x={floorData.centerFeature.x} y={floorData.centerFeature.y}
              width={floorData.centerFeature.w} height={floorData.centerFeature.h}
              fill={floorData.centerFeature.fill} stroke={floorData.centerFeature.stroke}
              strokeWidth="1.5" rx="6"
            />
            <text
              x={floorData.centerFeature.x + floorData.centerFeature.w / 2}
              y={floorData.centerFeature.y + floorData.centerFeature.h / 2}
              textAnchor="middle" dominantBaseline="central"
              fill={floorData.centerFeature.textColor}
              fontSize="16" fontWeight="700" fontFamily="system-ui" letterSpacing="3"
            >
              {floorData.centerFeature.label}
            </text>
          </g>
        )}

        {/* Rooms */}
        {renderedRooms}

        {/* Stairs */}
        {floorData.stairs.map((stair, i) => {
          const isSelected = selectedRoom === `stairs-${i}`;
          return (
            <g key={`stair-${i}`} onClick={() => handleRoomClick(`stairs-${i}`)} style={{ cursor: "pointer" }}>
              <rect x={stair.x} y={stair.y} width={stair.w} height={stair.h}
                fill={isSelected ? "rgba(245,158,11,0.18)" : "rgba(245,158,11,0.07)"}
                stroke="rgba(245,158,11,0.45)" strokeWidth="1.5" rx="4"
              />
              {Array.from({ length: Math.floor(stair.h / 10) }).map((_, ri) => (
                <line key={ri}
                  x1={stair.x + 8} y1={stair.y + 8 + ri * 10}
                  x2={stair.x + stair.w - 8} y2={stair.y + 8 + ri * 10}
                  stroke="rgba(245,158,11,0.22)" strokeWidth="1.2"
                />
              ))}
              <path
                d={`M${stair.x + stair.w / 2},${stair.y + stair.h - 10} L${stair.x + stair.w / 2},${stair.y + 14} M${stair.x + stair.w / 2 - 7},${stair.y + 22} L${stair.x + stair.w / 2},${stair.y + 12} L${stair.x + stair.w / 2 + 7},${stair.y + 22}`}
                fill="none" stroke="rgba(245,158,11,0.65)" strokeWidth="2"
              />
              <text x={stair.x + stair.w / 2} y={stair.y + stair.h + 12}
                textAnchor="middle" fill="rgba(245,158,11,0.75)"
                fontSize="9" fontFamily="system-ui" fontWeight="600"
              >
                {stair.label}
              </text>
            </g>
          );
        })}

        {/* QR checkpoints */}
        {floorData.qrPoints.map((qr) => (
          <g key={`qr-${qr.id}`}>
            <circle cx={qr.x} cy={qr.y} r="8"
              fill="rgba(16,185,129,0.1)" stroke="rgba(16,185,129,0.45)" strokeWidth="1.5"
            />
            <circle cx={qr.x} cy={qr.y} r="3" fill="rgba(16,185,129,0.8)" />
            <circle cx={qr.x} cy={qr.y} r="8" fill="none" stroke="rgba(16,185,129,0.3)" strokeWidth="1">
              <animate attributeName="r" from="8" to="20" dur="2.5s" repeatCount="indefinite" />
              <animate attributeName="opacity" from="0.8" to="0" dur="2.5s" repeatCount="indefinite" />
            </circle>
          </g>
        ))}

        {/* Entrances */}
        {floorData.entrances?.map((ent) => (
          <g key={`ent-${ent.id}`}>
            <rect x={ent.x - 28} y={ent.y - 11} width="56" height="22"
              fill={ent.isMain ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.12)"}
              stroke={ent.isMain ? "rgba(239,68,68,0.55)" : "rgba(96,165,250,0.4)"}
              strokeWidth="1.5" rx="11"
            />
            <text x={ent.x} y={ent.y} textAnchor="middle" dominantBaseline="central"
              fill={ent.isMain ? "rgba(252,165,165,0.95)" : "rgba(96,165,250,0.9)"}
              fontSize="8" fontFamily="system-ui" fontWeight="700"
            >
              {ent.label}
            </text>
            {ent.isMain && (
              <>
                <path d={`M${ent.x},${ent.y + 15} L${ent.x},${ent.y + 28}`}
                  stroke="rgba(239,68,68,0.7)" strokeWidth="2" fill="none"
                />
                <path d={`M${ent.x - 5},${ent.y + 19} L${ent.x},${ent.y + 14} L${ent.x + 5},${ent.y + 19}`}
                  stroke="rgba(239,68,68,0.7)" strokeWidth="2" fill="none"
                />
              </>
            )}
          </g>
        ))}

        {/* Floor title */}
        <text x={floorData.building.x + 18} y={floorData.building.y + 26}
          fill="rgba(99,102,241,0.35)" fontSize="13" fontWeight="700"
          fontFamily="monospace" letterSpacing="2"
        >
          {floor.label.toUpperCase()}
        </text>

        {/* ── Phase 3: Graph Debug Overlay ── */}
        {debugMode && graphNodes.length > 0 && (
          <GraphDebugOverlay
            nodes={graphNodes}
            edges={graphEdges}
            hoveredNodeId={hoveredGraphNode}
            onHoverNode={setHoveredGraphNode}
          />
        )}

        {routeOverlay}
      </svg>

      {/* Selected room panel */}
      {selectedRoom && !debugMode && (
        <div className="absolute bottom-4 left-4 right-4 bg-slate-900/95 backdrop-blur-md border border-slate-700/50 rounded-xl p-4 shadow-2xl z-20">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-white font-semibold text-sm truncate">
                {getRoomLabel(selectedRoom, floorData)}
              </p>
              <p className="text-slate-400 text-xs mt-0.5">
                {floor.label}
                {getRoomType(selectedRoom, floorData) && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-500 text-[10px]">
                    {getRoomType(selectedRoom, floorData)}
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => { setSelectedRoom(null); onRoomSelect?.(null, floor.id); }}
                className="px-3 py-2 text-slate-400 hover:text-white text-xs rounded-lg border border-slate-700/50 transition-colors"
              >
                ✕
              </button>
              <button
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-lg shadow-indigo-500/20"
                onClick={() => {
                  onSetNavMode?.(true);
                  onSetOrigin?.(selectedRoom);
                  onSetHighlightedRoom?.(null);
                }}
              >
                Navigate →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Legend */}
      {!debugMode && (
        <div className="absolute top-3 right-3 bg-slate-900/85 backdrop-blur-sm rounded-xl p-3 border border-slate-800/50 shadow-lg">
          <p className="text-[9px] text-slate-600 font-semibold uppercase tracking-widest mb-2">Legend</p>
          <div className="flex flex-col gap-1.5 text-[10px] text-slate-400">
            {[
              ["bg-indigo-400/70", "Room / Class"],
              ["bg-cyan-400/70",   "Office"],
              ["bg-amber-400/70",  "Stairs"],
              ["bg-emerald-400/70","QR Point"],
              ["bg-rose-400/70",   "Washroom"],
              ["bg-orange-400/70", "Canteen"],
              ["bg-blue-400/70",   "Entry"],
            ].map(([cls, label]) => (
              <div key={label} className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${cls}`} />
                {label}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Debug mode badge */}
      {debugMode && (
        <div className="absolute top-3 right-3 px-3 py-1.5 rounded-lg bg-indigo-950/80 border border-indigo-500/40 text-[10px] text-indigo-300 font-semibold">
          GRAPH DEBUG ON — hover nodes to inspect
        </div>
      )}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRoomLabel(id: string, floorData: FloorMapData): string {
  if (id.startsWith("stairs-")) {
    const idx = parseInt(id.split("-")[1]);
    return floorData.stairs[idx]?.label ?? "Stairs";
  }
  return floorData.rooms.find((r) => r.id === id)?.label.replace(/\n/g, " ") ?? id;
}

function getRoomType(id: string, floorData: FloorMapData): string {
  if (id.startsWith("stairs-")) return "stairs";
  return floorData.rooms.find((r) => r.id === id)?.type ?? "";
}

function getRoomColor(type: string) {
  const map: Record<string, { fill: string; stroke: string; selectedFill: string; selectedStroke: string; badge: string }> = {
    room:     { fill: "rgba(30,41,59,0.75)",  stroke: "rgba(71,85,105,0.45)",  selectedFill: "rgba(99,102,241,0.22)",  selectedStroke: "rgba(129,140,248,0.9)", badge: "rgba(99,102,241,0.7)"  },
    office:   { fill: "rgba(14,58,78,0.3)",   stroke: "rgba(34,211,238,0.22)", selectedFill: "rgba(34,211,238,0.18)", selectedStroke: "rgba(34,211,238,0.8)",  badge: "rgba(34,211,238,0.7)" },
    washroom: { fill: "rgba(76,29,49,0.3)",   stroke: "rgba(244,63,94,0.28)",  selectedFill: "rgba(244,63,94,0.18)",  selectedStroke: "rgba(244,63,94,0.8)",   badge: "rgba(244,63,94,0.7)"  },
    canteen:  { fill: "rgba(120,53,15,0.25)", stroke: "rgba(251,146,60,0.32)", selectedFill: "rgba(251,146,60,0.18)", selectedStroke: "rgba(251,146,60,0.8)",  badge: "rgba(251,146,60,0.7)" },
    lab:      { fill: "rgba(20,50,30,0.35)",  stroke: "rgba(74,222,128,0.28)", selectedFill: "rgba(74,222,128,0.18)", selectedStroke: "rgba(74,222,128,0.8)",  badge: "rgba(74,222,128,0.7)" },
    entrance: { fill: "rgba(15,30,80,0.3)",   stroke: "rgba(96,165,250,0.32)", selectedFill: "rgba(96,165,250,0.18)", selectedStroke: "rgba(96,165,250,0.8)",  badge: "rgba(96,165,250,0.7)" },
  };
  return map[type] ?? map.room;
}

export default memo(FloorMap, (prev, next) =>
  prev.floor.id === next.floor.id &&
  prev.highlightedRoomId === next.highlightedRoomId &&
  prev.originRoomId === next.originRoomId &&
  prev.destinationRoomId === next.destinationRoomId &&
  prev.debugMode === next.debugMode &&
  prev.routeOverlay === next.routeOverlay
);
