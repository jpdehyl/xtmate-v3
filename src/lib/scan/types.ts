/**
 * XtMate Shared Scan Format — v1
 *
 * This is the canonical data format shared between:
 *  - iOS app (RoomPlan / LiDAR capture)
 *  - Web dashboard (Pascal Editor 3D viewer)
 *  - Sync API (/api/sync)
 *
 * All units are METERS. All angles are RADIANS.
 * Coordinate system: Y-up, right-handed (matches Three.js / Pascal Editor).
 *
 * Node hierarchy:
 *  ScanScene
 *    └── ScanLevel[]
 *          ├── ScanWall[]
 *          ├── ScanSlab (floor polygon)
 *          ├── ScanOpening[] (doors, windows)
 *          └── ScanObject[] (furniture, fixtures)
 */

// ─────────────────────────────────────────────
// Base
// ─────────────────────────────────────────────

export interface ScanVector2 {
  x: number;
  z: number; // We use XZ for floor plane (Y is up)
}

export interface ScanVector3 {
  x: number;
  y: number;
  z: number;
}

export interface ScanTransform {
  position: ScanVector3;
  rotation: ScanVector3; // Euler angles in radians (XYZ order)
  scale: number;
}

// ─────────────────────────────────────────────
// Geometry primitives
// ─────────────────────────────────────────────

export interface ScanWall {
  id: string;
  /** Start point on the floor plane */
  start: ScanVector2;
  /** End point on the floor plane */
  end: ScanVector2;
  /** Wall height in meters */
  height: number;
  /** Wall thickness in meters (default 0.1) */
  thickness: number;
  /** Material / surface type */
  material?: string;
}

export interface ScanSlab {
  id: string;
  /** Polygon boundary on the floor plane — array of [x, z] points */
  polygon: ScanVector2[];
  /** Elevation of this floor above ground level (meters) */
  elevation: number;
  material?: string;
}

export interface ScanOpening {
  id: string;
  wallId: string;
  type: 'door' | 'window' | 'opening';
  /** Position along wall (0.0 = start, 1.0 = end) */
  positionAlongWall: number;
  /** Width in meters */
  width: number;
  /** Height in meters */
  height: number;
  /** Sill height from floor in meters (windows only) */
  sillHeight?: number;
}

export interface ScanObject {
  id: string;
  /** Object category (furniture, appliance, fixture, etc.) */
  category: string;
  /** Specific type (refrigerator, toilet, bathtub, etc.) */
  type?: string;
  transform: ScanTransform;
  /** Bounding box dimensions in meters */
  dimensions: { width: number; height: number; depth: number };
}

export interface ScanLevel {
  id: string;
  /** Floor level index (0 = ground floor, -1 = basement, 1 = second floor) */
  level: number;
  label?: string; // "First Floor", "Basement"
  walls: ScanWall[];
  slab: ScanSlab | null;
  openings: ScanOpening[];
  objects: ScanObject[];
  /** Computed dimensions (from bounding box of all walls) */
  boundingBox?: {
    width: number;
    length: number;
    height: number;
  };
}

// ─────────────────────────────────────────────
// Top-level scene (stored in rooms.geometry or room_scans table)
// ─────────────────────────────────────────────

export interface ScanScene {
  /** Format version for forward compat */
  version: 'xtmate-scan-v1';
  /** ISO timestamp of when scan was captured */
  capturedAt: string;
  /** Source of scan data */
  source: 'lidar' | 'manual' | 'import';
  /** iOS device / app info */
  deviceInfo?: {
    deviceModel: string;
    osVersion: string;
    appVersion: string;
  };
  levels: ScanLevel[];
  /** URL to raw USDZ file (if LiDAR scan) — stored in Vercel Blob */
  usdzUrl?: string;
  /** URL to Gemini-generated isometric render (iOS feature) */
  renderUrl?: string;
}

// ─────────────────────────────────────────────
// iOS sync payload extension
// ─────────────────────────────────────────────

/**
 * Extended room data sent from iOS during /api/sync
 * Extends the existing rooms payload with 3D scan data.
 */
export interface iOSSyncRoom {
  /** Client-side UUID */
  localId: string;
  /** Server UUID (if already synced) */
  serverId?: string;
  levelLocalId?: string;
  levelId?: string;
  name: string;
  category?: string;
  order?: number;
  /** Dimensions in FEET (legacy format, kept for backward compat) */
  dimensions?: {
    length: number;
    width: number;
    height: number;
    squareFeet?: number;
  };
  /** 2D sketch geometry (Konva format) */
  sketch?: unknown;
  /** 3D scan data in shared format */
  scanData?: ScanScene;
}

// ─────────────────────────────────────────────
// Pascal Editor adapter helpers
// ─────────────────────────────────────────────

/**
 * Convert ScanWall to Pascal WallNode start/end points.
 * Pascal uses [x, z] tuples in meters.
 */
export function scanWallToPascalPoints(
  wall: ScanWall,
): { start: [number, number]; end: [number, number] } {
  return {
    start: [wall.start.x, wall.start.z],
    end: [wall.end.x, wall.end.z],
  };
}

/**
 * Convert ScanSlab polygon to Pascal SlabNode polygon format.
 */
export function scanSlabToPascalPolygon(slab: ScanSlab): [number, number][] {
  return slab.polygon.map((p) => [p.x, p.z]);
}

/**
 * Convert a DB room's dimensions (inches) to a minimal ScanScene.
 * Used when there's no LiDAR scan — builds a rectangular room from dimensions.
 */
export function dimensionsToScanScene(opts: {
  widthIn: number;
  lengthIn: number;
  heightIn: number;
  levelLabel?: string;
}): ScanScene {
  const INCHES_TO_METERS = 0.0254;
  const w = opts.widthIn * INCHES_TO_METERS;
  const l = opts.lengthIn * INCHES_TO_METERS;
  const h = opts.heightIn * INCHES_TO_METERS;

  // Rectangular room: 4 walls around perimeter, centered at origin
  const walls: ScanWall[] = [
    {
      id: 'wall_south',
      start: { x: -w / 2, z: -l / 2 },
      end: { x: w / 2, z: -l / 2 },
      height: h,
      thickness: 0.1,
    },
    {
      id: 'wall_east',
      start: { x: w / 2, z: -l / 2 },
      end: { x: w / 2, z: l / 2 },
      height: h,
      thickness: 0.1,
    },
    {
      id: 'wall_north',
      start: { x: w / 2, z: l / 2 },
      end: { x: -w / 2, z: l / 2 },
      height: h,
      thickness: 0.1,
    },
    {
      id: 'wall_west',
      start: { x: -w / 2, z: l / 2 },
      end: { x: -w / 2, z: -l / 2 },
      height: h,
      thickness: 0.1,
    },
  ];

  const slab: ScanSlab = {
    id: 'slab_floor',
    polygon: [
      { x: -w / 2, z: -l / 2 },
      { x: w / 2, z: -l / 2 },
      { x: w / 2, z: l / 2 },
      { x: -w / 2, z: l / 2 },
    ],
    elevation: 0,
  };

  return {
    version: 'xtmate-scan-v1',
    capturedAt: new Date().toISOString(),
    source: 'manual',
    levels: [
      {
        id: 'level_0',
        level: 0,
        label: opts.levelLabel ?? 'First Floor',
        walls,
        slab,
        openings: [],
        objects: [],
        boundingBox: { width: w, length: l, height: h },
      },
    ],
  };
}
