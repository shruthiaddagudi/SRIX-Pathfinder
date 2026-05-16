/**
 * map-data.ts — Single source of truth for all floor map data.
 *
 * Coordinate system: 1200 × 800 SVG viewBox.
 * Building outer wall sits at x:60, y:50, w:1080, h:700 on every floor.
 *
 * ROOM POSITIONS: Manually mapped from the actual SRIX Block floor-plan images.
 *
 * GRAPH CONTRACT (for Phase 3):
 * - Every corridor intersection MUST have a junction node.
 * - Every corridor segment connects exactly two junctions.
 * - Every room connects to the graph via its `doorNode` junction.
 * - Stairs connect floors via cross-floor edges in the graph builder.
 */

export interface RoomData {
  id: string;
  label: string;
  type: string;
  x: number; y: number;
  w: number; h: number;
  fontSize?: number;
  /** Center point — becomes the graph node for this room */
  cx: number; cy: number;
  /** Which junction this room's door opens onto */
  doorNode: string;
}

export interface CorridorSegment {
  id: string;
  x1: number; y1: number;
  x2: number; y2: number;
  fromJunction: string;
  toJunction: string;
}

export interface JunctionNode {
  id: string;
  x: number; y: number;
  label?: string;
}

export interface StairData {
  id: string;
  x: number; y: number;
  w: number; h: number;
  label: string;
  nodeX: number; nodeY: number;
  connectsTo: string;
}

export interface QRPoint {
  id: string;
  x: number; y: number;
  junctionId: string;
}

export interface EntranceData {
  id: string;
  x: number; y: number;
  label: string;
  isMain?: boolean;
}

export interface CenterFeature {
  x: number; y: number; w: number; h: number;
  label: string; fill: string; stroke: string; textColor: string;
}

export interface FloorMapData {
  floorId: number;
  building: { x: number; y: number; w: number; h: number };
  rooms: RoomData[];
  corridors: CorridorSegment[];
  junctions: JunctionNode[];
  stairs: StairData[];
  qrPoints: QRPoint[];
  entrances: EntranceData[];
  centerFeature?: CenterFeature;
}

// ═══════════════════════════════════════════════════════════════════════════
// GROUND FLOOR
// Layout: U-shaped corridor around central Lawn.
// North row: Handwash, Boys WC, Entry 3, Makers Zone
// East col:  Girls WC, Director of Admissions
// South row: Faculty Dining, Entry 1, Admissions Office, Entry 2
// West col:  Canteen
// Center:    Lawn (open courtyard), Steps on east side
// ═══════════════════════════════════════════════════════════════════════════
const groundFloor: FloorMapData = {
  floorId: 0,
  building: { x: 60, y: 50, w: 1080, h: 700 },

  // Corridor junctions — intersections where navigation decisions happen
  junctions: [
    { id: "g-j-nw",      x: 270, y: 175, label: "NW Corner" },
    { id: "g-j-n-mid",   x: 510, y: 175, label: "North Mid (Entry 3)" },
    { id: "g-j-ne",      x: 760, y: 175, label: "NE Corner" },
    { id: "g-j-w-mid",   x: 270, y: 395, label: "West Mid (Canteen)" },
    { id: "g-j-e-mid",   x: 760, y: 395, label: "East Mid (Admissions Dir.)" },
    { id: "g-j-e-stair", x: 760, y: 530, label: "East Stair Landing" },
    { id: "g-j-sw",      x: 270, y: 615, label: "SW Corner" },
    { id: "g-j-s-mid",   x: 510, y: 615, label: "South Mid (Admissions)" },
    { id: "g-j-se",      x: 760, y: 615, label: "SE Corner" },
  ],

  corridors: [
    // North corridor (west → entry3 → east)
    { id: "g-c-n1", x1: 270, y1: 175, x2: 510, y2: 175, fromJunction: "g-j-nw",    toJunction: "g-j-n-mid"   },
    { id: "g-c-n2", x1: 510, y1: 175, x2: 760, y2: 175, fromJunction: "g-j-n-mid", toJunction: "g-j-ne"      },
    // West corridor (north → canteen → south)
    { id: "g-c-w1", x1: 270, y1: 175, x2: 270, y2: 395, fromJunction: "g-j-nw",    toJunction: "g-j-w-mid"   },
    { id: "g-c-w2", x1: 270, y1: 395, x2: 270, y2: 615, fromJunction: "g-j-w-mid", toJunction: "g-j-sw"      },
    // East corridor (north → admissions dir → stair → south)
    { id: "g-c-e1", x1: 760, y1: 175, x2: 760, y2: 395, fromJunction: "g-j-ne",       toJunction: "g-j-e-mid"   },
    { id: "g-c-e2", x1: 760, y1: 395, x2: 760, y2: 530, fromJunction: "g-j-e-mid",    toJunction: "g-j-e-stair" },
    { id: "g-c-e3", x1: 760, y1: 530, x2: 760, y2: 615, fromJunction: "g-j-e-stair", toJunction: "g-j-se"      },
    // South corridor (west → admissions → east)
    { id: "g-c-s1", x1: 270, y1: 615, x2: 510, y2: 615, fromJunction: "g-j-sw",    toJunction: "g-j-s-mid"   },
    { id: "g-c-s2", x1: 510, y1: 615, x2: 760, y2: 615, fromJunction: "g-j-s-mid", toJunction: "g-j-se"      },
  ],

  rooms: [
    // ── North row (top) ──
    { id: "g-handwash",   label: "Handwash",              type: "room",     x: 70,  y: 60,  w: 175, h: 95,  cx: 157,  cy: 107,  doorNode: "g-j-nw"    },
    { id: "g-boys-wc",    label: "Boys\nWashroom",         type: "washroom", x: 265, y: 60,  w: 175, h: 95,  cx: 352,  cy: 107,  doorNode: "g-j-nw"    },
    { id: "g-entry3",     label: "Entry 3",               type: "entrance", x: 460, y: 60,  w: 175, h: 95,  cx: 547,  cy: 107,  doorNode: "g-j-n-mid" },
    { id: "g-makers",     label: "Makers Zone",           type: "lab",      x: 655, y: 60,  w: 175, h: 95,  cx: 742,  cy: 107,  doorNode: "g-j-ne"    },
    // ── East column ──
    { id: "g-girls-wc",   label: "Girls\nWashroom",        type: "washroom", x: 790, y: 60,  w: 180, h: 125, cx: 880,  cy: 122,  doorNode: "g-j-ne"    },
    { id: "g-drinking",   label: "Drinking\nWater",        type: "room",     x: 790, y: 200, w: 80,  h: 60,  cx: 830,  cy: 230,  fontSize: 8, doorNode: "g-j-e-mid" },
    { id: "g-director",   label: "Director of\nAdmissions",type: "office",   x: 790, y: 280, w: 180, h: 195, cx: 880,  cy: 377,  fontSize: 9, doorNode: "g-j-e-mid" },
    // ── South row ──
    { id: "g-faculty",    label: "Faculty\nDining",        type: "canteen",  x: 70,  y: 635, w: 175, h: 105, cx: 157,  cy: 687,  doorNode: "g-j-sw"    },
    { id: "g-entry1",     label: "Entry 1",               type: "entrance", x: 265, y: 635, w: 175, h: 105, cx: 352,  cy: 687,  doorNode: "g-j-sw"    },
    { id: "g-admissions", label: "Admissions\nOffice",     type: "office",   x: 460, y: 635, w: 175, h: 105, cx: 547,  cy: 687,  doorNode: "g-j-s-mid" },
    { id: "g-entry2",     label: "Entry 2",               type: "entrance", x: 655, y: 635, w: 175, h: 105, cx: 742,  cy: 687,  doorNode: "g-j-se"    },
    // ── West column ──
    { id: "g-canteen",    label: "Canteen",               type: "canteen",  x: 70,  y: 250, w: 175, h: 240, cx: 157,  cy: 370,  doorNode: "g-j-w-mid" },
  ],

  // Central courtyard lawn
  centerFeature: {
    x: 300, y: 200, w: 430, h: 380,
    label: "LAWN",
    fill: "rgba(34,197,94,0.07)",
    stroke: "rgba(34,197,94,0.22)",
    textColor: "rgba(34,197,94,0.45)",
  },

  stairs: [
    {
      id: "g-stairs", x: 700, y: 480, w: 65, h: 110,
      label: "STEPS", nodeX: 732, nodeY: 535, connectsTo: "g-j-e-stair",
    },
  ],

  qrPoints: [
    { id: "g-qr-nw",     x: 270, y: 175, junctionId: "g-j-nw"      },
    { id: "g-qr-ne",     x: 760, y: 175, junctionId: "g-j-ne"      },
    { id: "g-qr-sw",     x: 270, y: 615, junctionId: "g-j-sw"      },
    { id: "g-qr-se",     x: 760, y: 615, junctionId: "g-j-se"      },
    { id: "g-qr-stairs", x: 732, y: 535, junctionId: "g-j-e-stair" },
    { id: "g-qr-entry3", x: 510, y: 175, junctionId: "g-j-n-mid"   },
  ],

  entrances: [
    { id: "g-ent-main", x: 352, y: 752, label: "MAIN ENTRY", isMain: true },
    { id: "g-ent-2",    x: 742, y: 752, label: "ENTRY 2" },
    { id: "g-ent-3",    x: 547, y: 48,  label: "ENTRY 3" },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════
// FIRST FLOOR
// Layout: Rectangular with rooms around the perimeter.
// North:  International Affairs, 7107 Auditorium, 7106 IEP Classroom, 7105 Ideation
// West:   Training & Placements Officer Cabin (mid)
// East:   7104 Faculty, 7103 Faculty
// South:  7101 CSSP Office, 7102 Branding Design
// Center: Open area + Stairs
// ═══════════════════════════════════════════════════════════════════════════
const firstFloor: FloorMapData = {
  floorId: 1,
  building: { x: 60, y: 50, w: 1080, h: 700 },

  junctions: [
    { id: "f1-j-nw",    x: 300, y: 260, label: "NW Junction" },
    { id: "f1-j-ne",    x: 790, y: 260, label: "NE Junction" },
    { id: "f1-j-w-mid", x: 300, y: 410, label: "West Mid (TPO)" },
    { id: "f1-j-center",x: 570, y: 410, label: "Center (Stairs)" },
    { id: "f1-j-e-mid", x: 790, y: 410, label: "East Mid (Faculty)" },
    { id: "f1-j-sw",    x: 300, y: 570, label: "SW Junction" },
    { id: "f1-j-se",    x: 790, y: 570, label: "SE Junction" },
  ],

  corridors: [
    // North corridor
    { id: "f1-c-n",   x1: 300, y1: 260, x2: 790, y2: 260, fromJunction: "f1-j-nw",    toJunction: "f1-j-ne"     },
    // West corridor (north → tpo → south)
    { id: "f1-c-w1",  x1: 300, y1: 260, x2: 300, y2: 410, fromJunction: "f1-j-nw",    toJunction: "f1-j-w-mid"  },
    { id: "f1-c-w2",  x1: 300, y1: 410, x2: 300, y2: 570, fromJunction: "f1-j-w-mid", toJunction: "f1-j-sw"     },
    // East corridor (north → faculty → south)
    { id: "f1-c-e1",  x1: 790, y1: 260, x2: 790, y2: 410, fromJunction: "f1-j-ne",    toJunction: "f1-j-e-mid"  },
    { id: "f1-c-e2",  x1: 790, y1: 410, x2: 790, y2: 570, fromJunction: "f1-j-e-mid", toJunction: "f1-j-se"     },
    // South corridor
    { id: "f1-c-s",   x1: 300, y1: 570, x2: 790, y2: 570, fromJunction: "f1-j-sw",    toJunction: "f1-j-se"     },
    // Mid horizontal (west → stairs → east)
    { id: "f1-c-m1",  x1: 300, y1: 410, x2: 570, y2: 410, fromJunction: "f1-j-w-mid", toJunction: "f1-j-center" },
    { id: "f1-c-m2",  x1: 570, y1: 410, x2: 790, y2: 410, fromJunction: "f1-j-center",toJunction: "f1-j-e-mid"  },
  ],

  rooms: [
    // ── North row ──
    { id: "f1-intl",  label: "International\nAffairs",       type: "office", x: 70,  y: 65,  w: 210, h: 165, cx: 175, cy: 147, fontSize: 10, doorNode: "f1-j-nw"    },
    { id: "f1-7107",  label: "7107\nAuditorium",             type: "room",   x: 310, y: 65,  w: 235, h: 165, cx: 427, cy: 147, fontSize: 11, doorNode: "f1-j-nw"    },
    { id: "f1-7106",  label: "7106\nIEP Classroom",          type: "room",   x: 580, y: 65,  w: 175, h: 165, cx: 667, cy: 147, fontSize: 10, doorNode: "f1-j-ne"    },
    { id: "f1-7105",  label: "7105\nIdeation",               type: "room",   x: 800, y: 65,  w: 170, h: 165, cx: 885, cy: 147, fontSize: 10, doorNode: "f1-j-ne"    },
    // ── West mid ──
    { id: "f1-tpo",   label: "Training &\nPlacements\nOfficer", type: "office", x: 70,  y: 285, w: 210, h: 165, cx: 175, cy: 367, fontSize: 9, doorNode: "f1-j-w-mid" },
    // ── East column ──
    { id: "f1-7104",  label: "7104\nFaculty",                type: "office", x: 830, y: 295, w: 145, h: 110, cx: 902, cy: 350, fontSize: 10, doorNode: "f1-j-e-mid" },
    { id: "f1-7103",  label: "7103\nFaculty",                type: "office", x: 830, y: 435, w: 145, h: 110, cx: 902, cy: 490, fontSize: 10, doorNode: "f1-j-se"    },
    // ── South row ──
    { id: "f1-7101",  label: "7101\nCSSP Office",            type: "office", x: 70,  y: 580, w: 215, h: 150, cx: 177, cy: 655, fontSize: 10, doorNode: "f1-j-sw"    },
    { id: "f1-7102",  label: "7102\nBranding Design",        type: "room",   x: 315, y: 580, w: 220, h: 150, cx: 425, cy: 655, fontSize: 10, doorNode: "f1-j-sw"    },
  ],

  stairs: [
    {
      id: "f1-stairs", x: 545, y: 290, w: 75, h: 185,
      label: "STAIRS", nodeX: 582, nodeY: 410, connectsTo: "f1-j-center",
    },
  ],

  qrPoints: [
    { id: "f1-qr-nw",     x: 300, y: 260, junctionId: "f1-j-nw"     },
    { id: "f1-qr-ne",     x: 790, y: 260, junctionId: "f1-j-ne"     },
    { id: "f1-qr-sw",     x: 300, y: 570, junctionId: "f1-j-sw"     },
    { id: "f1-qr-se",     x: 790, y: 570, junctionId: "f1-j-se"     },
    { id: "f1-qr-stairs", x: 582, y: 410, junctionId: "f1-j-center" },
  ],

  entrances: [],
};

// ═══════════════════════════════════════════════════════════════════════════
// SECOND FLOOR
// Layout: Classrooms around a large central open area.
// North row: 7205 Classroom, Washroom, 7204 Classroom, 7203 Classroom
// East col:  7202 Classroom
// SW corner: 7201 Classroom
// Center:    Open area + Stairs (center-right)
// ═══════════════════════════════════════════════════════════════════════════
const secondFloor: FloorMapData = {
  floorId: 2,
  building: { x: 60, y: 50, w: 1080, h: 700 },

  junctions: [
    { id: "f2-j-nw",    x: 370, y: 310, label: "NW Junction" },
    { id: "f2-j-ne",    x: 730, y: 310, label: "NE Junction" },
    { id: "f2-j-sw",    x: 370, y: 590, label: "SW Junction" },
    { id: "f2-j-s-mid", x: 575, y: 590, label: "South Mid (Stairs)" },
    { id: "f2-j-se",    x: 730, y: 590, label: "SE Junction" },
  ],

  corridors: [
    // North corridor
    { id: "f2-c-n",  x1: 370, y1: 310, x2: 730, y2: 310, fromJunction: "f2-j-nw",    toJunction: "f2-j-ne"    },
    // West corridor
    { id: "f2-c-w",  x1: 370, y1: 310, x2: 370, y2: 590, fromJunction: "f2-j-nw",    toJunction: "f2-j-sw"    },
    // East corridor
    { id: "f2-c-e",  x1: 730, y1: 310, x2: 730, y2: 590, fromJunction: "f2-j-ne",    toJunction: "f2-j-se"    },
    // South corridor (west → stairs → east)
    { id: "f2-c-s1", x1: 370, y1: 590, x2: 575, y2: 590, fromJunction: "f2-j-sw",    toJunction: "f2-j-s-mid" },
    { id: "f2-c-s2", x1: 575, y1: 590, x2: 730, y2: 590, fromJunction: "f2-j-s-mid", toJunction: "f2-j-se"    },
  ],

  rooms: [
    // ── North row ──
    { id: "f2-7205", label: "7205\nClassroom", type: "room",     x: 70,  y: 65,  w: 265, h: 215, cx: 202, cy: 172, fontSize: 11, doorNode: "f2-j-nw" },
    { id: "f2-wc",   label: "Washroom",        type: "washroom", x: 360, y: 65,  w: 110, h: 215, cx: 415, cy: 172, fontSize: 9,  doorNode: "f2-j-nw" },
    { id: "f2-7204", label: "7204\nClassroom", type: "room",     x: 490, y: 65,  w: 210, h: 215, cx: 595, cy: 172, fontSize: 11, doorNode: "f2-j-ne" },
    { id: "f2-7203", label: "7203\nClassroom", type: "room",     x: 730, y: 65,  w: 220, h: 215, cx: 840, cy: 172, fontSize: 11, doorNode: "f2-j-ne" },
    // ── East ──
    { id: "f2-7202", label: "7202\nClassroom", type: "room",     x: 775, y: 385, w: 210, h: 205, cx: 880, cy: 487, fontSize: 11, doorNode: "f2-j-se" },
    // ── SW ──
    { id: "f2-7201", label: "7201\nClassroom", type: "room",     x: 70,  y: 450, w: 265, h: 205, cx: 202, cy: 552, fontSize: 11, doorNode: "f2-j-sw" },
  ],

  stairs: [
    {
      id: "f2-stairs", x: 545, y: 355, w: 80, h: 210,
      label: "STAIRS", nodeX: 585, nodeY: 590, connectsTo: "f2-j-s-mid",
    },
  ],

  qrPoints: [
    { id: "f2-qr-nw",     x: 370, y: 310, junctionId: "f2-j-nw"    },
    { id: "f2-qr-ne",     x: 730, y: 310, junctionId: "f2-j-ne"    },
    { id: "f2-qr-sw",     x: 370, y: 590, junctionId: "f2-j-sw"    },
    { id: "f2-qr-stairs", x: 575, y: 590, junctionId: "f2-j-s-mid" },
  ],

  entrances: [],
};

/** All floor data indexed by floor ID */
export const FLOOR_MAP_DATA: Record<number, FloorMapData> = {
  0: groundFloor,
  1: firstFloor,
  2: secondFloor,
};

/** Flat list of all rooms across all floors — used by RoomSearch */
export function getAllRooms(): (RoomData & { floorId: number; floorLabel: string })[] {
  const floorLabels = ["Ground Floor", "First Floor", "Second Floor"];
  return Object.values(FLOOR_MAP_DATA).flatMap((floor) =>
    floor.rooms.map((room) => ({
      ...room,
      floorId: floor.floorId,
      floorLabel: floorLabels[floor.floorId],
    }))
  );
}
