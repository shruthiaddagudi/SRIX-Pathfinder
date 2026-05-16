import { GraphNode, GraphEdge, NodeType } from "@/types";
import { FLOOR_MAP_DATA, FloorMapData } from "../map-data";
import { distance } from "@/lib/utils";

/**
 * GraphEngine — Phase 3
 *
 * Converts the static visual floor plans from map-data.ts into a weighted,
 * undirected graph for A* pathfinding.
 *
 * ── RULES ──────────────────────────────────────────────────────────────────
 * 1. Corridor junctions → GraphNodes (type: "junction")
 * 2. Rooms              → GraphNodes (type: their room type)
 *    └─ connected ONLY to their doorNode junction, not to other rooms directly
 * 3. Stairs             → GraphNodes (type: "stairs")
 *    └─ connected to their junction on the same floor
 *    └─ connected cross-floor to stairs on adjacent floors (with penalty weight)
 * 4. Corridor segments  → GraphEdges with weight = Euclidean distance
 *
 * ── WHY this structure? ─────────────────────────────────────────────────────
 * - Rooms don't connect to each other directly — you always walk through the
 *   corridor. This forces paths through real walkable space.
 * - Stairs have a +200 weight penalty so A* only uses them when necessary.
 * - The graph is undirected (every edge has a reverse copy) so A* can go
 *   from any node to any other node.
 * - Multi-floor routing works by treating stair nodes as cross-floor bridges.
 */

export interface GraphStats {
  totalNodes: number;
  totalEdges: number;
  nodesByFloor: Record<number, number>;
  nodesByType: Record<string, number>;
  stairConnections: { from: string; to: string; weight: number }[];
  warnings: string[];
}

export class GraphEngine {
  nodes: Map<string, GraphNode> = new Map();
  /** adjacency list: nodeId → outgoing edges */
  edges: Map<string, GraphEdge[]> = new Map();

  private warnings: string[] = [];

  constructor() {
    this.buildGraph();
    if (process.env.NODE_ENV === "development") {
      console.log("[GraphEngine] Built at", Date.now());
    }
  }

  // ─── Build ────────────────────────────────────────────────────────────────

  private addNode(node: GraphNode) {
    this.nodes.set(node.id, node);
    if (!this.edges.has(node.id)) {
      this.edges.set(node.id, []);
    }
  }

  private addEdge(
    from: string,
    to: string,
    weight: number,
    isStairs = false
  ) {
    // Guard: both nodes must exist
    if (!this.nodes.has(from)) {
      this.warnings.push(`addEdge: node "${from}" doesn't exist yet`);
    }
    if (!this.nodes.has(to)) {
      this.warnings.push(`addEdge: node "${to}" doesn't exist yet`);
    }

    if (!this.edges.has(from)) this.edges.set(from, []);
    if (!this.edges.has(to))   this.edges.set(to,   []);

    // Undirected — add both directions
    this.edges.get(from)!.push({ from, to,   weight, isStairs });
    this.edges.get(to)!  .push({ from: to, to: from, weight, isStairs });
  }

  private buildGraph() {
    Object.values(FLOOR_MAP_DATA).forEach((floorData) =>
      this.processFloor(floorData)
    );
    this.connectStairs();

    if (this.warnings.length > 0) {
      console.warn("[GraphEngine] Build warnings:", this.warnings);
    }
  }

  private processFloor(floorData: FloorMapData) {
    const floor = floorData.floorId;

    // ── A. Junction nodes ────────────────────────────────────────────────────
    floorData.junctions.forEach((j) => {
      this.addNode({
        id: j.id,
        label: j.label ?? `Junction ${j.id}`,
        type: "junction",
        floor,
        position: { x: j.x, y: j.y },
        connectedTo: [],
      });
    });

    // ── B. Corridor edges (junction ↔ junction) ───────────────────────────────
    floorData.corridors.forEach((c) => {
      const dist = distance(c.x1, c.y1, c.x2, c.y2);
      this.addEdge(c.fromJunction, c.toJunction, dist);
    });

    // ── C. Room nodes (connected only to their doorNode) ──────────────────────
    floorData.rooms.forEach((r) => {
      this.addNode({
        id: r.id,
        label: r.label.replace(/\n/g, " "),
        type: r.type as NodeType,
        floor,
        position: { x: r.cx, y: r.cy },
        connectedTo: [],
      });

      const junc = floorData.junctions.find((j) => j.id === r.doorNode);
      if (junc) {
        const dist = distance(r.cx, r.cy, junc.x, junc.y);
        this.addEdge(r.id, r.doorNode, dist);
      } else {
        this.warnings.push(
          `Room "${r.id}" references doorNode "${r.doorNode}" which doesn't exist`
        );
      }
    });

    // ── D. Stair nodes (connected to their junction on this floor) ────────────
    floorData.stairs.forEach((s) => {
      this.addNode({
        id: s.id,
        label: s.label,
        type: "stairs",
        floor,
        position: { x: s.nodeX, y: s.nodeY },
        connectedTo: [],
      });

      const junc = floorData.junctions.find((j) => j.id === s.connectsTo);
      if (junc) {
        const dist = distance(s.nodeX, s.nodeY, junc.x, junc.y);
        this.addEdge(s.id, s.connectsTo, dist);
      } else {
        this.warnings.push(
          `Stairs "${s.id}" references junction "${s.connectsTo}" which doesn't exist`
        );
      }
    });
  }

  /**
   * Cross-floor stair connections.
   * Weight 200 = ~one floor climb penalty (biases A* to stay on same floor
   * unless the destination actually requires a floor change).
   */
  private connectStairs() {
    const stairPairs: [string, string][] = [
      ["g-stairs",  "f1-stairs"],  // Ground ↔ First
      ["f1-stairs", "f2-stairs"],  // First  ↔ Second
    ];

    stairPairs.forEach(([a, b]) => {
      if (this.nodes.has(a) && this.nodes.has(b)) {
        this.addEdge(a, b, 200, true);
      } else {
        if (!this.nodes.has(a)) this.warnings.push(`connectStairs: "${a}" not found`);
        if (!this.nodes.has(b)) this.warnings.push(`connectStairs: "${b}" not found`);
      }
    });
  }

  // ─── Query API (used by A* and debug overlay) ─────────────────────────────

  getNode(id: string): GraphNode | undefined {
    return this.nodes.get(id);
  }

  getEdges(nodeId: string): GraphEdge[] {
    return this.edges.get(nodeId) ?? [];
  }

  getAllNodes(): GraphNode[] {
    return Array.from(this.nodes.values());
  }

  getNodesForFloor(floor: number): GraphNode[] {
    return this.getAllNodes().filter((n) => n.floor === floor);
  }

  getEdgesForFloor(floor: number): GraphEdge[] {
    return this.getNodesForFloor(floor).flatMap((n) =>
      (this.edges.get(n.id) ?? []).filter(
        (e) => (this.nodes.get(e.to)?.floor ?? -1) === floor
      )
    );
  }

  /**
   * Check whether two nodes are reachable from each other.
   * Used to validate graph connectivity (no isolated subgraphs).
   */
  isReachable(fromId: string, toId: string): boolean {
    if (!this.nodes.has(fromId) || !this.nodes.has(toId)) return false;
    const visited = new Set<string>();
    const queue = [fromId];
    while (queue.length > 0) {
      const curr = queue.shift()!;
      if (curr === toId) return true;
      if (visited.has(curr)) continue;
      visited.add(curr);
      this.getEdges(curr).forEach((e) => {
        if (!visited.has(e.to)) queue.push(e.to);
      });
    }
    return false;
  }

  /** Stats object for the debug overlay */
  getStats(): GraphStats {
    const nodesByFloor: Record<number, number> = {};
    const nodesByType: Record<string, number> = {};

    this.getAllNodes().forEach((n) => {
      nodesByFloor[n.floor] = (nodesByFloor[n.floor] ?? 0) + 1;
      nodesByType[n.type]   = (nodesByType[n.type]   ?? 0) + 1;
    });

    // Count unique edges (each is stored twice)
    const edgeSet = new Set<string>();
    this.edges.forEach((edges) =>
      edges.forEach((e) => {
        const key = [e.from, e.to].sort().join("|");
        edgeSet.add(key);
      })
    );

    const stairConnections: GraphStats["stairConnections"] = [];
    ["g-stairs", "f1-stairs", "f2-stairs"].forEach((id) => {
      this.getEdges(id)
        .filter((e) => e.isStairs)
        .forEach((e) => {
          stairConnections.push({ from: e.from, to: e.to, weight: e.weight });
        });
    });

    return {
      totalNodes: this.nodes.size,
      totalEdges: edgeSet.size,
      nodesByFloor,
      nodesByType,
      stairConnections,
      warnings: [...this.warnings],
    };
  }
}

/** App-wide singleton — instantiated once, shared everywhere */
export const graphEngine = new GraphEngine();
