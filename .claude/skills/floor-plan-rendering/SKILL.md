# Floor Plan Rendering Skill

## Purpose
Convert iOS RoomPlan `CapturedRoom` data into clean 2D architectural floor plans that match Xactimate/Docusketch quality standards.

---

## Input: CapturedRoom Structure

Apple's RoomPlan provides:
```swift
CapturedRoom {
  walls: [Wall]        // 3D position, dimensions
  doors: [Door]        // position, size, isOpen
  windows: [Window]    // position, size
  openings: [Opening]  // archways, pass-throughs
  objects: [Object]    // furniture (ignore for structure)
}

Wall {
  transform: simd_float4x4  // 3D position/rotation matrix
  dimensions: simd_float3   // width, height, thickness (meters)
}
```

---

## Conversion Pipeline

### Step 1: Project to 2D

```
3D Wall → 2D Wall Segment

For each wall:
1. Extract position from transform matrix (columns 3 is translation)
2. Calculate rotation angle from transform
3. Project to XZ plane (ignore Y for 2D floor plan)
4. Convert meters → feet (multiply by 3.28084)

Result: Array of {start: Point2D, end: Point2D, thickness: number}
```

### Step 2: Build Wall Graph

```
Walls form a graph where:
- Nodes = wall endpoints (with tolerance merging ~2 inches)
- Edges = wall segments

Algorithm:
1. Collect all wall start/end points
2. Merge points within tolerance (walls that "almost" connect)
3. Build adjacency list
4. Detect closed polygons (rooms)
```

### Step 3: Clean Wall Intersections

**THIS IS WHERE MOST RENDERING FAILS**

Wall corners need special handling:

```
WRONG: Lines just crossing
  |
--+--
  |

RIGHT: Proper corner with thickness
  ┌──
  │
──┘
```

Algorithm for T-intersections:
1. Detect when wall endpoint is near middle of another wall
2. Extend the joining wall to the far edge of the intersected wall
3. Create proper "cap" at the intersection

Algorithm for L-corners:
1. Detect when two wall endpoints meet
2. Extend both walls to create clean corner
3. Miter or butt joint based on angle

---

## Rendering Specifications

### Walls

```
Stroke: #4A4A4A (dark gray)
Fill: #FFFFFF (white interior)
Thickness: 4-6 inches at scale (typical residential)
Line weight: 2px at 100% zoom

Render as closed polygon, not just lines:
- Outer edge
- Inner edge
- End caps
```

### Doors

```
Door Opening:
- Gap in wall at door location
- Width from CapturedRoom door.dimensions

Door Swing Arc:
- Radius = door width
- Arc = 90° from closed to open position
- Line weight: 1px
- Style: solid line

Door Panel (closed position):
- Line perpendicular to wall
- Length = door width
- Line weight: 1px

    ┌─────────┐
    │         │
    │    ╭────┤  <- Door swing arc
    │    │    │
    │    │    │
    │    │    │
    │    ╰────┤  <- Door panel (closed)
    │         │
```

### Windows

```
Window Opening:
- Gap in wall at window location
- Three parallel lines inside opening:
  - Two outer lines (wall edges)
  - One center line (glass)
  
Style: 45° hatching between lines (optional)

    │    │
    │ ╱╲ │  <- Hatched window symbol
    │╱  ╲│
    │╲  ╱│
    │ ╲╱ │
    │    │
```

### Dimension Lines

```
Format: feet' inches" (e.g., 12' 6")

Components:
1. Extension lines - perpendicular from wall, 1/4" gap from wall
2. Dimension line - parallel to wall, between extension lines
3. Tick marks or arrows at ends
4. Text centered above dimension line

    ←──── 14' 2" ────→
    │                 │
    ┌─────────────────┐
```

### Room Labels

```
Position: Centroid of room polygon
Format: 
  Room Name
  width × length (e.g., 12'7" × 14'2")

Font: Sans-serif, readable at current zoom
```

---

## Implementation: React + Konva

### Layer Structure

```jsx
<Stage>
  <Layer name="grid">
    {/* Background grid - 12" minor, 48" major */}
  </Layer>
  
  <Layer name="walls">
    {/* Wall polygons rendered as shapes */}
    {walls.map(wall => (
      <WallShape 
        key={wall.id}
        points={calculateWallPolygon(wall)}
        fill="#FFFFFF"
        stroke="#4A4A4A"
        strokeWidth={2}
      />
    ))}
  </Layer>
  
  <Layer name="openings">
    {/* Doors and windows */}
    {doors.map(door => <DoorSymbol key={door.id} {...door} />)}
    {windows.map(win => <WindowSymbol key={win.id} {...win} />)}
  </Layer>
  
  <Layer name="dimensions">
    {/* Dimension lines - toggle visibility */}
  </Layer>
  
  <Layer name="labels">
    {/* Room names and measurements */}
  </Layer>
</Stage>
```

### Wall Polygon Calculation

```typescript
function calculateWallPolygon(wall: Wall2D): number[] {
  const { start, end, thickness } = wall;
  
  // Wall direction vector
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const length = Math.sqrt(dx * dx + dy * dy);
  
  // Perpendicular (normal) vector
  const nx = -dy / length;
  const ny = dx / length;
  
  // Half thickness offset
  const offset = thickness / 2;
  
  // Four corners of wall rectangle
  return [
    start.x + nx * offset, start.y + ny * offset,  // outer start
    end.x + nx * offset, end.y + ny * offset,      // outer end
    end.x - nx * offset, end.y - ny * offset,      // inner end
    start.x - nx * offset, start.y - ny * offset,  // inner start
  ];
}
```

### Door Symbol Component

```typescript
interface DoorProps {
  position: Point2D;      // Center of door in wall
  width: number;          // Door width in feet
  wallAngle: number;      // Angle of containing wall
  swingDirection: 'left' | 'right';
  isOpen: boolean;
}

function DoorSymbol({ position, width, wallAngle, swingDirection }: DoorProps) {
  const scale = useZoomScale();
  const swingRadius = width * scale;
  
  // Door panel angle (perpendicular to wall when closed)
  const panelAngle = wallAngle + (swingDirection === 'left' ? -90 : 90);
  
  // Arc angles
  const startAngle = swingDirection === 'left' ? wallAngle : wallAngle - 90;
  const endAngle = startAngle + 90;
  
  return (
    <Group x={position.x} y={position.y}>
      {/* Door swing arc */}
      <Arc
        angle={90}
        rotation={startAngle}
        innerRadius={0}
        outerRadius={swingRadius}
        stroke="#4A4A4A"
        strokeWidth={1}
      />
      {/* Door panel (closed position) */}
      <Line
        points={[0, 0, swingRadius * Math.cos(panelAngle * DEG2RAD), swingRadius * Math.sin(panelAngle * DEG2RAD)]}
        stroke="#4A4A4A"
        strokeWidth={1}
      />
    </Group>
  );
}
```

---

## Common Failure Modes

### 1. Walls Don't Connect Properly
**Symptom**: Gaps or overlaps at corners
**Fix**: Implement wall graph with tolerance-based endpoint merging

### 2. Door Swings Wrong Direction
**Symptom**: Arc goes through wall instead of into room
**Fix**: Determine swing direction from door's relationship to rooms

### 3. Dimensions Overlap
**Symptom**: Multiple dimensions stack on each other
**Fix**: Implement dimension spacing algorithm, offset subsequent dimensions

### 4. Scale Issues
**Symptom**: Floor plan too big/small, measurements wrong
**Fix**: Ensure consistent unit conversion (meters → feet), maintain scale factor

### 5. Wall Thickness Ignored
**Symptom**: Walls render as single lines
**Fix**: Always render walls as polygons, not lines

---

## Testing Checklist

□ Single rectangular room renders with clean corners
□ Door swing arc is correct radius (matches door width)
□ Window symbol shows in correct position with hatching
□ Dimensions display in ft' in" format
□ Multi-room layout has clean wall intersections
□ Zoom maintains proper line weights
□ Export matches visual rendering

---

## Reference Implementations

- **TF2DeepFloorplan**: ML-based floor plan recognition (for importing existing plans)
- **magicplan**: Commercial app with similar RoomPlan integration
- **Canvas by Occipital**: LiDAR scanning to floor plan

## Unit Conversions

```typescript
const METERS_TO_FEET = 3.28084;
const FEET_TO_INCHES = 12;

function metersToFeet(m: number): number {
  return m * METERS_TO_FEET;
}

function feetToFeetInches(feet: number): string {
  const wholeFeet = Math.floor(feet);
  const inches = Math.round((feet - wholeFeet) * FEET_TO_INCHES);
  return `${wholeFeet}' ${inches}"`;
}
```
