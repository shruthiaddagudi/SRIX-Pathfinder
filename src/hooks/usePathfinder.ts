/**
 * usePathfinder — React interface to the A* engine.
 *
 * WHY a hook?
 * - Keeps page.tsx clean (no pathfinding logic there)
 * - Centralises state: origin, destination, computed route
 * - Provides clearRoute() for resetting navigation
 * - Memoises the route so it only recomputes when origin/dest change
 *
 * USAGE:
 *   const { origin, setOrigin, destination, setDestination,
 *           route, clearRoute } = usePathfinder();
 */

"use client";

import { useState, useMemo, useCallback } from "react";
import { aStar, buildRoute } from "@/lib/pathfinding";
import type { Route } from "@/lib/pathfinding";
import { log } from "@/lib/logger";

export interface PathfinderState {
  originId: string | null;
  destinationId: string | null;
  route: Route | null;
  isComputing: boolean;
  setOrigin: (id: string | null) => void;
  setDestination: (id: string | null) => void;
  clearRoute: () => void;
}

export function usePathfinder(): PathfinderState {
  const [originId, setOriginId] = useState<string | null>(null);
  const [destinationId, setDestinationId] = useState<string | null>(null);
  const [isComputing, setIsComputing] = useState(false);

  // Route is derived from origin + destination — recomputes automatically
  const route = useMemo<Route | null>(() => {
    if (!originId || !destinationId) return null;
    if (originId === destinationId) return null;

    setIsComputing(true);
    const result = aStar(originId, destinationId);
    const r = buildRoute(result, originId, destinationId);
    setIsComputing(false);

    log("info", "route:computed", {
      from: originId,
      to: destinationId,
      found: r.found,
      steps: r.steps.length,
      distance: r.totalDistance,
    });

    return r;
  }, [originId, destinationId]);

  const setOrigin = useCallback((id: string | null) => {
    setOriginId(id);
  }, []);

  const setDestination = useCallback((id: string | null) => {
    setDestinationId(id);
  }, []);

  const clearRoute = useCallback(() => {
    setOriginId(null);
    setDestinationId(null);
  }, []);

  return {
    originId,
    destinationId,
    route,
    isComputing,
    setOrigin,
    setDestination,
    clearRoute,
  };
}