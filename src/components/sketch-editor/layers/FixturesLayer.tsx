"use client";

import { Group, Rect, Circle, Line, Ellipse, Text } from "react-konva";
import type { Fixture, FixtureType } from "@/lib/geometry/types";

interface FixturesLayerProps {
  fixtures: Fixture[];
  selectedIds: string[];
  onSelect: (id: string) => void;
}

const FIXTURE_COLORS: Record<string, { fill: string; stroke: string }> = {
  kitchen: { fill: "#fef3c7", stroke: "#d97706" },
  bathroom: { fill: "#dbeafe", stroke: "#2563eb" },
  laundry: { fill: "#f3e8ff", stroke: "#7c3aed" },
};

const SELECTED_STROKE = "#3b82f6";

export function FixturesLayer({
  fixtures,
  selectedIds,
  onSelect,
}: FixturesLayerProps) {
  const renderFixture = (fixture: Fixture, isSelected: boolean) => {
    const { id, type, category, x, y, width, height, rotation } = fixture;
    const colors = FIXTURE_COLORS[category] || FIXTURE_COLORS.kitchen;
    const strokeColor = isSelected ? SELECTED_STROKE : colors.stroke;
    const strokeWidth = isSelected ? 2 : 1;

    // Common props for rotation
    const groupProps = {
      x,
      y,
      rotation,
      onClick: () => onSelect(id),
    };

    switch (type) {
      // Kitchen fixtures
      case "sink":
        return (
          <Group key={id} {...groupProps}>
            {/* Sink basin */}
            <Rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              fill={colors.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              cornerRadius={4}
            />
            {/* Inner basin */}
            <Rect
              x={-width / 2 + 4}
              y={-height / 2 + 4}
              width={width - 8}
              height={height - 8}
              fill="#fff"
              stroke={strokeColor}
              strokeWidth={strokeWidth * 0.5}
              cornerRadius={2}
            />
            {/* Faucet indicator */}
            <Circle
              x={0}
              y={-height / 2 + 4}
              radius={3}
              fill={strokeColor}
            />
          </Group>
        );

      case "stove":
        return (
          <Group key={id} {...groupProps}>
            <Rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              fill={colors.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Burners */}
            {[
              [-width / 4, -height / 4],
              [width / 4, -height / 4],
              [-width / 4, height / 4],
              [width / 4, height / 4],
            ].map(([bx, by], i) => (
              <Circle
                key={i}
                x={bx}
                y={by}
                radius={Math.min(width, height) / 8}
                stroke={strokeColor}
                strokeWidth={strokeWidth * 0.5}
              />
            ))}
          </Group>
        );

      case "fridge":
        return (
          <Group key={id} {...groupProps}>
            <Rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              fill={colors.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Door divide line */}
            <Line
              points={[-width / 2 + 2, 0, width / 2 - 2, 0]}
              stroke={strokeColor}
              strokeWidth={strokeWidth * 0.5}
            />
            {/* Handle */}
            <Line
              points={[width / 2 - 6, -height / 4, width / 2 - 6, height / 4]}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </Group>
        );

      case "dishwasher":
        return (
          <Group key={id} {...groupProps}>
            <Rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              fill={colors.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Handle */}
            <Line
              points={[-width / 4, -height / 2 + 4, width / 4, -height / 2 + 4]}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </Group>
        );

      case "island":
        return (
          <Group key={id} {...groupProps}>
            <Rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              fill={colors.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              cornerRadius={2}
            />
          </Group>
        );

      // Bathroom fixtures
      case "toilet":
        return (
          <Group key={id} {...groupProps}>
            {/* Tank */}
            <Rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height / 3}
              fill={colors.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              cornerRadius={2}
            />
            {/* Bowl */}
            <Ellipse
              x={0}
              y={height / 6}
              radiusX={width / 2 - 1}
              radiusY={height / 3}
              fill={colors.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </Group>
        );

      case "tub":
        return (
          <Group key={id} {...groupProps}>
            <Rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              fill={colors.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              cornerRadius={8}
            />
            {/* Inner */}
            <Rect
              x={-width / 2 + 4}
              y={-height / 2 + 4}
              width={width - 8}
              height={height - 8}
              fill="#fff"
              stroke={strokeColor}
              strokeWidth={strokeWidth * 0.5}
              cornerRadius={6}
            />
            {/* Drain */}
            <Circle
              x={width / 4}
              y={0}
              radius={3}
              fill={strokeColor}
            />
          </Group>
        );

      case "shower":
        return (
          <Group key={id} {...groupProps}>
            <Rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              fill={colors.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Drain */}
            <Circle
              x={0}
              y={0}
              radius={4}
              fill="#fff"
              stroke={strokeColor}
              strokeWidth={strokeWidth * 0.5}
            />
            {/* Shower head indicator */}
            <Circle
              x={0}
              y={-height / 2 + 8}
              radius={3}
              fill={strokeColor}
            />
          </Group>
        );

      case "vanity":
        return (
          <Group key={id} {...groupProps}>
            <Rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              fill={colors.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Sink basin */}
            <Ellipse
              x={0}
              y={0}
              radiusX={width / 4}
              radiusY={height / 4}
              fill="#fff"
              stroke={strokeColor}
              strokeWidth={strokeWidth * 0.5}
            />
          </Group>
        );

      // Laundry fixtures
      case "washer":
      case "dryer":
        return (
          <Group key={id} {...groupProps}>
            <Rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              fill={colors.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
              cornerRadius={2}
            />
            {/* Door/drum */}
            <Circle
              x={0}
              y={2}
              radius={Math.min(width, height) / 3}
              fill="#fff"
              stroke={strokeColor}
              strokeWidth={strokeWidth * 0.5}
            />
            {/* Control panel */}
            <Rect
              x={-width / 4}
              y={-height / 2 + 3}
              width={width / 2}
              height={6}
              fill={strokeColor}
              opacity={0.3}
            />
            {/* Label */}
            <Text
              x={-8}
              y={height / 2 + 2}
              text={type === "washer" ? "W" : "D"}
              fontSize={10}
              fill={strokeColor}
            />
          </Group>
        );

      case "utility-sink":
        return (
          <Group key={id} {...groupProps}>
            <Rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              fill={colors.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
            {/* Basin */}
            <Rect
              x={-width / 2 + 3}
              y={-height / 2 + 3}
              width={width - 6}
              height={height - 6}
              fill="#fff"
              stroke={strokeColor}
              strokeWidth={strokeWidth * 0.5}
            />
            {/* Faucet */}
            <Circle
              x={0}
              y={-height / 2 + 4}
              radius={2}
              fill={strokeColor}
            />
          </Group>
        );

      default:
        // Generic fixture
        return (
          <Group key={id} {...groupProps}>
            <Rect
              x={-width / 2}
              y={-height / 2}
              width={width}
              height={height}
              fill={colors.fill}
              stroke={strokeColor}
              strokeWidth={strokeWidth}
            />
          </Group>
        );
    }
  };

  return (
    <Group>
      {fixtures.map((fixture) =>
        renderFixture(fixture, selectedIds.includes(fixture.id))
      )}
    </Group>
  );
}
