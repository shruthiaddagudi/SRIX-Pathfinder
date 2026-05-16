"use client";

import { useMemo, useState, useCallback } from "react";
import { graphEngine } from "@/data/graphs/builder";
import { GraphNode, GraphEdge } from "@/types";

/**
 * useGraph — React interface to the GraphEngine singleton.
 *
 * WHY a hook?
 * - Components shouldn't import graphEngine directly (hard to test/mock)
 * - Centralises all graph queries behind a stable API
 * - Provides debug mode toggle that flows down to GraphDebugOverlay
 *
 * This hook is CHEAP — graphEngine is built once at module load time.
 * The hook just provides reactive wrappers around it.
 */
export function useGraph() {
  const [debugMode, setDebugMode] = useState(false);

  const toggleDebug = useCallback(() => setDebugMode((v) => !v), []);

  // Memoised so components don't re-render on unrelated state changes
  const stats = useMemo(() => graphEngine.getStats(), []);

  const getNodesForFloor = useCallback(
    (floor: number): GraphNode[] => graphEngine.getNodesForFloor(floor),
    []
  );

  const getEdgesForFloor = useCallback(
    (floor: number): GraphEdge[] => graphEngine.getEdgesForFloor(floor),
    []
  );

  const isReachable = useCallback(
    (from: string, to: string): boolean => graphEngine.isReachable(from, to),
    []
  );

  const getNode = useCallback(
    (id: string): GraphNode | undefined => graphEngine.getNode(id),
    []
  );

  const getEdges = useCallback(
    (id: string): GraphEdge[] => graphEngine.getEdges(id),
    []
  );

  return {
    /** True when the debug overlay should be shown */
    debugMode,
    toggleDebug,
    /** Aggregated stats for the debug panel */
    stats,
    getNodesForFloor,
    getEdgesForFloor,
    isReachable,
    getNode,
    getEdges,
  };
}
