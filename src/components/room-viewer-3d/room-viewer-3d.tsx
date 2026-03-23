'use client';

import React, { Suspense, useCallback, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { Room } from '@/lib/db/schema';
import { adaptRoomDataTo3D, feetToMeters, getMaterialColor, getFloorColor, getCeilingColor } from './adapters';

interface Room3DViewerProps {
  room: Room;
  isLoading?: boolean;
  error?: string | null;
  showGrid?: boolean;
  showHelpers?: boolean;
}

/**
 * Scene Content Component
 * Renders the 3D room geometry
 */
function SceneContent({ room, showGrid = true, showHelpers = true }: { room: Room; showGrid?: boolean; showHelpers?: boolean }) {
  const geometry = useMemo(() => adaptRoomDataTo3D(room), [room]);

  // Convert feet to meters for Three.js
  const widthM = feetToMeters(geometry.width);
  const lengthM = feetToMeters(geometry.length);
  const heightM = feetToMeters(geometry.height);

  // Center the room at origin
  const offsetX = -widthM / 2;
  const offsetY = -lengthM / 2;

  const floorColor = getFloorColor(room.floorMaterial);
  const wallColor = getMaterialColor(room.wallMaterial);
  const ceilingColor = getCeilingColor(room.ceilingMaterial);

  return (
    <>
      {/* Ambient light */}
      <ambientLight intensity={0.6} />

      {/* Directional light (sun-like) */}
      <directionalLight position={[5, 8, 5]} intensity={0.8} castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />

      {/* Grid helper — using native Three.js via primitive */}
      {showGrid && (
        <primitive
          object={new THREE.GridHelper(Math.max(widthM, lengthM) * 1.5, 20)}
          position={[0, 0, 0]}
        />
      )}

      {/* Floor (slab) — rotated to XZ plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[offsetX + widthM / 2, -0.05, offsetY + lengthM / 2]} receiveShadow>
        <planeGeometry args={[widthM, lengthM]} />
        <meshStandardMaterial color={floorColor} metalness={0.1} roughness={0.8} />
      </mesh>

      {/* Walls */}
      <RoomWalls
        width={widthM}
        length={lengthM}
        height={heightM}
        wallColor={wallColor}
        offsetX={offsetX}
        offsetY={offsetY}
      />

      {/* Ceiling — rotated to XZ plane, flipped to face down */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[offsetX + widthM / 2, heightM, offsetY + lengthM / 2]} receiveShadow>
        <planeGeometry args={[widthM, lengthM]} />
        <meshStandardMaterial color={ceilingColor} metalness={0.05} roughness={0.9} side={THREE.BackSide} />
      </mesh>

      {/* Orbit controls */}
      <OrbitControls enableDamping dampingFactor={0.05} enableZoom enablePan autoRotate={false} />

      {/* Camera */}
      <PerspectiveCamera
        makeDefault
        position={[widthM * 0.7, heightM * 0.6, lengthM * 0.7]}
        fov={50}
        near={0.1}
        far={1000}
      />
    </>
  );
}

/**
 * Room Walls Component
 * Renders all 4 walls of the rectangular room
 */
function RoomWalls({
  width,
  length,
  height,
  wallColor,
  offsetX,
  offsetY,
}: {
  width: number;
  length: number;
  height: number;
  wallColor: number;
  offsetX: number;
  offsetY: number;
}) {
  return (
    <>
      {/* Back wall (along length, at x=0) */}
      <mesh position={[offsetX, height / 2, offsetY + length / 2]} castShadow receiveShadow>
        <planeGeometry args={[0.05, height]} />
        <meshStandardMaterial color={wallColor} metalness={0} roughness={0.8} />
      </mesh>
      <mesh position={[offsetX, height / 2, offsetY + length / 2]} castShadow receiveShadow>
        <boxGeometry args={[0.05, height, length]} />
        <meshStandardMaterial color={wallColor} metalness={0} roughness={0.8} />
      </mesh>

      {/* Front wall (along length, at x=width) */}
      <mesh position={[offsetX + width, height / 2, offsetY + length / 2]} castShadow receiveShadow>
        <boxGeometry args={[0.05, height, length]} />
        <meshStandardMaterial color={wallColor} metalness={0} roughness={0.8} />
      </mesh>

      {/* Left wall (along width, at y=0) */}
      <mesh position={[offsetX + width / 2, height / 2, offsetY]} castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.05]} />
        <meshStandardMaterial color={wallColor} metalness={0} roughness={0.8} />
      </mesh>

      {/* Right wall (along width, at y=length) */}
      <mesh position={[offsetX + width / 2, height / 2, offsetY + length]} castShadow receiveShadow>
        <boxGeometry args={[width, height, 0.05]} />
        <meshStandardMaterial color={wallColor} metalness={0} roughness={0.8} />
      </mesh>
    </>
  );
}

/**
 * Error Boundary Fallback
 */
function ErrorFallback({ error }: { error: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
      <div className="text-center px-4">
        <p className="text-red-700 dark:text-red-400 font-medium">3D View Error</p>
        <p className="text-sm text-red-600 dark:text-red-300 mt-1">{error}</p>
      </div>
    </div>
  );
}

/**
 * Loading Fallback
 */
function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded-lg">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-sm text-gray-600 dark:text-gray-400">Loading 3D view...</p>
      </div>
    </div>
  );
}

/**
 * RoomViewer3D Component
 * 
 * Renders a 3D visualization of a room using React Three Fiber.
 * Displays floor, walls, ceiling with materials and lighting.
 * 
 * Props:
 * - room: Room data from XtMate
 * - isLoading?: Show loading state
 * - error?: Display error message
 * - showGrid?: Show floor grid (default true)
 * - showHelpers?: Show debug helpers (default true)
 */
export function RoomViewer3D({
  room,
  isLoading = false,
  error = null,
  showGrid = true,
  showHelpers = true,
}: Room3DViewerProps) {
  if (error) {
    return <ErrorFallback error={error} />;
  }

  if (isLoading) {
    return <LoadingFallback />;
  }

  // Validate room has required dimensions
  if (!room.widthIn || !room.lengthIn) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
        <div className="text-center px-4">
          <p className="text-amber-700 dark:text-amber-400 font-medium">Missing Dimensions</p>
          <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">Room width and length are required for 3D view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-900">
      <Suspense fallback={<LoadingFallback />}>
        <Canvas shadows dpr={[1, 2]} gl={{ antialias: true, alpha: false }}>
          <SceneContent room={room} showGrid={showGrid} showHelpers={showHelpers} />
        </Canvas>
      </Suspense>
    </div>
  );
}

export type { Room3DViewerProps };
