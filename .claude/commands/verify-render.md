---
name: verify-render
description: Check floor plan rendering against quality standards
---

When rendering output looks wrong, run through this diagnostic checklist.

## Wall Rendering Checks

### Are walls polygons or lines?
```
WRONG: <Line points={[x1,y1,x2,y2]} />
RIGHT: <Shape> with 4+ points forming rectangle
```
**Fix**: Use calculateWallPolygon() from floor-plan-rendering skill

### Do corners connect cleanly?
Look for:
- Gaps at corners (walls don't meet)
- Overlaps (walls cross each other)
- Z-fighting (flickering where walls overlap)

**Fix**: Implement wall graph with endpoint merging (2" tolerance)

### Is wall thickness visible?
At default zoom, walls should appear as rectangles, not hairlines.

**Fix**: Ensure thickness is applied in world coordinates, not screen pixels

---

## Door Rendering Checks

### Is the arc radius correct?
Arc radius MUST equal door width. Measure both.

**Fix**: `const swingRadius = door.width * scale`

### Is swing direction correct?
Arc should swing INTO the room, not through walls.

**Fix**: Determine room side from door's parent wall and adjacent rooms

### Is the panel line present?
Should show a line from hinge point in closed position direction.

---

## Window Rendering Checks

### Is the opening gap present?
Wall should have a break where window is.

### Is there a window symbol?
Parallel lines or hatching inside the opening.

---

## Dimension Checks

### Format correct?
Should be: `12' 6"` not `12.5 ft` or `150 inches`

### Extension lines present?
Small perpendicular lines from wall to dimension line.

### Text positioned correctly?
Centered above the dimension line, not overlapping it.

---

## Quick Diagnostic

Run this mental checklist:
1. [ ] Walls are filled shapes, not lines
2. [ ] Corners have no gaps
3. [ ] Door arcs match door widths
4. [ ] Windows show in correct positions
5. [ ] Dimensions readable and formatted

If any fail, identify WHICH step in the pipeline broke:
- Data extraction (wrong coordinates)
- Wall graph (endpoints not merged)
- Polygon calculation (wrong shape)
- Rendering (wrong component type)
- Styling (wrong colors/widths)
