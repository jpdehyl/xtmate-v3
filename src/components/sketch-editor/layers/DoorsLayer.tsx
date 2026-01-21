"use client";

import { Group, Line, Arc, Rect } from "react-konva";
import type { Wall, Opening, DoorType } from "@/lib/geometry/types";
import { getWallAngle, getPointAtWallPosition } from "@/lib/geometry/snapping";

interface DoorsLayerProps {
  walls: Wall[];
  openings: Opening[];
  selectedIds: string[];
  onSelect: (id: string) => void;
}

const DOOR_WIDTH = 36; // 3 feet in inches (default)
const DOOR_COLOR = "#f3f4f6";
const DOOR_SELECTED_COLOR = "#dbeafe";
const DOOR_STROKE = "#374151";
const DOOR_SELECTED_STROKE = "#3b82f6";

export function DoorsLayer({
  walls,
  openings,
  selectedIds,
  onSelect,
}: DoorsLayerProps) {
  const renderDoor = (opening: Opening, wall: Wall | undefined, isSelected: boolean) => {
    if (!wall) return null;

    const { id, position, width = DOOR_WIDTH, subtype = "single", swingDirection = "left" } = opening;
    const doorType = subtype as DoorType;

    // Get position on wall
    const doorCenter = getPointAtWallPosition(wall, position);
    const wallAngle = getWallAngle(wall);
    const angleRad = (wallAngle * Math.PI) / 180;

    // Door half width
    const halfWidth = width / 2;

    // Calculate door corners along wall
    const dx = Math.cos(angleRad) * halfWidth;
    const dy = Math.sin(angleRad) * halfWidth;

    const fillColor = isSelected ? DOOR_SELECTED_COLOR : DOOR_COLOR;
    const strokeColor = isSelected ? DOOR_SELECTED_STROKE : DOOR_STROKE;
    const strokeWidth = isSelected ? 2 : 1;

    // Door opening (gap in wall)
    const openingStart = {
      x: doorCenter.x - dx,
      y: doorCenter.y - dy,
    };
    const openingEnd = {
      x: doorCenter.x + dx,
      y: doorCenter.y + dy,
    };

    // Calculate swing direction
    const perpAngle = angleRad + Math.PI / 2;
    const swingMultiplier = swingDirection === "left" ? 1 : -1;

    switch (doorType) {
      case "single":
        return (
          <Group key={id} onClick={() => onSelect(id)}>
            {/* Door opening background */}
            <Line
              points={[openingStart.x, openingStart.y, openingEnd.x, openingEnd.y]}
              stroke={fillColor}
              strokeWidth={wall.thickness + 2}
              lineCap="butt"
            />

            {/* Door panel */}
            <Line
              points={[
                openingStart.x,
                openingStart.y,
                openingStart.x + Math.cos(perpAngle) * width * swingMultiplier,
                openingStart.y + Math.sin(perpAngle) * width * swingMultiplier,
              ]}
              stroke={strokeColor}
              strokeWidth={strokeWidth + 1}
              lineCap="round"
            />

            {/* Swing arc */}
            <Arc
              x={openingStart.x}
              y={openingStart.y}
              innerRadius={width - 2}
              outerRadius={width}
              angle={90}
              rotation={swingDirection === "left" ? wallAngle : wallAngle - 90}
              fill={strokeColor}
              opacity={0.3}
            />
          </Group>
        );

      case "double":
        return (
          <Group key={id} onClick={() => onSelect(id)}>
            {/* Door opening background */}
            <Line
              points={[openingStart.x, openingStart.y, openingEnd.x, openingEnd.y]}
              stroke={fillColor}
              strokeWidth={wall.thickness + 2}
              lineCap="butt"
            />

            {/* Left door panel */}
            <Line
              points={[
                openingStart.x,
                openingStart.y,
                openingStart.x + Math.cos(perpAngle) * halfWidth,
                openingStart.y + Math.sin(perpAngle) * halfWidth,
              ]}
              stroke={strokeColor}
              strokeWidth={strokeWidth + 1}
              lineCap="round"
            />

            {/* Right door panel */}
            <Line
              points={[
                openingEnd.x,
                openingEnd.y,
                openingEnd.x + Math.cos(perpAngle) * halfWidth,
                openingEnd.y + Math.sin(perpAngle) * halfWidth,
              ]}
              stroke={strokeColor}
              strokeWidth={strokeWidth + 1}
              lineCap="round"
            />

            {/* Left swing arc */}
            <Arc
              x={openingStart.x}
              y={openingStart.y}
              innerRadius={halfWidth - 1}
              outerRadius={halfWidth}
              angle={90}
              rotation={wallAngle}
              fill={strokeColor}
              opacity={0.3}
            />

            {/* Right swing arc */}
            <Arc
              x={openingEnd.x}
              y={openingEnd.y}
              innerRadius={halfWidth - 1}
              outerRadius={halfWidth}
              angle={-90}
              rotation={wallAngle + 90}
              fill={strokeColor}
              opacity={0.3}
            />
          </Group>
        );

      case "pocket":
        return (
          <Group key={id} onClick={() => onSelect(id)}>
            {/* Door opening background */}
            <Line
              points={[openingStart.x, openingStart.y, openingEnd.x, openingEnd.y]}
              stroke={fillColor}
              strokeWidth={wall.thickness + 2}
              lineCap="butt"
            />

            {/* Pocket indicators (dashed lines in wall) */}
            <Line
              points={[
                openingStart.x - dx,
                openingStart.y - dy,
                openingStart.x,
                openingStart.y,
              ]}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              dash={[3, 3]}
            />

            {/* Door edge */}
            <Line
              points={[openingStart.x, openingStart.y, openingEnd.x, openingEnd.y]}
              stroke={strokeColor}
              strokeWidth={strokeWidth + 1}
            />
          </Group>
        );

      case "bi-fold":
        const quarterWidth = halfWidth / 2;
        return (
          <Group key={id} onClick={() => onSelect(id)}>
            {/* Door opening background */}
            <Line
              points={[openingStart.x, openingStart.y, openingEnd.x, openingEnd.y]}
              stroke={fillColor}
              strokeWidth={wall.thickness + 2}
              lineCap="butt"
            />

            {/* Bi-fold panels (chevron shape) */}
            <Line
              points={[
                openingStart.x,
                openingStart.y,
                doorCenter.x + Math.cos(perpAngle) * quarterWidth * swingMultiplier,
                doorCenter.y + Math.sin(perpAngle) * quarterWidth * swingMultiplier,
                openingEnd.x,
                openingEnd.y,
              ]}
              stroke={strokeColor}
              strokeWidth={strokeWidth + 1}
              lineCap="round"
              lineJoin="round"
            />
          </Group>
        );

      case "sliding":
        return (
          <Group key={id} onClick={() => onSelect(id)}>
            {/* Door opening background */}
            <Line
              points={[openingStart.x, openingStart.y, openingEnd.x, openingEnd.y]}
              stroke={fillColor}
              strokeWidth={wall.thickness + 2}
              lineCap="butt"
            />

            {/* Fixed panel */}
            <Line
              points={[doorCenter.x, doorCenter.y, openingEnd.x, openingEnd.y]}
              stroke={strokeColor}
              strokeWidth={strokeWidth + 2}
            />

            {/* Sliding panel (offset slightly) */}
            <Line
              points={[
                openingStart.x + Math.cos(perpAngle) * 2,
                openingStart.y + Math.sin(perpAngle) * 2,
                doorCenter.x + Math.cos(perpAngle) * 2,
                doorCenter.y + Math.sin(perpAngle) * 2,
              ]}
              stroke={strokeColor}
              strokeWidth={strokeWidth + 2}
            />

            {/* Slide indicator */}
            <Line
              points={[
                doorCenter.x - dx / 2,
                doorCenter.y - dy / 2,
                doorCenter.x + dx / 2,
                doorCenter.y + dy / 2,
              ]}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              dash={[4, 4]}
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
        return renderDoor(opening, wall, selectedIds.includes(opening.id));
      })}
    </Group>
  );
}
