"use client";

import { useMemo } from "react";
import { GraphNode, GraphEdge } from "@/types";

interface GraphDebugOverlayProps {
  /** All nodes on the currently visible floor */
  nodes: GraphNode[];
  /** All same-floor edges */
  edges: GraphEdge[];
  /** Node that was just hovered / tapped */
  hoveredNodeId?: string | null;
  onHoverNode?: (id: string | null) => void;
}

/**
 * GraphDebugOverlay — SVG layer drawn ON TOP of the floor map.
 *
 * PURPOSE (Phase 3 only):
 *   Lets us visually verify that the graph is correct before writing A*.
 *   Every node and edge should exactly match where we expect them to be
 *   on the floor plan.
 *
 * Rendered INSIDE the same <svg> as FloorMap so it shares the viewBox /
 * zoom / pan state automatically.
 *
 * WHAT IT SHOWS:
 *   • Purple dashed lines = corridor edges (walkable paths)
 *   • Amber lines = stair edges (cross-floor — won't appear here, shown in stats)
 *   • Coloured circles = nodes (colour by type)
 *   • Node label on hover
 *   • Edge weight label at midpoint on hover
 */

const NODE_COLORS: Record<string, string> = {
  junction:      "rgba(99,102,241,0.9)",   // indigo
  room:          "rgba(148,163,184,0.7)",  // slate
  office:        "rgba(34,211,238,0.8)",   // cyan
  washroom:      "rgba(244,63,94,0.8)",    // rose
  canteen:       "rgba(251,146,60,0.8)",   // orange
  lab:           "rgba(74,222,128,0.8)",   // green
  entrance:      "rgba(96,165,250,0.8)",   // blue
  stairs:        "rgba(245,158,11,0.9)",   // amber
  "qr-checkpoint": "rgba(16,185,129,0.9)",
};

const NODE_RADIUS: Record<string, number> = {
  junction: 7,
  stairs:   9,
  room:     5,
  office:   5,
  washroom: 5,
  canteen:  5,
  lab:      5,
  entrance: 5,
};

export default function GraphDebugOverlay({
  nodes,
  edges,
  hoveredNodeId,
  onHoverNode,
}: GraphDebugOverlayProps) {
  // Deduplicate edges (each stored twice in adjacency list)
  const uniqueEdges = useMemo(() => {
    const seen = new Set<string>();
    return edges.filter((e) => {
      const key = [e.from, e.to].sort().join("|");
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }, [edges]);

  const nodeMap = useMemo(() => {
    const m = new Map<string, GraphNode>();
    nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [nodes]);

  const hoveredNode = hoveredNodeId ? nodeMap.get(hoveredNodeId) : null;
  const hoveredEdges = hoveredNodeId
    ? uniqueEdges.filter(
        (e) => e.from === hoveredNodeId || e.to === hoveredNodeId
      )
    : [];

  return (
    <g className="graph-debug-overlay">
      {/* ── Edges ── */}
      {uniqueEdges.map((edge) => {
        const fromNode = nodeMap.get(edge.from);
        const toNode   = nodeMap.get(edge.to);
        if (!fromNode || !toNode) return null;

        const isHovered =
          hoveredNodeId === edge.from || hoveredNodeId === edge.to;

        return (
          <g key={`edge-${edge.from}-${edge.to}`}>
            <line
              x1={fromNode.position.x} y1={fromNode.position.y}
              x2={toNode.position.x}   y2={toNode.position.y}
              stroke={isHovered ? "rgba(99,102,241,0.95)" : "rgba(99,102,241,0.35)"}
              strokeWidth={isHovered ? 2.5 : 1.5}
              strokeDasharray={isHovered ? "none" : "5 4"}
            />
            {/* Weight label at midpoint (shown on hover) */}
            {isHovered && (
              <text
                x={(fromNode.position.x + toNode.position.x) / 2}
                y={(fromNode.position.y + toNode.position.y) / 2 - 6}
                textAnchor="middle"
                fill="rgba(165,180,252,0.9)"
                fontSize="9"
                fontFamily="monospace"
              >
                {Math.round(edge.weight)}u
              </text>
            )}
          </g>
        );
      })}

      {/* ── Nodes ── */}
      {nodes.map((node) => {
        const color  = NODE_COLORS[node.type] ?? "rgba(148,163,184,0.7)";
        const radius = NODE_RADIUS[node.type] ?? 5;
        const isHovered = node.id === hoveredNodeId;

        return (
          <g
            key={`node-${node.id}`}
            onMouseEnter={() => onHoverNode?.(node.id)}
            onMouseLeave={() => onHoverNode?.(null)}
            onTouchStart={() => onHoverNode?.(node.id)}
            style={{ cursor: "pointer" }}
          >
            {/* Outer glow ring on hover */}
            {isHovered && (
              <circle
                cx={node.position.x} cy={node.position.y}
                r={radius + 6}
                fill="none"
                stroke={color}
                strokeWidth="1.5"
                opacity="0.4"
              />
            )}
            {/* Main node circle */}
            <circle
              cx={node.position.x} cy={node.position.y}
              r={isHovered ? radius + 2 : radius}
              fill={isHovered ? color : color.replace("0.9", "0.6").replace("0.8", "0.5").replace("0.7", "0.4")}
              stroke={color}
              strokeWidth="1.5"
            />
            {/* Type letter inside junction nodes */}
            {node.type === "junction" && (
              <text
                x={node.position.x} y={node.position.y}
                textAnchor="middle" dominantBaseline="central"
                fill="white" fontSize="6" fontFamily="monospace"
                className="pointer-events-none select-none"
              >
                J
              </text>
            )}
            {node.type === "stairs" && (
              <text
                x={node.position.x} y={node.position.y}
                textAnchor="middle" dominantBaseline="central"
                fill="white" fontSize="7" fontFamily="monospace"
                className="pointer-events-none select-none"
              >
                ↑
              </text>
            )}
            {/* Label on hover */}
            {isHovered && (
              <g>
                <rect
                  x={node.position.x + radius + 4}
                  y={node.position.y - 12}
                  width={node.label.length * 6.5 + 12}
                  height="22"
                  fill="rgba(15,23,42,0.92)"
                  stroke={color}
                  strokeWidth="1"
                  rx="4"
                />
                <text
                  x={node.position.x + radius + 10}
                  y={node.position.y + 1}
                  fill="white"
                  fontSize="9"
                  fontFamily="system-ui"
                  dominantBaseline="central"
                  className="pointer-events-none select-none"
                >
                  {node.label}
                </text>
              </g>
            )}
          </g>
        );
      })}
    </g>
  );
}
