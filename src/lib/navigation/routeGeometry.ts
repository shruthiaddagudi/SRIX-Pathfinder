import type { Point } from "@/types";
import type { Route } from "@/lib/pathfinding";
import type { GraphNode } from "@/types";

/**
 * Heading convention matches `computePDRStep` in `pdr.ts`:
 * 0° walks toward decreasing Y (screen-up); 90° toward +X (screen-right).
 */
export function headingFromDelta(dx: number, dy: number): number {
  const deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
  return ((deg % 360) + 360) % 360;
}

export function bearingToPoint(from: Point, to: Point): number {
  return headingToPoint(from, to);
}

/** Same as bearingToPoint — alias for voice / debug strings */
export function headingToPoint(from: Point, to: Point): number {
  return headingFromDelta(to.x - from.x, to.y - from.y);
}

export function angularDifferenceDegrees(a: number, b: number): number {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

export function findRouteNode(route: Route, nodeId: string): GraphNode | undefined {
  return route.allNodes.find((n) => n.id === nodeId);
}

export function distanceBetween(a: Point, b: Point): number {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
