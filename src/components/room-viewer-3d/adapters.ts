/**
 * Room Data Adapter
 * 
 * Converts XtMate room schema (inches) to 3D geometry params (feet).
 * Handles rectangular, L-shaped, and custom geometries.
 */

import type { Room } from '@/lib/db/schema';

interface WallSegment {
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

const INCHES_TO_FEET = 1 / 12;
const FEET_TO_METERS = 0.3048;

/**
 * Convert XtMate room schema to 3D geometry parameters
 */
export function adaptRoomDataTo3D(dbRoom: Room): Room3DGeometry {
  // Convert inches to feet
  const width = (dbRoom.widthIn || 0) * INCHES_TO_FEET;
  const length = (dbRoom.lengthIn || 0) * INCHES_TO_FEET;
  const height = (dbRoom.heightIn || 96) * INCHES_TO_FEET; // Default 8ft if not set

  // Default to rectangular if no geometry data
  if (!dbRoom.geometry || typeof dbRoom.geometry !== 'object') {
    return {
      width,
      length,
      height,
      wallSegments: createRectangularWalls(width, length),
    };
  }

  const geom = dbRoom.geometry as Record<string, unknown>;

  // Check for custom wall segments
  if (Array.isArray(geom.wallSegments)) {
    return {
      width,
      length,
      height,
      wallSegments: geom.wallSegments as WallSegment[],
    };
  }

  // Fallback to rectangular
  return {
    width,
    length,
    height,
    wallSegments: createRectangularWalls(width, length),
  };
}

/**
 * Create wall segments for a rectangular room
 * Returns array of 4 segments: bottom, right, top, left
 */
function createRectangularWalls(width: number, length: number): WallSegment[] {
  return [
    // Bottom wall (x-axis)
    { startX: 0, startY: 0, endX: width, endY: 0 },
    // Right wall (y-axis)
    { startX: width, startY: 0, endX: width, endY: length },
    // Top wall (x-axis)
    { startX: width, startY: length, endX: 0, endY: length },
    // Left wall (y-axis)
    { startX: 0, startY: length, endX: 0, endY: 0 },
  ];
}

/**
 * Convert feet to meters for Three.js
 */
export function feetToMeters(feet: number): number {
  return feet * FEET_TO_METERS;
}

/**
 * Get wall color based on material name (simple heuristic)
 */
export function getMaterialColor(material?: string): number {
  if (!material) return 0xd1d5db; // Gray

  const lower = material.toLowerCase();

  if (lower.includes('drywall') || lower.includes('gypsum')) return 0xf3f4f6;
  if (lower.includes('plaster')) return 0xfafafa;
  if (lower.includes('brick') || lower.includes('masonry')) return 0x92400e;
  if (lower.includes('concrete') || lower.includes('cinder')) return 0x6b7280;
  if (lower.includes('paint')) return 0xe5e7eb;
  if (lower.includes('tile')) return 0xecfdf5;

  return 0xd1d5db; // Default gray
}

/**
 * Get floor color based on material name
 */
export function getFloorColor(material?: string): number {
  if (!material) return 0x9ca3af; // Medium gray

  const lower = material.toLowerCase();

  if (lower.includes('wood') || lower.includes('hardwood')) return 0x92400e;
  if (lower.includes('laminate')) return 0xb45309;
  if (lower.includes('tile') || lower.includes('ceramic')) return 0x6366f1;
  if (lower.includes('vinyl') || lower.includes('linoleum')) return 0xd97706;
  if (lower.includes('carpet')) return 0x7c2d12;
  if (lower.includes('concrete')) return 0x4b5563;

  return 0x9ca3af; // Default gray
}

/**
 * Check if a DB Room has the required dimensions for 3D rendering
 */
export function roomHasDimensions(dbRoom: Room): boolean {
  return !!(dbRoom.widthIn && dbRoom.lengthIn);
}

/**
 * Convert a DB Room record to Room3DViewerProps (for use in viewer component)
 * Returns null if room lacks required dimensions
 */
export function roomToViewerProps(dbRoom: Room): { room: Room } | null {
  if (!roomHasDimensions(dbRoom)) return null;
  return { room: dbRoom };
}

/**
 * Get ceiling color based on material name
 */
export function getCeilingColor(material?: string): number {
  if (!material) return 0xf3f4f6; // Light gray

  const lower = material.toLowerCase();

  if (lower.includes('drywall') || lower.includes('gypsum')) return 0xf3f4f6;
  if (lower.includes('drop') || lower.includes('suspended') || lower.includes('act')) return 0xfafafa;
  if (lower.includes('popcorn')) return 0xfafafa;
  if (lower.includes('tile')) return 0xe5e7eb;

  return 0xf3f4f6; // Default light gray
}
