"use client";

import React, { useMemo } from "react";
import { Layer, Line, Rect } from "react-konva";

interface GridLayerProps {
  width: number;
  height: number;
  gridSize: number;
  scale: number;
  offsetX: number;
  offsetY: number;
}

export function GridLayer({
  width,
  height,
  gridSize,
  scale,
  offsetX,
  offsetY,
}: GridLayerProps) {
  const gridLines = useMemo(() => {
    const lines: React.ReactElement[] = [];

    // Calculate visible area in canvas coordinates
    const visibleLeft = -offsetX / scale;
    const visibleTop = -offsetY / scale;
    const visibleRight = (width - offsetX) / scale;
    const visibleBottom = (height - offsetY) / scale;

    // Add padding to ensure smooth scrolling
    const padding = gridSize * 5;
    const startX = Math.floor((visibleLeft - padding) / gridSize) * gridSize;
    const endX = Math.ceil((visibleRight + padding) / gridSize) * gridSize;
    const startY = Math.floor((visibleTop - padding) / gridSize) * gridSize;
    const endY = Math.ceil((visibleBottom + padding) / gridSize) * gridSize;

    // Major grid every 12 units (1 foot)
    const majorGridSize = gridSize * 12;

    // Vertical lines
    for (let x = startX; x <= endX; x += gridSize) {
      const isMajor = x % majorGridSize === 0;
      lines.push(
        <Line
          key={`v-${x}`}
          points={[x, startY, x, endY]}
          stroke={isMajor ? "#d1d5db" : "#e5e7eb"}
          strokeWidth={(isMajor ? 1 : 0.5) / scale}
          listening={false}
        />
      );
    }

    // Horizontal lines
    for (let y = startY; y <= endY; y += gridSize) {
      const isMajor = y % majorGridSize === 0;
      lines.push(
        <Line
          key={`h-${y}`}
          points={[startX, y, endX, y]}
          stroke={isMajor ? "#d1d5db" : "#e5e7eb"}
          strokeWidth={(isMajor ? 1 : 0.5) / scale}
          listening={false}
        />
      );
    }

    return lines;
  }, [width, height, gridSize, scale, offsetX, offsetY]);

  return (
    <Layer listening={false}>
      {/* Background */}
      <Rect
        x={-offsetX / scale - 10000}
        y={-offsetY / scale - 10000}
        width={20000}
        height={20000}
        fill="#f9fafb"
        listening={false}
      />
      {gridLines}
    </Layer>
  );
}
