"use client";

import { useEffect, useRef, useState } from "react";
import type { Route } from "@/lib/pathfinding";
import type { Point } from "@/types";
import { headingFromDelta } from "@/lib/navigation/routeGeometry";

interface SimulatedPositionState {
  position: Point | null;
  currentFloor: number;
  heading: number;
  isComplete: boolean;
  currentNodeIndex: number;
}

const SEGMENT_DURATION_MS = 2000;

function getHeadingDegrees(from: Point, to: Point): number {
  return headingFromDelta(to.x - from.x, to.y - from.y);
}

export default function useSimulatedPosition(
  route: Route | null,
  isSimulating: boolean
): SimulatedPositionState {
  const [position, setPosition] = useState<Point | null>(null);
  const [currentFloor, setCurrentFloor] = useState<number>(route?.allNodes[0]?.floor ?? 0);
  const [heading, setHeading] = useState<number>(0);
  const [isComplete, setIsComplete] = useState(false);
  const [currentNodeIndex, setCurrentNodeIndex] = useState(0);

  const frameRef = useRef<number | null>(null);
  const segmentStartTimeRef = useRef<number | null>(null);
  const currentIndexRef = useRef<number>(0);

  useEffect(() => {
    const firstNode = route?.allNodes[0];
    const floor = firstNode?.floor ?? 0;

    currentIndexRef.current = 0;
    segmentStartTimeRef.current = null;
    setCurrentNodeIndex(0);
    setCurrentFloor(floor);
    setHeading(0);
    setIsComplete(false);
    setPosition(isSimulating && firstNode ? { ...firstNode.position } : null);
  }, [route, isSimulating]);

  useEffect(() => {
    if (!isSimulating || !route || route.allNodes.length < 2) {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
      setPosition(null);
      return;
    }

    const nodes = route.allNodes;
    const animate = (timestamp: number) => {
      if (frameRef.current === null) return;

      if (segmentStartTimeRef.current === null) {
        segmentStartTimeRef.current = timestamp;
      }

      const segmentStart = nodes[currentIndexRef.current];
      const segmentEnd = nodes[currentIndexRef.current + 1];
      if (!segmentStart || !segmentEnd) {
        setIsComplete(true);
        setPosition(nodes[nodes.length - 1]?.position ?? null);
        frameRef.current = null;
        return;
      }

      const elapsed = timestamp - segmentStartTimeRef.current;
      const progress = Math.min(1, elapsed / SEGMENT_DURATION_MS);
      const nextPosition: Point = {
        x: segmentStart.position.x + (segmentEnd.position.x - segmentStart.position.x) * progress,
        y: segmentStart.position.y + (segmentEnd.position.y - segmentStart.position.y) * progress,
      };

      setPosition(nextPosition);
      setCurrentFloor(segmentStart.floor);
      setHeading(getHeadingDegrees(segmentStart.position, segmentEnd.position));
      setCurrentNodeIndex(currentIndexRef.current);

      if (progress >= 1) {
        const nextIndex = currentIndexRef.current + 1;
        currentIndexRef.current = nextIndex;
        segmentStartTimeRef.current = null;
        setCurrentNodeIndex(nextIndex);

        const reachedNode = nodes[nextIndex];
        if (reachedNode) {
          setCurrentFloor(reachedNode.floor);
          setPosition({ ...reachedNode.position });
        }

        if (nextIndex >= nodes.length - 1) {
          setIsComplete(true);
          frameRef.current = null;
          return;
        }
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [isSimulating, route]);

  return {
    position,
    currentFloor,
    heading,
    isComplete,
    currentNodeIndex,
  };
}
