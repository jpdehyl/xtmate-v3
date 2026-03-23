/**
 * Room 3D Viewer — Type Definitions
 * 
 * Converts XtMate room schema to 3D geometry parameters.
 * All dimensions in feet; internal conversion to meters for Three.js.
 */

export interface RoomData {
  id: string;
  name: string;
  /** Length in feet */
  length: number;
  /** Width in feet */
  width: number;
  /** Height in feet (default 8) */
  height: number;
  /** Floor material (optional) */
  floorMaterial?: string;
  /** Wall material (optional) */
  wallMaterial?: string;
  /** Ceiling material (optional) */
  ceilingMaterial?: string;
  /** Shape type: rectangular, l-shaped, custom */
  shape?: 'rectangular' | 'l-shaped' | 'custom';
  /** Wall segments for custom shapes */
  wallSegments?: WallSegment[];
  /** Geometry JSON (from sketch editor) */
  geometry?: Record<string, unknown>;
}

export interface WallSegment {
  startX: number;
  startY: number;
  endX: number;
  endY: number;
}

export interface Room3DGeometry {
  width: number;
  length: number;
  height: number;
  wallSegments: WallSegment[];
}

export interface Room3DViewerProps {
  room: RoomData;
  isLoading?: boolean;
  error?: string | null;
  showGrid?: boolean;
  showHelpers?: boolean;
}

/** Props for the RoomScene component (raw dimensions in feet) */
export interface RoomViewerProps {
  width: number;
  length: number;
  height: number;
}

/** Geometry output from room generation functions */
export interface RoomGeometry {
  walls: WallGeometry[];
  floorSize: [number, number];
  floorPosition: [number, number, number];
  height: number;
}

/** Individual wall geometry for 3D rendering */
export interface WallGeometry {
  position: [number, number, number];
  size: [number, number, number];
}
