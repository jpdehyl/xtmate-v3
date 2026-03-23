"use client";

import { useMemo } from "react";
import { OrbitControls, Grid, Text } from "@react-three/drei";
import * as THREE from "three";
import type { RoomViewerProps, RoomGeometry, WallGeometry } from "./types";

const WALL_THICKNESS = 0.33; // ~4 inches in feet
const WALL_COLOR = "#e8e0d4";
const FLOOR_COLOR = "#c9b99a";
const WALL_OPACITY = 0.85;

/**
 * Generate wall geometries for a rectangular room.
 * Walls are positioned around the perimeter, centered at origin.
 */
function generateRectangularRoom(
  width: number,
  length: number,
  height: number
): RoomGeometry {
  const halfW = width / 2;
  const halfL = length / 2;
  const halfH = height / 2;
  const halfT = WALL_THICKNESS / 2;

  const walls: WallGeometry[] = [
    // Back wall (along X axis at -Z)
    {
      position: [0, halfH, -(halfL - halfT)],
      size: [width, height, WALL_THICKNESS],
    },
    // Front wall (along X axis at +Z)
    {
      position: [0, halfH, halfL - halfT],
      size: [width, height, WALL_THICKNESS],
    },
    // Left wall (along Z axis at -X)
    {
      position: [-(halfW - halfT), halfH, 0],
      size: [WALL_THICKNESS, height, length - WALL_THICKNESS * 2],
    },
    // Right wall (along Z axis at +X)
    {
      position: [halfW - halfT, halfH, 0],
      size: [WALL_THICKNESS, height, length - WALL_THICKNESS * 2],
    },
  ];

  return {
    walls,
    floorSize: [width, length],
    floorPosition: [0, 0, 0],
    height,
  };
}

function Wall({ position, size }: WallGeometry) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={size} />
      <meshStandardMaterial
        color={WALL_COLOR}
        transparent
        opacity={WALL_OPACITY}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}

function Floor({
  size,
  position,
}: {
  size: [number, number];
  position: [number, number, number];
}) {
  return (
    <mesh
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={size} />
      <meshStandardMaterial color={FLOOR_COLOR} side={THREE.DoubleSide} />
    </mesh>
  );
}

function DimensionLabel({
  text,
  position,
  rotation,
}: {
  text: string;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <Text
      position={position}
      rotation={rotation}
      fontSize={0.4}
      color="#666666"
      anchorX="center"
      anchorY="middle"
      font={undefined}
    >
      {text}
    </Text>
  );
}

interface RoomSceneProps extends RoomViewerProps {
  showDimensions?: boolean;
}

export function RoomScene({
  width,
  length,
  height,
  showDimensions = true,
}: RoomSceneProps) {
  const roomGeometry = useMemo(
    () => generateRectangularRoom(width, length, height),
    [width, length, height]
  );

  const halfL = length / 2;
  const halfW = width / 2;

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[10, 15, 10]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, 10, -5]} intensity={0.3} />

      {/* Room geometry */}
      <Floor size={roomGeometry.floorSize} position={roomGeometry.floorPosition} />
      {roomGeometry.walls.map((wall, i) => (
        <Wall key={i} {...wall} />
      ))}

      {/* Dimension labels */}
      {showDimensions && (
        <>
          {/* Width label (along X, at front) */}
          <DimensionLabel
            text={`${width.toFixed(1)}'`}
            position={[0, -0.3, halfL + 0.8]}
          />
          {/* Length label (along Z, at right) */}
          <DimensionLabel
            text={`${length.toFixed(1)}'`}
            position={[halfW + 0.8, -0.3, 0]}
            rotation={[0, -Math.PI / 2, 0]}
          />
          {/* Height label (along Y, at front-right corner) */}
          <DimensionLabel
            text={`${height.toFixed(1)}'`}
            position={[halfW + 0.8, height / 2, halfL + 0.8]}
          />
        </>
      )}

      {/* Grid on the floor plane */}
      <Grid
        position={[0, -0.01, 0]}
        args={[50, 50]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#aaaaaa"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#888888"
        fadeDistance={30}
        fadeStrength={1}
        infiniteGrid
      />

      {/* Camera controls */}
      <OrbitControls
        makeDefault
        minPolarAngle={0.1}
        maxPolarAngle={Math.PI / 2 - 0.05}
        minDistance={3}
        maxDistance={50}
        target={[0, height / 3, 0]}
      />
    </>
  );
}
