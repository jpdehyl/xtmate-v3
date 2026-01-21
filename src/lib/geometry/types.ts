// Geometry types for the sketch editor

export interface Point {
  x: number;
  y: number;
}

export interface Wall {
  id: string;
  startX: number;
  startY: number;
  endX: number;
  endY: number;
  thickness: number;
}

export type DoorType = 'single' | 'double' | 'pocket' | 'bi-fold' | 'sliding';

export type WindowType = 'hung' | 'casement' | 'sliding' | 'picture';

export interface Opening {
  id: string;
  wallId: string;
  type: 'door' | 'window';
  position: number; // 0-1 along the wall
  width: number;
  subtype?: DoorType | WindowType;
  swingDirection?: 'left' | 'right' | 'both'; // for doors
}

export type FixtureCategory = 'kitchen' | 'bathroom' | 'laundry';

export type KitchenFixture = 'sink' | 'stove' | 'fridge' | 'dishwasher' | 'microwave' | 'island';
export type BathroomFixture = 'toilet' | 'tub' | 'shower' | 'vanity' | 'bidet';
export type LaundryFixture = 'washer' | 'dryer' | 'utility-sink';

export type FixtureType = KitchenFixture | BathroomFixture | LaundryFixture;

export interface Fixture {
  id: string;
  type: FixtureType;
  category: FixtureCategory;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
}

export type StaircaseType = 'straight' | 'l-shaped' | 'u-shaped';

export interface Staircase {
  id: string;
  type: StaircaseType;
  x: number;
  y: number;
  width: number;
  length: number;
  rotation: number;
  treads: number;
  riserHeight: number;
  treadDepth: number;
  // For L and U shaped stairs
  turnDirection?: 'left' | 'right';
  landingWidth?: number;
}

export interface RoomPolygon {
  points: Point[];
  area: number; // in square feet
  perimeter: number; // in linear feet
}

export interface SketchGeometry {
  walls: Wall[];
  openings: Opening[];
  fixtures: Fixture[];
  staircases: Staircase[];
  detectedRooms: RoomPolygon[];
}

export type SketchTool =
  | 'select'
  | 'wall'
  | 'door'
  | 'window'
  | 'fixture'
  | 'staircase'
  | 'measure'
  | 'pan';

export interface ToolState {
  activeTool: SketchTool;
  // Door subtypes
  doorType: DoorType;
  // Window subtypes
  windowType: WindowType;
  // Fixture subtypes
  fixtureCategory: FixtureCategory;
  fixtureType: FixtureType;
  // Staircase subtypes
  staircaseType: StaircaseType;
}

export interface CanvasState {
  scale: number;
  offsetX: number;
  offsetY: number;
  gridVisible: boolean;
  gridSize: number; // in pixels at scale 1
  snapToGrid: boolean;
  snapDistance: number;
}

export interface SelectionState {
  selectedIds: string[];
  selectedType: 'wall' | 'opening' | 'fixture' | 'staircase' | null;
}

// Snapping types
export type SnapType =
  | 'endpoint'
  | 'midpoint'
  | 'perpendicular'
  | 'grid'
  | 'wall'
  | 'angle';

export interface SnapPoint {
  x: number;
  y: number;
  type: SnapType;
  referenceId?: string;
}

// Level types
export interface Level {
  id: string;
  name: string; // "B", "1", "2", "3", "A"
  label: string; // "Basement", "First Floor", etc.
  order: number;
}

// Keyboard shortcuts
export const KEYBOARD_SHORTCUTS: Record<string, SketchTool | 'grid' | 'delete' | 'escape'> = {
  v: 'select',
  w: 'wall',
  d: 'door',
  o: 'window', // opening
  f: 'fixture',
  s: 'staircase',
  m: 'measure',
  p: 'pan',
  g: 'grid',
  Delete: 'delete',
  Backspace: 'delete',
  Escape: 'escape',
};

// Room categories
export const ROOM_CATEGORIES = [
  'kitchen',
  'bathroom',
  'bedroom',
  'living-room',
  'dining-room',
  'office',
  'laundry',
  'garage',
  'closet',
  'hallway',
  'foyer',
  'basement',
  'attic',
  'utility',
  'other',
] as const;

export type RoomCategory = typeof ROOM_CATEGORIES[number];

// Default fixture dimensions (in inches)
export const FIXTURE_DIMENSIONS: Record<FixtureType, { width: number; height: number }> = {
  // Kitchen
  sink: { width: 33, height: 22 },
  stove: { width: 30, height: 26 },
  fridge: { width: 36, height: 30 },
  dishwasher: { width: 24, height: 24 },
  microwave: { width: 24, height: 14 },
  island: { width: 48, height: 36 },
  // Bathroom
  toilet: { width: 18, height: 28 },
  tub: { width: 60, height: 32 },
  shower: { width: 36, height: 36 },
  vanity: { width: 48, height: 22 },
  bidet: { width: 15, height: 25 },
  // Laundry
  washer: { width: 27, height: 27 },
  dryer: { width: 27, height: 27 },
  'utility-sink': { width: 25, height: 22 },
};
