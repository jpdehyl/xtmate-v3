# XtMate Quality Rules

## Sketch Rendering Standards

### Walls
- ALWAYS render walls as filled polygons with thickness, NEVER as simple lines
- Wall thickness default: 4 inches at scale
- Corner intersections must be clean - no gaps, no overlaps
- Use miter joins for L-corners, proper caps for T-intersections

### Doors
- Door swing arc radius MUST equal door width
- Show door panel line in closed position
- Gap in wall must match door width exactly

### Windows  
- Show window opening with parallel lines or hatching
- Window width from data, not guessed

### Dimensions
- Format: feet' inches" (e.g., 12' 6")
- Include extension lines and tick marks
- Text centered above dimension line

### Units
- Internal calculations in feet
- Convert from meters: multiply by 3.28084
- Display in feet and inches for user

## Code Quality

### Before implementing any sketch rendering:
1. Read the floor-plan-rendering skill first
2. Break the task into verifiable sub-steps
3. Test each sub-step before moving on

### Verification checkpoints:
- [ ] Single wall renders as rectangle, not line
- [ ] Two walls at corner connect cleanly
- [ ] Door arc radius matches door width
- [ ] Dimensions show correct ft' in" format

## Never
- Render walls as simple Line elements
- Guess at door swing direction without room context
- Skip the wall graph building step
- Combine multiple rendering steps into one function
