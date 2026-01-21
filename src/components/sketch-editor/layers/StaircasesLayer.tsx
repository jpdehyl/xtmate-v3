"use client";

import { Group, Rect, Line, Arrow, Text } from "react-konva";
import type { Staircase } from "@/lib/geometry/types";
import { generateTreadPositions, getStaircaseBounds } from "@/lib/geometry/staircase";

interface StaircasesLayerProps {
  staircases: Staircase[];
  selectedIds: string[];
  onSelect: (id: string) => void;
}

const STAIR_FILL = "#f3f4f6";
const STAIR_STROKE = "#6b7280";
const STAIR_SELECTED_FILL = "#dbeafe";
const STAIR_SELECTED_STROKE = "#3b82f6";

export function StaircasesLayer({
  staircases,
  selectedIds,
  onSelect,
}: StaircasesLayerProps) {
  const renderStaircase = (staircase: Staircase, isSelected: boolean) => {
    const { id, type, x, y, width, length, rotation, treads, treadDepth, turnDirection } = staircase;

    const fillColor = isSelected ? STAIR_SELECTED_FILL : STAIR_FILL;
    const strokeColor = isSelected ? STAIR_SELECTED_STROKE : STAIR_STROKE;
    const strokeWidth = isSelected ? 2 : 1;

    const bounds = getStaircaseBounds(staircase);

    switch (type) {
      case "straight":
        return (
          <Group
            key={id}
            x={x}
            y={y}
            rotation={rotation}
            onClick={() => onSelect(id)}
          >
            {/* Stair outline */}
            <Rect
              x={0}
              y={0}
              width={width}
              height={length}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* Treads */}
            {Array.from({ length: treads - 1 }).map((_, i) => (
              <Line
                key={i}
                points={[0, (i + 1) * treadDepth, width, (i + 1) * treadDepth]}
                stroke={strokeColor}
                strokeWidth={strokeWidth * 0.5}
              />
            ))}

            {/* Direction arrow */}
            <Arrow
              points={[width / 2, length - 10, width / 2, 10]}
              pointerLength={8}
              pointerWidth={8}
              fill={strokeColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* "UP" label */}
            <Text
              x={width / 2 - 8}
              y={length / 2 - 5}
              text="UP"
              fontSize={10}
              fill={strokeColor}
            />
          </Group>
        );

      case "l-shaped": {
        const firstRunLength = Math.floor(treads / 2) * treadDepth;
        const landingSize = width;
        const secondRunStart = firstRunLength + landingSize;
        const secondRunLength = length - secondRunStart;

        return (
          <Group
            key={id}
            x={x}
            y={y}
            rotation={rotation}
            onClick={() => onSelect(id)}
          >
            {/* First run */}
            <Rect
              x={0}
              y={0}
              width={width}
              height={firstRunLength}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* First run treads */}
            {Array.from({ length: Math.floor(treads / 2) }).map((_, i) => (
              <Line
                key={`first-${i}`}
                points={[0, (i + 1) * treadDepth, width, (i + 1) * treadDepth]}
                stroke={strokeColor}
                strokeWidth={strokeWidth * 0.5}
              />
            ))}

            {/* Landing */}
            <Rect
              x={turnDirection === "right" ? 0 : -landingSize}
              y={firstRunLength}
              width={width + landingSize}
              height={landingSize}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* Second run */}
            <Rect
              x={turnDirection === "right" ? width : -width - landingSize + width}
              y={firstRunLength}
              width={width}
              height={secondRunLength + landingSize}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* Direction indicators */}
            <Arrow
              points={[width / 2, firstRunLength - 10, width / 2, 10]}
              pointerLength={6}
              pointerWidth={6}
              fill={strokeColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth * 0.5}
            />

            <Text
              x={width / 2 - 5}
              y={firstRunLength / 2}
              text="UP"
              fontSize={8}
              fill={strokeColor}
            />
          </Group>
        );
      }

      case "u-shaped": {
        const runLength = Math.floor(treads / 3) * treadDepth;
        const landingSize = width;

        return (
          <Group
            key={id}
            x={x}
            y={y}
            rotation={rotation}
            onClick={() => onSelect(id)}
          >
            {/* First run */}
            <Rect
              x={0}
              y={0}
              width={width}
              height={runLength}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* First landing */}
            <Rect
              x={turnDirection === "right" ? 0 : -width}
              y={runLength}
              width={width * 2}
              height={landingSize}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* Middle run (parallel) */}
            <Rect
              x={turnDirection === "right" ? width : -width}
              y={0}
              width={width}
              height={runLength + landingSize}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* Second landing */}
            <Rect
              x={turnDirection === "right" ? width : -width * 2}
              y={runLength}
              width={width * 2}
              height={landingSize}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* Third run */}
            <Rect
              x={turnDirection === "right" ? width * 2 : -width * 2}
              y={0}
              width={width}
              height={runLength + landingSize}
              fill={fillColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />

            {/* Direction arrow */}
            <Arrow
              points={[width / 2, runLength - 10, width / 2, 10]}
              pointerLength={6}
              pointerWidth={6}
              fill={strokeColor}
              stroke={strokeColor}
              strokeWidth={strokeWidth * 0.5}
            />

            <Text
              x={width / 2 - 5}
              y={runLength / 2}
              text="UP"
              fontSize={8}
              fill={strokeColor}
            />
          </Group>
        );
      }

      default:
        return null;
    }
  };

  return (
    <Group>
      {staircases.map((staircase) =>
        renderStaircase(staircase, selectedIds.includes(staircase.id))
      )}
    </Group>
  );
}
