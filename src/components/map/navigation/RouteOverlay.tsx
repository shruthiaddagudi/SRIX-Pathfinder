/**
 * RouteOverlay.tsx — Draws the computed A* route on the SVG floor map.
 *
 * WHY a separate component?
 * FloorMap.tsx handles rendering the map itself.
 * RouteOverlay sits *inside* the same SVG coordinate space but is
 * completely independent — it only knows about the route, not the map.
 * This clean separation means you can swap map rendering later without
 * touching pathfinding rendering, and vice versa.
 *
 * HOW it works:
 * 1. Filter route nodes to the currently visible floor
 * 2. Convert node positions to an SVG polyline
 * 3. Animate the line using stroke-dashoffset (the classic "drawing" effect)
 * 4. Mark the origin (green dot) and destination (flag)
 */

"use client";

import { useEffect, useRef } from "react";
import { Route, FloorSegment } from "@/lib/pathfinding";

interface RouteOverlayProps {
  route: Route | null;
  currentFloor: number;
  /** The SVG viewBox dimensions — must match what FloorMap uses */
  viewBox?: { width: number; height: number };
}

export default function RouteOverlay({
  route,
  currentFloor,
  viewBox = { width: 1200, height: 800 },
}: RouteOverlayProps) {
  const pathRef = useRef<SVGPolylineElement>(null);

  // Animate the route line when it changes
  useEffect(() => {
    const el = pathRef.current;
    if (!el) return;
    const len = el.getTotalLength?.() ?? 500;
    el.style.strokeDasharray = `${len}`;
    el.style.strokeDashoffset = `${len}`;
    // Trigger reflow then animate
    void el.getBoundingClientRect();
    el.style.transition = "stroke-dashoffset 1.2s ease-in-out";
    el.style.strokeDashoffset = "0";
  }, [route, currentFloor]);

  if (!route || !route.found) return null;

  // Find the segment for this floor
  const segment: FloorSegment | undefined = route.floorSegments.find(
    (s) => s.floor === currentFloor
  );
  if (!segment || segment.nodes.length < 2) return null;

  const points = segment.nodes
    .map((n) => `${n.position.x},${n.position.y}`)
    .join(" ");

  const firstNode = segment.nodes[0];
  const lastNode = segment.nodes[segment.nodes.length - 1];

  // Is the goal on this floor?
  const goalOnThisFloor = route.goalId &&
    route.allNodes[route.allNodes.length - 1]?.floor === currentFloor;

  // Is the origin on this floor?
  const originOnThisFloor = route.startId &&
    route.allNodes[0]?.floor === currentFloor;

  return (
    <g>
      {/* ── Route line ── */}
      <polyline
        ref={pathRef}
        points={points}
        fill="none"
        stroke="#6366f1"        /* indigo-500 */
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.85"
      />
      {/* Glow layer underneath */}
      <polyline
        points={points}
        fill="none"
        stroke="#6366f1"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.15"
      />

      {/* ── Origin dot (green) ── */}
      {originOnThisFloor && (
        <g>
          <circle
            cx={firstNode.position.x}
            cy={firstNode.position.y}
            r="14"
            fill="#22c55e"
            opacity="0.25"
          />
          <circle
            cx={firstNode.position.x}
            cy={firstNode.position.y}
            r="8"
            fill="#22c55e"
            stroke="white"
            strokeWidth="2"
          />
        </g>
      )}

      {/* ── Destination marker (flag-style) ── */}
      {goalOnThisFloor && (
        <g transform={`translate(${lastNode.position.x - 10}, ${lastNode.position.y - 30})`}>
          {/* Flag pole */}
          <line x1="0" y1="0" x2="0" y2="30" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round"/>
          {/* Flag */}
          <polygon points="0,0 18,6 0,12" fill="#ef4444" opacity="0.9"/>
          {/* Base circle */}
          <circle cx="0" cy="30" r="5" fill="#ef4444" stroke="white" strokeWidth="2"/>
        </g>
      )}

      {/* ── Floor-change indicator (stairs arrow) ── */}
      {!goalOnThisFloor && segment.nodes.length > 0 && (
        <g transform={`translate(${lastNode.position.x}, ${lastNode.position.y})`}>
          <circle r="16" fill="#f59e0b" opacity="0.85" stroke="white" strokeWidth="2"/>
          <text
            textAnchor="middle"
            dominantBaseline="central"
            fontSize="14"
            fill="white"
            fontWeight="bold"
          >
            {route.allNodes.find(
              (n) => n.id === route.goalId
            )?.floor ?? 0 > currentFloor ? "↑" : "↓"}
          </text>
        </g>
      )}
    </g>
  );
}