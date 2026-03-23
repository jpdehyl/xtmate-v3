'use client';

import React, { Suspense, useMemo } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import type { Room } from '@/lib/db/schema';
import type { ScanScene, ScanWall } from '@/lib/scan/types';
import { dimensionsToScanScene } from '@/lib/scan/types';
import { getMaterialColor, getFloorColor, getCeilingColor } from './adapters';

interface Room3DViewerProps {
  room: Room;
  isLoading?: boolean;
  error?: string | null;
  showGrid?: boolean;
}

// ─────────────────────────────────────────────
// Scene Components
// ─────────────────────────────────────────────

/** Render a single wall as a box mesh */
function WallMesh({ wall, color }: { wall: ScanWall; color: number }) {
  const dx = wall.end.x - wall.start.x;
  const dz = wall.end.z - wall.start.z;
  const length = Math.sqrt(dx * dx + dz * dz);
  const angle = Math.atan2(dx, dz); // rotation around Y axis

  const cx = (wall.start.x + wall.end.x) / 2;
  const cy = wall.height / 2;
  const cz = (wall.start.z + wall.end.z) / 2;

  return (
    <mesh position={[cx, cy, cz]} rotation={[0, angle, 0]} castShadow receiveShadow>
      <boxGeometry args={[wall.thickness, wall.height, length]} />
      <meshStandardMaterial color={color} roughness={0.8} metalness={0} />
    </mesh>
  );
}

/** Render floor slab from polygon */
function SlabMesh({ polygon, color }: { polygon: { x: number; z: number }[]; color: number }) {
  const shape = useMemo(() => {
    const s = new THREE.Shape();
    if (polygon.length < 3) return s;
    s.moveTo(polygon[0].x, polygon[0].z);
    for (let i = 1; i < polygon.length; i++) {
      s.lineTo(polygon[i].x, polygon[i].z);
    }
    s.closePath();
    return s;
  }, [polygon]);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
      <shapeGeometry args={[shape]} />
      <meshStandardMaterial color={color} roughness={0.8} metalness={0.05} />
    </mesh>
  );
}

/** Main scene content from a ScanScene */
function SceneContent({
  scene,
  room,
  showGrid,
}: {
  scene: ScanScene;
  room: Room;
  showGrid: boolean;
}) {
  const level = scene.levels[0];
  if (!level) return null;

  const bbox = level.boundingBox ?? { width: 4, length: 4, height: 2.4 };
  const maxDim = Math.max(bbox.width, bbox.length, bbox.height);

  const wallColor = getMaterialColor(room.wallMaterial ?? undefined);
  const floorColor = getFloorColor(room.floorMaterial ?? undefined);

  return (
    <>
      <ambientLight intensity={0.55} />
      <directionalLight
        position={[5, 8, 5]}
        intensity={0.85}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-4, 6, -4]} intensity={0.3} />

      {/* Grid */}
      {showGrid && (
        <primitive
          object={new THREE.GridHelper(maxDim * 2, 20, 0x888888, 0xcccccc)}
          position={[0, -0.01, 0]}
        />
      )}

      {/* Walls */}
      {level.walls.map((wall) => (
        <WallMesh key={wall.id} wall={wall} color={wallColor} />
      ))}

      {/* Floor slab */}
      {level.slab && (
        <SlabMesh polygon={level.slab.polygon} color={floorColor} />
      )}

      {/* Camera */}
      <PerspectiveCamera
        makeDefault
        position={[bbox.width * 0.9, bbox.height * 0.8, bbox.length * 0.9]}
        fov={50}
        near={0.05}
        far={500}
      />
      <OrbitControls
        enableDamping
        dampingFactor={0.06}
        target={[0, bbox.height / 2, 0]}
        minDistance={0.5}
        maxDistance={maxDim * 4}
      />
    </>
  );
}

// ─────────────────────────────────────────────
// Fallbacks
// ─────────────────────────────────────────────

function LoadingFallback() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-gray-50 rounded-lg">
      <div className="text-center">
        <div className="inline-block w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-2" />
        <p className="text-sm text-gray-500">Loading 3D view…</p>
      </div>
    </div>
  );
}

function ErrorFallback({ message }: { message: string }) {
  return (
    <div className="w-full h-full flex items-center justify-center bg-red-50 rounded-lg border border-red-200">
      <p className="text-sm text-red-600 px-4 text-center">{message}</p>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────

export function RoomViewer3D({ room, isLoading, error, showGrid = true }: Room3DViewerProps) {
  if (error) return <ErrorFallback message={error} />;
  if (isLoading) return <LoadingFallback />;

  // Resolve scene: prefer stored ScanScene, fall back to building from dimensions
  let scene: ScanScene | null = null;

  const geo = room.geometry as Record<string, unknown> | null;
  if (geo && geo.version === 'xtmate-scan-v1') {
    scene = geo as unknown as ScanScene;
  } else if (room.widthIn && room.lengthIn) {
    scene = dimensionsToScanScene({
      widthIn: room.widthIn,
      lengthIn: room.lengthIn,
      heightIn: room.heightIn ?? 96,
    });
  }

  if (!scene) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-amber-50 rounded-lg border border-amber-200">
        <p className="text-sm text-amber-700">Add room dimensions to enable 3D view</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-gray-200 bg-gray-900">
      <Suspense fallback={<LoadingFallback />}>
        <Canvas shadows dpr={[1, 1.5]} gl={{ antialias: true }}>
          <SceneContent scene={scene} room={room} showGrid={showGrid} />
        </Canvas>
      </Suspense>
    </div>
  );
}
