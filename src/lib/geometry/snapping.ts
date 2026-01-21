import type { Point, Wall, SnapPoint, SnapType } from './types';

const DEFAULT_SNAP_DISTANCE = 10; // pixels
const ANGLE_SNAP_THRESHOLD = 5; // degrees

/**
 * Calculate distance between two points
 */
export function distance(p1: Point, p2: Point): number {
  return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
}

/**
 * Calculate midpoint of a wall
 */
export function getWallMidpoint(wall: Wall): Point {
  return {
    x: (wall.startX + wall.endX) / 2,
    y: (wall.startY + wall.endY) / 2,
  };
}

/**
 * Calculate wall length
 */
export function getWallLength(wall: Wall): number {
  return distance(
    { x: wall.startX, y: wall.startY },
    { x: wall.endX, y: wall.endY }
  );
}

/**
 * Calculate angle of a wall in degrees
 */
export function getWallAngle(wall: Wall): number {
  const dx = wall.endX - wall.startX;
  const dy = wall.endY - wall.startY;
  return Math.atan2(dy, dx) * (180 / Math.PI);
}

/**
 * Find nearest point on a line segment to a given point
 */
export function nearestPointOnSegment(
  point: Point,
  lineStart: Point,
  lineEnd: Point
): Point {
  const dx = lineEnd.x - lineStart.x;
  const dy = lineEnd.y - lineStart.y;
  const lengthSquared = dx * dx + dy * dy;

  if (lengthSquared === 0) {
    return lineStart;
  }

  let t = ((point.x - lineStart.x) * dx + (point.y - lineStart.y) * dy) / lengthSquared;
  t = Math.max(0, Math.min(1, t));

  return {
    x: lineStart.x + t * dx,
    y: lineStart.y + t * dy,
  };
}

/**
 * Project a point perpendicular to a wall
 */
export function getPerpendicularPoint(wall: Wall, point: Point): Point | null {
  const wallAngle = getWallAngle(wall);
  const perpAngle = (wallAngle + 90) * (Math.PI / 180);

  // Create a line from the point perpendicular to the wall
  const perpEnd = {
    x: point.x + Math.cos(perpAngle) * 1000,
    y: point.y + Math.sin(perpAngle) * 1000,
  };

  // Find intersection
  return lineIntersection(
    { x: wall.startX, y: wall.startY },
    { x: wall.endX, y: wall.endY },
    point,
    perpEnd
  );
}

/**
 * Find intersection point of two lines
 */
export function lineIntersection(
  p1: Point,
  p2: Point,
  p3: Point,
  p4: Point
): Point | null {
  const denom = (p4.y - p3.y) * (p2.x - p1.x) - (p4.x - p3.x) * (p2.y - p1.y);

  if (Math.abs(denom) < 0.0001) {
    return null; // Lines are parallel
  }

  const ua = ((p4.x - p3.x) * (p1.y - p3.y) - (p4.y - p3.y) * (p1.x - p3.x)) / denom;

  return {
    x: p1.x + ua * (p2.x - p1.x),
    y: p1.y + ua * (p2.y - p1.y),
  };
}

/**
 * Snap to grid
 */
export function snapToGrid(point: Point, gridSize: number): Point {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize,
  };
}

/**
 * Snap angle to common angles (0, 45, 90, 135, 180, etc.)
 */
export function snapAngle(angle: number): number {
  const commonAngles = [0, 45, 90, 135, 180, 225, 270, 315, 360];

  // Normalize angle to 0-360
  let normalizedAngle = ((angle % 360) + 360) % 360;

  for (const snapAngle of commonAngles) {
    if (Math.abs(normalizedAngle - snapAngle) < ANGLE_SNAP_THRESHOLD) {
      return snapAngle === 360 ? 0 : snapAngle;
    }
  }

  return angle;
}

/**
 * Find all snap points for a given cursor position
 */
export function findSnapPoints(
  cursor: Point,
  walls: Wall[],
  gridSize: number,
  snapDistance: number = DEFAULT_SNAP_DISTANCE,
  excludeWallIds: string[] = []
): SnapPoint[] {
  const snapPoints: SnapPoint[] = [];
  const filteredWalls = walls.filter(w => !excludeWallIds.includes(w.id));

  // Check wall endpoints
  for (const wall of filteredWalls) {
    const startPoint = { x: wall.startX, y: wall.startY };
    const endPoint = { x: wall.endX, y: wall.endY };

    if (distance(cursor, startPoint) < snapDistance) {
      snapPoints.push({
        ...startPoint,
        type: 'endpoint',
        referenceId: wall.id,
      });
    }

    if (distance(cursor, endPoint) < snapDistance) {
      snapPoints.push({
        ...endPoint,
        type: 'endpoint',
        referenceId: wall.id,
      });
    }
  }

  // Check wall midpoints
  for (const wall of filteredWalls) {
    const midpoint = getWallMidpoint(wall);
    if (distance(cursor, midpoint) < snapDistance) {
      snapPoints.push({
        ...midpoint,
        type: 'midpoint',
        referenceId: wall.id,
      });
    }
  }

  // Check perpendicular snaps
  for (const wall of filteredWalls) {
    const nearestPoint = nearestPointOnSegment(
      cursor,
      { x: wall.startX, y: wall.startY },
      { x: wall.endX, y: wall.endY }
    );

    if (distance(cursor, nearestPoint) < snapDistance) {
      snapPoints.push({
        ...nearestPoint,
        type: 'wall',
        referenceId: wall.id,
      });
    }
  }

  // Grid snap (always available)
  const gridPoint = snapToGrid(cursor, gridSize);
  if (distance(cursor, gridPoint) < snapDistance) {
    snapPoints.push({
      ...gridPoint,
      type: 'grid',
    });
  }

  // Sort by distance
  snapPoints.sort((a, b) => distance(cursor, a) - distance(cursor, b));

  return snapPoints;
}

/**
 * Get the best snap point for a cursor position
 */
export function getBestSnapPoint(
  cursor: Point,
  walls: Wall[],
  gridSize: number,
  snapDistance: number = DEFAULT_SNAP_DISTANCE,
  excludeWallIds: string[] = [],
  snapToGridEnabled: boolean = true
): SnapPoint | null {
  const snapPoints = findSnapPoints(cursor, walls, gridSize, snapDistance, excludeWallIds);

  // Priority: endpoint > midpoint > perpendicular > wall > grid
  const priority: SnapType[] = ['endpoint', 'midpoint', 'perpendicular', 'wall', 'grid'];

  for (const type of priority) {
    const point = snapPoints.find(p => p.type === type);
    if (point) {
      if (type === 'grid' && !snapToGridEnabled) {
        continue;
      }
      return point;
    }
  }

  return null;
}

/**
 * Snap the end point of a wall being drawn to constrain to angles
 */
export function snapWallEndpoint(
  startPoint: Point,
  endPoint: Point,
  constrainToAngles: boolean = true
): Point {
  if (!constrainToAngles) {
    return endPoint;
  }

  const dx = endPoint.x - startPoint.x;
  const dy = endPoint.y - startPoint.y;
  const currentAngle = Math.atan2(dy, dx) * (180 / Math.PI);
  const snappedAngle = snapAngle(currentAngle);

  if (Math.abs(currentAngle - snappedAngle) < ANGLE_SNAP_THRESHOLD) {
    const length = distance(startPoint, endPoint);
    const radians = snappedAngle * (Math.PI / 180);
    return {
      x: startPoint.x + Math.cos(radians) * length,
      y: startPoint.y + Math.sin(radians) * length,
    };
  }

  return endPoint;
}

/**
 * Calculate position along a wall for placing openings (doors/windows)
 * Returns a value 0-1 representing position along wall length
 */
export function getPositionAlongWall(wall: Wall, point: Point): number {
  const wallLength = getWallLength(wall);
  const nearestPoint = nearestPointOnSegment(
    point,
    { x: wall.startX, y: wall.startY },
    { x: wall.endX, y: wall.endY }
  );

  const distanceFromStart = distance(
    { x: wall.startX, y: wall.startY },
    nearestPoint
  );

  return Math.max(0, Math.min(1, distanceFromStart / wallLength));
}

/**
 * Get point on wall at a given position (0-1)
 */
export function getPointAtWallPosition(wall: Wall, position: number): Point {
  return {
    x: wall.startX + (wall.endX - wall.startX) * position,
    y: wall.startY + (wall.endY - wall.startY) * position,
  };
}
