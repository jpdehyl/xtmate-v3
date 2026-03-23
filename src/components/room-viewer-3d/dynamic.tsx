"use client";

import dynamic from "next/dynamic";
import type { Room } from "@/lib/db/schema";

const RoomViewer3DComponent = dynamic(
  () => import("./index").then((mod) => ({ default: mod.RoomViewer3D })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg border border-gray-200">
        <p className="text-gray-400 animate-pulse">Loading 3D viewer...</p>
      </div>
    ),
  }
);

export function RoomViewer3DDynamic({ room }: { room: Room }) {
  return <RoomViewer3DComponent room={room} />;
}
