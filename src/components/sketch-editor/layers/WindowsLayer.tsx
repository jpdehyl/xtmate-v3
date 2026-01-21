"use client";

import { Group, Line, Rect } from "react-konva";
import type { Wall, Opening, WindowType } from "@/lib/geometry/types";
import { getWallAngle, getPointAtWallPosition } from "@/lib/geometry/snapping";

interface WindowsLayerProps {
  walls: Wall[];
  openings: Opening[];
  selectedIds: string[];
  onSelect: (id: string) => void;
}

const WINDOW_WIDTH = 36; // 3 feet default
const WINDOW_COLOR = "#e0f2fe";
const WINDOW_SELECTED_COLOR = "#bae6fd";
const WINDOW_STROKE = "#0369a1";
const WINDOW_SELECTED_STROKE = "#3b82f6";

export function WindowsLayer({
  walls,
  openings,
  selectedIds,
  onSelect,
}: WindowsLayerProps) {
  const renderWindow = (opening: Opening, wall: Wall | undefined, isSelected: boolean) => {
    if (!wall) return null;

    const { id, position, width = WINDOW_WIDTH, subtype = "hung" } = opening;
    const windowType = subtype as WindowType;

    // Get position on wall
    const windowCenter = getPointAtWallPosition(wall, position);
    const wallAngle = getWallAngle(wall);
    const angleRad = (wallAngle * Math.PI) / 180;
    const perpAngle = angleRad + Math.PI / 2;

    // Window half width
    const halfWidth = width / 2;
    const halfThickness = wall.thickness / 2;

    // Calculate window corners along wall
    const dx = Math.cos(angleRad) * halfWidth;
    const dy = Math.sin(angleRad) * halfWidth;

    const fillColor = isSelected ? WINDOW_SELECTED_COLOR : WINDOW_COLOR;
    const strokeColor = isSelected ? WINDOW_SELECTED_STROKE : WINDOW_STROKE;
    const strokeWidth = isSelected ? 2 : 1;

    // Window corners
    const corners = [
      { x: windowCenter.x - dx - Math.cos(perpAngle) * halfThickness, y: windowCenter.y - dy - Math.sin(perpAngle) * halfThickness },
      { x: windowCenter.x + dx - Math.cos(perpAngle) * halfThickness, y: windowCenter.y + dy - Math.sin(perpAngle) * halfThickness },
      { x: windowCenter.x + dx + Math.cos(perpAngle) * halfThickness, y: windowCenter.y + dy + Math.sin(perpAngle) * halfThickness },
      { x: windowCenter.x - dx + Math.cos(perpAngle) * halfThickness, y: windowCenter.y - dy + Math.sin(perpAngle) * halfThickness },
    ];

    switch (windowType) {
      case "hung":
        // Double-hung window with two panes
        return (
          <Group key={id} onClick={() => onSelect(id)}>
            {/* Window background */}
            <Line
              points={corners.flatMap(c => [c.x, c.y])}
              closed
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* Center divider */}
            <Line
              points={[
                windowCenter.x - Math.cos(perpAngle) * halfThickness,
                windowCenter.y - Math.sin(perpAngle) * halfThickness,
                windowCenter.x + Math.cos(perpAngle) * halfThickness,
                windowCenter.y + Math.sin(perpAngle) * halfThickness,
              ]}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* Glass indication lines */}
            <Line
              points={[
                windowCenter.x - dx * 0.7 - Math.cos(perpAngle) * halfThickness * 0.5,
                windowCenter.y - dy * 0.7 - Math.sin(perpAngle) * halfThickness * 0.5,
                windowCenter.x - dx * 0.7 + Math.cos(perpAngle) * halfThickness * 0.5,
                windowCenter.y - dy * 0.7 + Math.sin(perpAngle) * halfThickness * 0.5,
              ]}
              stroke={strokeColor}
              strokeWidth={strokeWidth * 0.5}
              opacity={0.5}
            />
          </Group>
        );

      case "casement":
        // Casement window with swing indicator
        return (
          <Group key={id} onClick={() => onSelect(id)}>
            {/* Window background */}
            <Line
              points={corners.flatMap(c => [c.x, c.y])}
              closed
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* Casement hinge indicator */}
            <Line
              points={[
                corners[0].x,
                corners[0].y,
                corners[3].x,
                corners[3].y,
              ]}
              stroke={strokeColor}
              strokeWidth={strokeWidth + 1}
            />

            {/* Opening direction arrow */}
            <Line
              points={[
                windowCenter.x,
                windowCenter.y,
                windowCenter.x + Math.cos(perpAngle) * halfThickness * 2,
                windowCenter.y + Math.sin(perpAngle) * halfThickness * 2,
              ]}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </Group>
        );

      case "sliding":
        // Sliding window with two panels
        return (
          <Group key={id} onClick={() => onSelect(id)}>
            {/* Window background */}
            <Line
              points={corners.flatMap(c => [c.x, c.y])}
              closed
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* Center divider */}
            <Line
              points={[
                windowCenter.x - Math.cos(perpAngle) * halfThickness,
                windowCenter.y - Math.sin(perpAngle) * halfThickness,
                windowCenter.x + Math.cos(perpAngle) * halfThickness,
                windowCenter.y + Math.sin(perpAngle) * halfThickness,
              ]}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* Slide indicators (arrows) */}
            <Line
              points={[
                windowCenter.x - dx * 0.3,
                windowCenter.y - dy * 0.3,
                windowCenter.x + dx * 0.3,
                windowCenter.y + dy * 0.3,
              ]}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            <Line
              points={[
                windowCenter.x + dx * 0.15,
                windowCenter.y + dy * 0.15 - 3,
                windowCenter.x + dx * 0.3,
                windowCenter.y + dy * 0.3,
                windowCenter.x + dx * 0.15,
                windowCenter.y + dy * 0.15 + 3,
              ]}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </Group>
        );

      case "picture":
        // Fixed picture window (no moving parts)
        return (
          <Group key={id} onClick={() => onSelect(id)}>
            {/* Window background */}
            <Line
              points={corners.flatMap(c => [c.x, c.y])}
              closed
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* Cross pattern for picture window */}
            <Line
              points={[
                windowCenter.x - dx,
                windowCenter.y - dy,
                windowCenter.x + dx,
                windowCenter.y + dy,
              ]}
              stroke={strokeColor}
              strokeWidth={strokeWidth * 0.5}
              opacity={0.3}
            />
            <Line
              points={[
                windowCenter.x - Math.cos(perpAngle) * halfThickness,
                windowCenter.y - Math.sin(perpAngle) * halfThickness,
                windowCenter.x + Math.cos(perpAngle) * halfThickness,
                windowCenter.y + Math.sin(perpAngle) * halfThickness,
              ]}
              stroke={strokeColor}
              strokeWidth={strokeWidth * 0.5}
              opacity={0.3}
            />
          </Group>
        );

      default:
        return null;
    }
  };

  return (
    <Group>
      {openings.map((opening) => {
        const wall = walls.find((w) => w.id === opening.wallId);
        return renderWindow(opening, wall, selectedIds.includes(opening.id));
      })}
    </Group>
  );
}
