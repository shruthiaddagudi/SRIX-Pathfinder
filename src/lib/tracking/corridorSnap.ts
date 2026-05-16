import { FLOOR_MAP_DATA } from "@/data/map-data";

export interface Point2D {
  x: number;
  y: number;
}

export interface SnapResult {
  point: Point2D;
  segmentId: string;
  distance: number;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function snapToCorridors(
  position: Point2D,
  floor: number,
  snapThreshold = 40
): SnapResult | null {
  const floorData = FLOOR_MAP_DATA[floor];
  if (!floorData) {
    return null;
  }

  let closest: SnapResult | null = null;

  for (const segment of floorData.corridors) {
    const ax = segment.x1;
    const ay = segment.y1;
    const bx = segment.x2 - ax;
    const by = segment.y2 - ay;
    const apx = position.x - ax;
    const apy = position.y - ay;
    const denominator = bx * bx + by * by;
    const t = denominator === 0 ? 0 : clamp((apx * bx + apy * by) / denominator, 0, 1);
    const snappedX = ax + bx * t;
    const snappedY = ay + by * t;
    const distance = Math.hypot(position.x - snappedX, position.y - snappedY);

    if (distance < snapThreshold && (closest === null || distance < closest.distance)) {
      closest = {
        point: { x: snappedX, y: snappedY },
        segmentId: segment.id,
        distance,
      };
    }
  }

  return closest;
}
