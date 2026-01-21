"use client";

import { Group, Line, Rect, Text } from "react-konva";
import type { Wall } from "@/lib/geometry/types";
import { getWallLength, getWallAngle } from "@/lib/geometry/snapping";

interface WallsLayerProps {
  walls: Wall[];
  selectedIds: string[];
  onSelect: (id: string) => void;
  previewWall: Wall | null;
}

const WALL_COLOR = "#374151";
const WALL_SELECTED_COLOR = "#3b82f6";
const WALL_PREVIEW_COLOR = "#93c5fd";

export function WallsLayer({
  walls,
  selectedIds,
  onSelect,
  previewWall,
}: WallsLayerProps) {
  const renderWall = (wall: Wall, isPreview = false, isSelected = false) => {
    const { id, startX, startY, endX, endY, thickness } = wall;

    // Calculate wall perpendicular offset for thickness
    const angle = Math.atan2(endY - startY, endX - startX);
    const perpAngle = angle + Math.PI / 2;
    const halfThickness = thickness / 2;

    const offsetX = Math.cos(perpAngle) * halfThickness;
    const offsetY = Math.sin(perpAngle) * halfThickness;

    // Wall polygon points (rectangle)
    const points = [
      startX - offsetX,
      startY - offsetY,
      startX + offsetX,
      startY + offsetY,
      endX + offsetX,
      endY + offsetY,
      endX - offsetX,
      endY - offsetY,
    ];

    const color = isPreview
      ? WALL_PREVIEW_COLOR
      : isSelected
      ? WALL_SELECTED_COLOR
      : WALL_COLOR;

    // Calculate length for label
    const lengthFeet = getWallLength(wall) / 12; // Convert to feet
    const midX = (startX + endX) / 2;
    const midY = (startY + endY) / 2;
    const wallAngle = getWallAngle(wall);

    // Determine if label should be above or below the wall
    const labelOffset = 12;
    const labelX = midX + Math.cos(perpAngle) * labelOffset;
    const labelY = midY + Math.sin(perpAngle) * labelOffset;

    return (
      <Group key={id} onClick={() => !isPreview && onSelect(id)}>
        {/* Wall fill */}
        <Line
          points={points}
          closed
          fill={color}
          opacity={isPreview ? 0.5 : 1}
          hitStrokeWidth={20}
        />

        {/* Wall outline */}
        <Line
          points={points}
          closed
          stroke={isSelected ? WALL_SELECTED_COLOR : "#1f2937"}
          strokeWidth={isSelected ? 2 : 1}
          listening={false}
        />

        {/* End caps */}
        <Line
          points={[
            startX - offsetX,
            startY - offsetY,
            startX + offsetX,
            startY + offsetY,
          ]}
          stroke="#1f2937"
          strokeWidth={1}
          listening={false}
        />
        <Line
          points={[
            endX - offsetX,
            endY - offsetY,
            endX + offsetX,
            endY + offsetY,
          ]}
          stroke="#1f2937"
          strokeWidth={1}
          listening={false}
        />

        {/* Length label */}
        {!isPreview && lengthFeet >= 1 && (
          <Text
            x={labelX}
            y={labelY}
            text={`${lengthFeet.toFixed(1)}'`}
            fontSize={10}
            fill="#6b7280"
            offsetX={15}
            offsetY={5}
            listening={false}
          />
        )}
      </Group>
    );
  };

  return (
    <Group>
      {/* Render existing walls */}
      {walls.map((wall) =>
        renderWall(wall, false, selectedIds.includes(wall.id))
      )}

      {/* Render preview wall */}
      {previewWall && renderWall(previewWall, true)}
    </Group>
  );
}
