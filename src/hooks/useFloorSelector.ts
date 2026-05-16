"use client";

import { useState, useCallback } from "react";
import { FLOORS } from "@/data/floors";
import { FloorData } from "@/types";

/**
 * useFloorSelector — manages which floor is currently displayed.
 *
 * WHY a hook?
 * - Multiple components need the current floor (map, navigation, QR scanner)
 * - Will be upgraded to context/state manager if needed in later phases
 */
export function useFloorSelector(initialFloor: number = 0) {
  const [currentFloorId, setCurrentFloorId] = useState(initialFloor);

  const currentFloor: FloorData = FLOORS[currentFloorId] ?? FLOORS[0];

  const switchFloor = useCallback((floorId: number) => {
    if (floorId >= 0 && floorId < FLOORS.length) {
      setCurrentFloorId(floorId);
    }
  }, []);

  const nextFloor = useCallback(() => {
    setCurrentFloorId((prev) => Math.min(prev + 1, FLOORS.length - 1));
  }, []);

  const prevFloor = useCallback(() => {
    setCurrentFloorId((prev) => Math.max(prev - 1, 0));
  }, []);

  return {
    currentFloor,
    currentFloorId,
    floors: FLOORS,
    switchFloor,
    nextFloor,
    prevFloor,
  };
}
