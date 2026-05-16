/**
 * astar.ts — A* pathfinding on the SRIX navigation graph.
 *
 * WHY A*?
 * Dijkstra expands in all directions equally. A* uses a heuristic
 * (Euclidean distance to goal) to prefer nodes that are physically
 * closer to the destination, so it explores far fewer nodes.
 *
 * f(n) = g(n) + h(n)
 *   g = cost from start to n (actual walking distance so far)
 *   h = estimated cost from n to goal (straight-line distance)
 *
 * Because our heuristic never overestimates real cost, A* is
 * guaranteed to find the optimal path (admissible heuristic).
 *
 * MULTI-FLOOR:
 * Stair nodes have a +200 weight penalty in the graph. A* treats them
 * just like any other node — the penalty naturally discourages using
 * stairs unless the destination is on a different floor.
 */

import { GraphNode, GraphEdge } from "@/types";
import { graphEngine } from "@/data/graphs/builder";

// ─── Min-Heap (priority queue) ────────────────────────────────────────────

interface HeapItem {
  id: string;
  f: number; // priority (lower = better)
}

class MinHeap {
  private data: HeapItem[] = [];

  push(item: HeapItem) {
    this.data.push(item);
    this._bubbleUp(this.data.length - 1);
  }

  pop(): HeapItem | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this._sinkDown(0);
    }
    return top;
  }

  get size() {
    return this.data.length;
  }

  private _bubbleUp(i: number) {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.data[parent].f <= this.data[i].f) break;
      [this.data[parent], this.data[i]] = [this.data[i], this.data[parent]];
      i = parent;
    }
  }

  private _sinkDown(i: number) {
    const n = this.data.length;
    while (true) {
      let smallest = i;
      const l = 2 * i + 1;
      const r = 2 * i + 2;
      if (l < n && this.data[l].f < this.data[smallest].f) smallest = l;
      if (r < n && this.data[r].f < this.data[smallest].f) smallest = r;
      if (smallest === i) break;
      [this.data[smallest], this.data[i]] = [this.data[i], this.data[smallest]];
      i = smallest;
    }
  }
}

// ─── Heuristic ────────────────────────────────────────────────────────────

/**
 * Euclidean distance between two nodes' SVG positions.
 * For cross-floor nodes we add a large constant (300) representing
 * the "conceptual distance" of a floor change.
 */
function heuristic(a: GraphNode, b: GraphNode): number {
  const dx = a.position.x - b.position.x;
  const dy = a.position.y - b.position.y;
  const floorPenalty = Math.abs(a.floor - b.floor) * 300;
  return Math.sqrt(dx * dx + dy * dy) + floorPenalty;
}

// ─── A* ───────────────────────────────────────────────────────────────────

export interface AStarResult {
  found: boolean;
  path: GraphNode[]; // ordered from start → goal
  totalDistance: number;
}

export function aStar(startId: string, goalId: string): AStarResult {
  const start = graphEngine.getNode(startId);
  const goal = graphEngine.getNode(goalId);

  if (!start || !goal) {
    return { found: false, path: [], totalDistance: 0 };
  }

  if (startId === goalId) {
    return { found: true, path: [start], totalDistance: 0 };
  }

  // g[id] = cheapest known cost to reach this node
  const g = new Map<string, number>();
  g.set(startId, 0);

  // cameFrom[id] = which node we came from to reach this node
  const cameFrom = new Map<string, string>();

  // Open set — nodes to evaluate
  const open = new MinHeap();
  open.push({ id: startId, f: heuristic(start, goal) });

  // Closed set — nodes already fully evaluated
  const closed = new Set<string>();

  while (open.size > 0) {
    const current = open.pop()!;

    if (current.id === goalId) {
      // Reconstruct path
      const path: GraphNode[] = [];
      let node: string | undefined = goalId;
      while (node) {
        path.unshift(graphEngine.getNode(node)!);
        node = cameFrom.get(node);
      }
      const totalDistance = g.get(goalId) ?? 0;
      return { found: true, path, totalDistance };
    }

    if (closed.has(current.id)) continue;
    closed.add(current.id);

    const edges = graphEngine.getEdges(current.id);
    for (const edge of edges) {
      if (closed.has(edge.to)) continue;

      const tentativeG = (g.get(current.id) ?? Infinity) + edge.weight;
      const knownG = g.get(edge.to) ?? Infinity;

      if (tentativeG < knownG) {
        g.set(edge.to, tentativeG);
        cameFrom.set(edge.to, current.id);

        const neighbor = graphEngine.getNode(edge.to);
        if (neighbor) {
          const f = tentativeG + heuristic(neighbor, goal);
          open.push({ id: edge.to, f });
        }
      }
    }
  }

  // No path found
  return { found: false, path: [], totalDistance: 0 };
}