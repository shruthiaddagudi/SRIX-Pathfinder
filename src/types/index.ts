// ============================================
// SRIX Pathfinder — Core Type Definitions
// ============================================
// These types are the foundation for ALL phases.
// Every module references these shared types.

/** A 2D point on the SVG coordinate system */
export interface Point {
  x: number;
  y: number;
}

/** Types of locations in the building */
export type NodeType =
  | "room"
  | "corridor"
  | "junction"
  | "stairs"
  | "elevator"
  | "entrance"
  | "washroom"
  | "office"
  | "qr-checkpoint";

/** A single node in the navigation graph */
export interface GraphNode {
  id: string;
  label: string;
  type: NodeType;
  floor: number;
  position: Point; // SVG coordinates
  connectedTo: string[]; // IDs of adjacent nodes
}

/** An edge between two graph nodes */
export interface GraphEdge {
  from: string;
  to: string;
  weight: number; // distance in SVG units
  isStairs?: boolean;
  isElevator?: boolean;
}

/** Floor metadata */
export interface FloorData {
  id: number;
  name: string;
  label: string;
  svgPath: string; // path to SVG in public/
}

/** A room or point of interest on the map */
export interface MapRoom {
  id: string;
  label: string;
  type: NodeType;
  /** Center position of the room on the SVG (for labels & graph nodes) */
  center: Point;
  /** SVG path or rect for the room boundary (optional, for highlighting) */
  svgElementId?: string;
}

/** User's estimated position */
export interface UserPosition {
  point: Point;
  floor: number;
  heading: number; // degrees, 0 = north
  accuracy: number; // confidence radius
  timestamp: number;
  source: "qr" | "pdr" | "manual" | "initial";
}
