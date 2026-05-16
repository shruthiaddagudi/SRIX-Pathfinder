/**
 * route.ts — Converts raw A* output into a structured Route object.
 *
 * WHY a separate Route type?
 * The rendering layer (RouteOverlay) needs floor-segmented sub-paths.
 * The voice layer needs human-readable step instructions.
 * The UI panel needs total distance and ETA.
 * Putting all this in one place means each consumer gets what it needs
 * without transforming data in the component.
 */

import { GraphNode } from "@/types";
import { AStarResult } from "./astar";

export interface RouteStep {
  instruction: string;        // "Turn right toward 7104 Faculty"
  nodeId: string;
  floor: number;
  isFloorChange: boolean;
  direction?: string;         // "left" | "right" | "straight" | "up" | "down"
}

export interface FloorSegment {
  floor: number;
  nodes: GraphNode[];
}

export interface Route {
  found: boolean;
  startId: string;
  goalId: string;
  allNodes: GraphNode[];          // full ordered path
  floorSegments: FloorSegment[];  // path split by floor
  steps: RouteStep[];             // human-readable turn-by-turn
  totalDistance: number;          // SVG units
  estimatedMinutes: number;       // rough ETA
}

/** Average walking speed in SVG units per minute (tuned to the map scale) */
const SVG_UNITS_PER_MINUTE = 150;

/**
 * Build a full Route from an A* result.
 */
export function buildRoute(
  result: AStarResult,
  startId: string,
  goalId: string
): Route {
  if (!result.found || result.path.length === 0) {
    return {
      found: false,
      startId,
      goalId,
      allNodes: [],
      floorSegments: [],
      steps: [],
      totalDistance: 0,
      estimatedMinutes: 0,
    };
  }

  const allNodes = result.path;
  const floorSegments = buildFloorSegments(allNodes);
  const steps = buildSteps(allNodes);
  const estimatedMinutes = Math.max(
    1,
    Math.round(result.totalDistance / SVG_UNITS_PER_MINUTE)
  );

  return {
    found: true,
    startId,
    goalId,
    allNodes,
    floorSegments,
    steps,
    totalDistance: result.totalDistance,
    estimatedMinutes,
  };
}

// ─── Floor segments ───────────────────────────────────────────────────────

function buildFloorSegments(nodes: GraphNode[]): FloorSegment[] {
  const segments: FloorSegment[] = [];
  if (nodes.length === 0) return segments;

  let current: FloorSegment = { floor: nodes[0].floor, nodes: [nodes[0]] };

  for (let i = 1; i < nodes.length; i++) {
    if (nodes[i].floor === current.floor) {
      current.nodes.push(nodes[i]);
    } else {
      segments.push(current);
      current = { floor: nodes[i].floor, nodes: [nodes[i]] };
    }
  }
  segments.push(current);
  return segments;
}

// ─── Step instructions ────────────────────────────────────────────────────

const FLOOR_NAMES = ["Ground Floor", "First Floor", "Second Floor"];

function buildSteps(nodes: GraphNode[]): RouteStep[] {
  if (nodes.length === 0) return [];

  const steps: RouteStep[] = [];

  // Start instruction
  steps.push({
    instruction: `Start at ${nodes[0].label}`,
    nodeId: nodes[0].id,
    floor: nodes[0].floor,
    isFloorChange: false,
  });

  for (let i = 1; i < nodes.length; i++) {
    const prev = nodes[i - 1];
    const curr = nodes[i];
    const isFloorChange = prev.floor !== curr.floor;

    if (isFloorChange) {
      const goingUp = curr.floor > prev.floor;
      steps.push({
        instruction: `Take the stairs ${goingUp ? "up" : "down"} to the ${FLOOR_NAMES[curr.floor]}`,
        nodeId: curr.id,
        floor: curr.floor,
        isFloorChange: true,
        direction: goingUp ? "up" : "down",
      });
      continue;
    }

    // Only emit a step at named locations (rooms, offices, junctions with labels)
    // Skip intermediate corridor junction hops (they'd be too noisy)
    const isNamedStop =
      curr.type !== "junction" || i === nodes.length - 1;

    if (isNamedStop) {
      const direction = getDirection(prev, curr, nodes[i - 2]);
      steps.push({
        instruction: buildInstruction(curr, direction, i === nodes.length - 1),
        nodeId: curr.id,
        floor: curr.floor,
        isFloorChange: false,
        direction,
      });
    }
  }

  return steps;
}

function buildInstruction(
  node: GraphNode,
  direction: string | undefined,
  isGoal: boolean
): string {
  if (isGoal) return `Arrive at ${node.label}`;

  switch (direction) {
    case "left":  return `Turn left toward ${node.label}`;
    case "right": return `Turn right toward ${node.label}`;
    default:      return `Continue to ${node.label}`;
  }
}

/**
 * Rough direction estimation based on angle change between two segments.
 * Not compass-accurate — just relative to the approach direction.
 */
function getDirection(
  prev: GraphNode,
  curr: GraphNode,
  beforePrev?: GraphNode
): string {
  if (!beforePrev) return "straight";

  // Vector of approach
  const ax = prev.position.x - beforePrev.position.x;
  const ay = prev.position.y - beforePrev.position.y;
  // Vector to next
  const bx = curr.position.x - prev.position.x;
  const by = curr.position.y - prev.position.y;

  // Cross product sign → left or right
  const cross = ax * by - ay * bx;
  // Dot product → angle magnitude
  const dot = ax * bx + ay * by;

  if (Math.abs(cross) < 0.1 * (Math.hypot(ax, ay) * Math.hypot(bx, by))) {
    return "straight";
  }
  return cross < 0 ? "right" : "left";
}