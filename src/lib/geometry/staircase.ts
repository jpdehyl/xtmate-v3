import type { Staircase, StaircaseType, Point } from './types';

// Building code defaults
const DEFAULT_RISER_HEIGHT = 7.5; // inches
const DEFAULT_TREAD_DEPTH = 10; // inches
const MIN_RISER_HEIGHT = 4;
const MAX_RISER_HEIGHT = 8;
const MIN_TREAD_DEPTH = 9;
const MAX_TREAD_DEPTH = 14;
const DEFAULT_STAIR_WIDTH = 36; // inches
const DEFAULT_FLOOR_HEIGHT = 96; // 8 feet in inches

/**
 * Calculate the number of treads needed for a given rise
 */
export function calculateTreads(
  totalRise: number = DEFAULT_FLOOR_HEIGHT,
  riserHeight: number = DEFAULT_RISER_HEIGHT
): number {
  return Math.ceil(totalRise / riserHeight);
}

/**
 * Calculate optimal riser height for a given total rise and number of treads
 */
export function calculateRiserHeight(
  totalRise: number = DEFAULT_FLOOR_HEIGHT,
  treads: number
): number {
  const height = totalRise / treads;
  return Math.max(MIN_RISER_HEIGHT, Math.min(MAX_RISER_HEIGHT, height));
}

/**
 * Calculate stair run (total horizontal distance)
 */
export function calculateStairRun(
  treads: number,
  treadDepth: number = DEFAULT_TREAD_DEPTH
): number {
  // One less tread depth than risers (top tread is the floor)
  return (treads - 1) * treadDepth;
}

/**
 * Create a new staircase with calculated dimensions
 */
export function createStaircase(
  type: StaircaseType,
  x: number,
  y: number,
  options: {
    width?: number;
    totalRise?: number;
    riserHeight?: number;
    treadDepth?: number;
    turnDirection?: 'left' | 'right';
    rotation?: number;
  } = {}
): Staircase {
  const {
    width = DEFAULT_STAIR_WIDTH,
    totalRise = DEFAULT_FLOOR_HEIGHT,
    riserHeight = DEFAULT_RISER_HEIGHT,
    treadDepth = DEFAULT_TREAD_DEPTH,
    turnDirection = 'right',
    rotation = 0,
  } = options;

  const treads = calculateTreads(totalRise, riserHeight);
  const actualRiser = calculateRiserHeight(totalRise, treads);

  let length: number;
  let landingWidth: number | undefined;

  switch (type) {
    case 'straight':
      length = calculateStairRun(treads, treadDepth);
      break;
    case 'l-shaped':
      // L-shaped has a landing at the turn
      landingWidth = width;
      const halfTreads = Math.floor(treads / 2);
      length = calculateStairRun(halfTreads, treadDepth) + landingWidth;
      break;
    case 'u-shaped':
      // U-shaped has two landings
      landingWidth = width;
      const thirdTreads = Math.floor(treads / 3);
      length = calculateStairRun(thirdTreads, treadDepth) * 2 + landingWidth;
      break;
    default:
      length = calculateStairRun(treads, treadDepth);
  }

  return {
    id: crypto.randomUUID(),
    type,
    x,
    y,
    width,
    length,
    rotation,
    treads,
    riserHeight: actualRiser,
    treadDepth,
    turnDirection: type !== 'straight' ? turnDirection : undefined,
    landingWidth: type !== 'straight' ? landingWidth : undefined,
  };
}

/**
 * Get the bounding box of a staircase
 */
export function getStaircaseBounds(staircase: Staircase): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
} {
  const { x, y, width, length, type, landingWidth } = staircase;

  let actualWidth = width;
  let actualHeight = length;

  if (type === 'l-shaped' && landingWidth) {
    actualWidth = width + landingWidth;
    actualHeight = length;
  } else if (type === 'u-shaped' && landingWidth) {
    actualWidth = width * 2 + landingWidth;
    actualHeight = length;
  }

  return {
    minX: x,
    minY: y,
    maxX: x + actualWidth,
    maxY: y + actualHeight,
    width: actualWidth,
    height: actualHeight,
  };
}

/**
 * Generate tread positions for rendering
 */
export function generateTreadPositions(
  staircase: Staircase
): Array<{ x: number; y: number; width: number; depth: number }> {
  const { x, y, width, treads, treadDepth, type, landingWidth, turnDirection } = staircase;
  const positions: Array<{ x: number; y: number; width: number; depth: number }> = [];

  if (type === 'straight') {
    for (let i = 0; i < treads - 1; i++) {
      positions.push({
        x,
        y: y + i * treadDepth,
        width,
        depth: treadDepth,
      });
    }
  } else if (type === 'l-shaped' && landingWidth) {
    const halfTreads = Math.floor(treads / 2);
    const firstRunLength = halfTreads * treadDepth;

    // First run
    for (let i = 0; i < halfTreads; i++) {
      positions.push({
        x,
        y: y + i * treadDepth,
        width,
        depth: treadDepth,
      });
    }

    // Landing (represented as a single large tread)
    positions.push({
      x,
      y: y + firstRunLength,
      width: landingWidth,
      depth: landingWidth,
    });

    // Second run (perpendicular)
    const secondRunX = turnDirection === 'right' ? x + width : x - width;
    for (let i = 0; i < treads - halfTreads - 1; i++) {
      positions.push({
        x: secondRunX,
        y: y + firstRunLength,
        width: treadDepth,
        depth: width,
      });
    }
  } else if (type === 'u-shaped' && landingWidth) {
    const thirdTreads = Math.floor(treads / 3);
    const runLength = thirdTreads * treadDepth;

    // First run (going up)
    for (let i = 0; i < thirdTreads; i++) {
      positions.push({
        x,
        y: y + i * treadDepth,
        width,
        depth: treadDepth,
      });
    }

    // First landing
    positions.push({
      x: turnDirection === 'right' ? x + width : x - width,
      y: y + runLength,
      width: width,
      depth: landingWidth,
    });

    // Middle run (going sideways)
    const middleX = turnDirection === 'right' ? x + width : x - width;
    for (let i = 0; i < thirdTreads; i++) {
      positions.push({
        x: middleX,
        y: y + runLength + landingWidth + i * treadDepth,
        width,
        depth: treadDepth,
      });
    }

    // Second landing
    const secondLandingY = y + runLength + landingWidth + thirdTreads * treadDepth;
    positions.push({
      x: turnDirection === 'right' ? x + width * 2 : x - width * 2,
      y: secondLandingY,
      width,
      depth: landingWidth,
    });

    // Third run (going up, opposite direction from first)
    for (let i = 0; i < treads - thirdTreads * 2 - 2; i++) {
      positions.push({
        x: turnDirection === 'right' ? x + width * 2 : x - width * 2,
        y: secondLandingY + landingWidth + i * treadDepth,
        width,
        depth: treadDepth,
      });
    }
  }

  return positions;
}

/**
 * Check if a point is within a staircase
 */
export function isPointInStaircase(point: Point, staircase: Staircase): boolean {
  const bounds = getStaircaseBounds(staircase);

  // Apply rotation transformation
  if (staircase.rotation !== 0) {
    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;
    const radians = -staircase.rotation * (Math.PI / 180);

    const rotatedX =
      Math.cos(radians) * (point.x - centerX) -
      Math.sin(radians) * (point.y - centerY) +
      centerX;
    const rotatedY =
      Math.sin(radians) * (point.x - centerX) +
      Math.cos(radians) * (point.y - centerY) +
      centerY;

    return (
      rotatedX >= bounds.minX &&
      rotatedX <= bounds.maxX &&
      rotatedY >= bounds.minY &&
      rotatedY <= bounds.maxY
    );
  }

  return (
    point.x >= bounds.minX &&
    point.x <= bounds.maxX &&
    point.y >= bounds.minY &&
    point.y <= bounds.maxY
  );
}
