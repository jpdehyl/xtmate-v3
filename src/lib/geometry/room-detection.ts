import type { Point, Wall, RoomPolygon } from './types';
import { distance, getWallAngle } from './snapping';

// Tolerance for considering points equal
const POINT_TOLERANCE = 1;

/**
 * Check if two points are approximately equal
 */
function pointsEqual(p1: Point, p2: Point, tolerance: number = POINT_TOLERANCE): boolean {
  return Math.abs(p1.x - p2.x) < tolerance && Math.abs(p1.y - p2.y) < tolerance;
}

/**
 * Find all unique vertices from walls
 */
function getVertices(walls: Wall[]): Point[] {
  const vertices: Point[] = [];

  for (const wall of walls) {
    const start = { x: wall.startX, y: wall.startY };
    const end = { x: wall.endX, y: wall.endY };

    if (!vertices.some(v => pointsEqual(v, start))) {
      vertices.push(start);
    }
    if (!vertices.some(v => pointsEqual(v, end))) {
      vertices.push(end);
    }
  }

  return vertices;
}

/**
 * Get all walls connected to a vertex
 */
function getConnectedWalls(vertex: Point, walls: Wall[]): Wall[] {
  return walls.filter(wall => {
    const start = { x: wall.startX, y: wall.startY };
    const end = { x: wall.endX, y: wall.endY };
    return pointsEqual(vertex, start) || pointsEqual(vertex, end);
  });
}

/**
 * Get the other end of a wall from a given vertex
 */
function getOtherEnd(wall: Wall, vertex: Point): Point {
  const start = { x: wall.startX, y: wall.startY };
  const end = { x: wall.endX, y: wall.endY };
  return pointsEqual(vertex, start) ? end : start;
}

/**
 * Calculate angle from vertex to connected wall endpoint
 */
function getAngleFromVertex(vertex: Point, wall: Wall): number {
  const otherEnd = getOtherEnd(wall, vertex);
  return Math.atan2(otherEnd.y - vertex.y, otherEnd.x - vertex.x);
}

/**
 * Sort walls by angle around a vertex (counterclockwise)
 */
function sortWallsByAngle(vertex: Point, walls: Wall[]): Wall[] {
  return [...walls].sort((a, b) => {
    return getAngleFromVertex(vertex, a) - getAngleFromVertex(vertex, b);
  });
}

/**
 * Find the next wall in the polygon traversal (turning right at each vertex)
 */
function findNextWall(
  currentVertex: Point,
  previousWall: Wall,
  walls: Wall[]
): Wall | null {
  const connectedWalls = getConnectedWalls(currentVertex, walls)
    .filter(w => w.id !== previousWall.id);

  if (connectedWalls.length === 0) {
    return null;
  }

  // Sort by angle and find the wall immediately clockwise from the incoming wall
  const sortedWalls = sortWallsByAngle(currentVertex, connectedWalls);
  const incomingAngle = getAngleFromVertex(currentVertex, previousWall) + Math.PI; // Reverse direction
  const normalizedIncoming = ((incomingAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);

  // Find the wall with the smallest clockwise angle from the incoming direction
  let bestWall: Wall | null = null;
  let smallestAngle = Infinity;

  for (const wall of sortedWalls) {
    const wallAngle = getAngleFromVertex(currentVertex, wall);
    const normalizedWall = ((wallAngle % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    let angleDiff = normalizedIncoming - normalizedWall;

    if (angleDiff < 0) {
      angleDiff += 2 * Math.PI;
    }

    if (angleDiff < smallestAngle) {
      smallestAngle = angleDiff;
      bestWall = wall;
    }
  }

  return bestWall;
}

/**
 * Trace a polygon starting from a wall
 */
function tracePolygon(startWall: Wall, walls: Wall[], usedEdges: Set<string>): Point[] | null {
  const polygon: Point[] = [];
  const edgeKey = (w: Wall) => `${w.id}`;

  // Start from the first wall's start point
  let currentVertex = { x: startWall.startX, y: startWall.startY };
  polygon.push(currentVertex);

  let currentWall = startWall;
  const maxIterations = walls.length * 2;
  let iterations = 0;

  while (iterations < maxIterations) {
    iterations++;

    // Move to the other end of the current wall
    currentVertex = getOtherEnd(currentWall, currentVertex);

    // Check if we've completed the polygon
    if (polygon.length > 2 && pointsEqual(currentVertex, polygon[0])) {
      // Mark all edges as used
      let vertex = polygon[0];
      for (let i = 1; i < polygon.length; i++) {
        const nextVertex = polygon[i];
        const wall = walls.find(w =>
          (pointsEqual({ x: w.startX, y: w.startY }, vertex) && pointsEqual({ x: w.endX, y: w.endY }, nextVertex)) ||
          (pointsEqual({ x: w.endX, y: w.endY }, vertex) && pointsEqual({ x: w.startX, y: w.startY }, nextVertex))
        );
        if (wall) {
          usedEdges.add(edgeKey(wall));
        }
        vertex = nextVertex;
      }
      return polygon;
    }

    polygon.push(currentVertex);

    // Find the next wall
    const nextWall = findNextWall(currentVertex, currentWall, walls);
    if (!nextWall) {
      return null; // Dead end
    }

    currentWall = nextWall;
  }

  return null; // Couldn't complete polygon
}

/**
 * Calculate the area of a polygon using the shoelace formula
 */
export function calculatePolygonArea(points: Point[]): number {
  let area = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += points[i].x * points[j].y;
    area -= points[j].x * points[i].y;
  }

  return Math.abs(area / 2);
}

/**
 * Calculate the perimeter of a polygon
 */
export function calculatePolygonPerimeter(points: Point[]): number {
  let perimeter = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    perimeter += distance(points[i], points[j]);
  }

  return perimeter;
}

/**
 * Check if a polygon is clockwise
 */
function isClockwise(points: Point[]): boolean {
  let sum = 0;
  const n = points.length;

  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    sum += (points[j].x - points[i].x) * (points[j].y + points[i].y);
  }

  return sum > 0;
}

/**
 * Get centroid of a polygon
 */
export function getPolygonCentroid(points: Point[]): Point {
  let cx = 0;
  let cy = 0;
  const n = points.length;

  for (const point of points) {
    cx += point.x;
    cy += point.y;
  }

  return { x: cx / n, y: cy / n };
}

/**
 * Detect all enclosed rooms from walls
 * Returns polygons sorted by area (smallest first to avoid outer boundaries)
 */
export function detectRooms(walls: Wall[], pixelsPerFoot: number = 12): RoomPolygon[] {
  if (walls.length < 3) {
    return [];
  }

  const rooms: RoomPolygon[] = [];
  const usedEdges = new Set<string>();
  const minRoomArea = 9 * pixelsPerFoot * pixelsPerFoot; // Minimum 9 sq ft

  // Try to trace polygons starting from each wall
  for (const startWall of walls) {
    if (usedEdges.has(startWall.id)) {
      continue;
    }

    const polygon = tracePolygon(startWall, walls, usedEdges);

    if (polygon && polygon.length >= 3) {
      const areaPixels = calculatePolygonArea(polygon);

      // Only consider rooms with reasonable area
      if (areaPixels >= minRoomArea) {
        // Convert to feet (assuming pixelsPerFoot scale)
        const areaFeet = areaPixels / (pixelsPerFoot * pixelsPerFoot);
        const perimeterFeet = calculatePolygonPerimeter(polygon) / pixelsPerFoot;

        // Only include counter-clockwise polygons (interior rooms)
        if (!isClockwise(polygon)) {
          rooms.push({
            points: polygon,
            area: Math.round(areaFeet * 100) / 100,
            perimeter: Math.round(perimeterFeet * 100) / 100,
          });
        }
      }
    }
  }

  // Sort by area (smallest first)
  rooms.sort((a, b) => a.area - b.area);

  return rooms;
}

/**
 * Check if a point is inside a polygon
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  let inside = false;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    if (
      yi > point.y !== yj > point.y &&
      point.x < ((xj - xi) * (point.y - yi)) / (yj - yi) + xi
    ) {
      inside = !inside;
    }
  }

  return inside;
}

/**
 * Find which detected room contains a point
 */
export function findRoomAtPoint(
  point: Point,
  rooms: RoomPolygon[]
): RoomPolygon | null {
  // Check smallest rooms first (they were sorted by area)
  for (const room of rooms) {
    if (isPointInPolygon(point, room.points)) {
      return room;
    }
  }
  return null;
}
