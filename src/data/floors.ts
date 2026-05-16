import { FloorData } from "@/types";

/**
 * Floor metadata registry.
 * 
 * WHY: Central source of truth for all floors in the building.
 * Every component that needs floor info imports from here.
 * SVG files live in public/maps/ and are loaded via <image> or fetch.
 */
export const FLOORS: FloorData[] = [
  {
    id: 0,
    name: "ground",
    label: "Ground Floor",
    svgPath: "/maps/ground-floor.svg",
  },
  {
    id: 1,
    name: "first",
    label: "First Floor",
    svgPath: "/maps/first-floor.svg",
  },
  {
    id: 2,
    name: "second",
    label: "Second Floor",
    svgPath: "/maps/second-floor.svg",
  },
];

/** App-wide constants */
export const MAP_CONFIG = {
  /** SVG viewBox dimensions — all maps should use this coordinate space */
  WIDTH: 1200,
  HEIGHT: 800,
  /** Zoom limits */
  MIN_ZOOM: 0.5,
  MAX_ZOOM: 4,
  /** How fast pinch/scroll zooms */
  ZOOM_SENSITIVITY: 0.001,
};
