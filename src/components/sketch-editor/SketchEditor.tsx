"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import type { Level, Room } from "@/lib/db/schema";
import type {
  Wall,
  Opening,
  Fixture,
  Staircase,
  SketchTool,
  ToolState,
  CanvasState,
  SketchGeometry,
} from "@/lib/geometry/types";
import { Toolbar } from "./Toolbar";
import { LevelTabs } from "./LevelTabs";
import { detectRooms, getPolygonCentroid } from "@/lib/geometry/room-detection";

// Dynamically import SketchCanvas to avoid SSR issues with Konva
const SketchCanvas = dynamic(
  () => import("./SketchCanvas").then((mod) => mod.SketchCanvas),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full">Loading canvas...</div> }
);

interface SketchEditorProps {
  estimateId: string;
  onClose: () => void;
  onSaveRooms: (rooms: Partial<Room>[]) => void;
}

const DEFAULT_TOOL_STATE: ToolState = {
  activeTool: "select",
  doorType: "single",
  windowType: "hung",
  fixtureCategory: "kitchen",
  fixtureType: "sink",
  staircaseType: "straight",
};

const DEFAULT_CANVAS_STATE: CanvasState = {
  scale: 1,
  offsetX: 100,
  offsetY: 100,
  gridVisible: true,
  gridSize: 12, // 1 inch = 1 pixel, 12 pixels = 1 foot
  snapToGrid: true,
  snapDistance: 10,
};

export function SketchEditor({ estimateId, onClose, onSaveRooms }: SketchEditorProps) {
  // State for levels and rooms
  const [levels, setLevels] = useState<Level[]>([]);
  const [activeLevel, setActiveLevel] = useState<string | null>(null);
  const [rooms, setRooms] = useState<Room[]>([]);

  // Geometry state (per level)
  const [geometryByLevel, setGeometryByLevel] = useState<Record<string, SketchGeometry>>({});

  // Current level's geometry
  const [walls, setWalls] = useState<Wall[]>([]);
  const [openings, setOpenings] = useState<Opening[]>([]);
  const [fixtures, setFixtures] = useState<Fixture[]>([]);
  const [staircases, setStaircases] = useState<Staircase[]>([]);

  // Tool and canvas state
  const [toolState, setToolState] = useState<ToolState>(DEFAULT_TOOL_STATE);
  const [canvasState, setCanvasState] = useState<CanvasState>(DEFAULT_CANVAS_STATE);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Editor dimensions
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 });

  // Loading state
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch levels on mount
  useEffect(() => {
    async function fetchLevels() {
      try {
        const response = await fetch(`/api/estimates/${estimateId}/levels`);
        if (!response.ok) throw new Error("Failed to fetch levels");
        const data = await response.json();

        if (data.length === 0) {
          // Create default first floor level
          const createRes = await fetch(`/api/estimates/${estimateId}/levels`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: "1", label: "First Floor" }),
          });

          if (!createRes.ok) throw new Error("Failed to create default level");
          const newLevel = await createRes.json();
          setLevels([newLevel]);
          setActiveLevel(newLevel.id);
        } else {
          setLevels(data);
          setActiveLevel(data[0].id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load levels");
      } finally {
        setIsLoading(false);
      }
    }

    fetchLevels();
  }, [estimateId]);

  // Fetch rooms and load geometry when active level changes
  useEffect(() => {
    if (!activeLevel) return;

    // Save current level's geometry before switching
    if (activeLevel && walls.length > 0) {
      setGeometryByLevel((prev) => ({
        ...prev,
        [activeLevel]: {
          walls,
          openings,
          fixtures,
          staircases,
          detectedRooms: [],
        },
      }));
    }

    // Load new level's geometry
    const levelGeometry = geometryByLevel[activeLevel];
    if (levelGeometry) {
      setWalls(levelGeometry.walls);
      setOpenings(levelGeometry.openings);
      setFixtures(levelGeometry.fixtures);
      setStaircases(levelGeometry.staircases);
    } else {
      setWalls([]);
      setOpenings([]);
      setFixtures([]);
      setStaircases([]);
    }

    // Fetch existing rooms for this level
    async function fetchRooms() {
      try {
        const response = await fetch(`/api/estimates/${estimateId}/rooms?levelId=${activeLevel}`);
        if (response.ok) {
          const data = await response.json();
          setRooms(data);

          // Load geometry from rooms if available
          data.forEach((room: Room) => {
            if (room.geometry) {
              const geo = room.geometry as SketchGeometry;
              if (geo.walls) setWalls(geo.walls);
              if (geo.openings) setOpenings(geo.openings);
              if (geo.fixtures) setFixtures(geo.fixtures);
              if (geo.staircases) setStaircases(geo.staircases);
            }
          });
        }
      } catch (err) {
        console.error("Failed to fetch rooms:", err);
      }
    }

    fetchRooms();
  }, [activeLevel, estimateId]);

  // Update dimensions on resize
  useEffect(() => {
    function updateDimensions() {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setDimensions({
          width: rect.width,
          height: rect.height,
        });
      }
    }

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Ignore if typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      const key = e.key.toLowerCase();
      const shortcuts: Record<string, SketchTool | "grid"> = {
        v: "select",
        w: "wall",
        d: "door",
        o: "window",
        f: "fixture",
        s: "staircase",
        m: "measure",
        p: "pan",
        g: "grid",
      };

      if (shortcuts[key]) {
        e.preventDefault();
        if (shortcuts[key] === "grid") {
          setCanvasState((prev) => ({ ...prev, gridVisible: !prev.gridVisible }));
        } else {
          setToolState((prev) => ({ ...prev, activeTool: shortcuts[key] as SketchTool }));
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Level management
  const handleAddLevel = async (name: string, label: string) => {
    try {
      const response = await fetch(`/api/estimates/${estimateId}/levels`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, label }),
      });

      if (!response.ok) throw new Error("Failed to add level");
      const newLevel = await response.json();
      setLevels([...levels, newLevel]);
      setActiveLevel(newLevel.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add level");
    }
  };

  const handleRemoveLevel = async (levelId: string) => {
    try {
      const response = await fetch(`/api/estimates/${estimateId}/levels/${levelId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to remove level");

      const newLevels = levels.filter((l) => l.id !== levelId);
      setLevels(newLevels);

      if (activeLevel === levelId && newLevels.length > 0) {
        setActiveLevel(newLevels[0].id);
      }

      // Remove geometry for this level
      setGeometryByLevel((prev) => {
        const newGeo = { ...prev };
        delete newGeo[levelId];
        return newGeo;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove level");
    }
  };

  const handleRenameLevel = async (levelId: string, name: string, label: string) => {
    try {
      const response = await fetch(`/api/estimates/${estimateId}/levels/${levelId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, label }),
      });

      if (!response.ok) throw new Error("Failed to rename level");
      const updated = await response.json();
      setLevels(levels.map((l) => (l.id === levelId ? updated : l)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename level");
    }
  };

  // Save rooms
  const handleSave = async () => {
    setIsSaving(true);
    setError(null);

    try {
      // Detect rooms from walls
      const detectedRooms = detectRooms(walls);

      // Create room data for each detected room
      const roomsToSave = detectedRooms.map((polygon, index) => {
        const centroid = getPolygonCentroid(polygon.points);
        return {
          levelId: activeLevel,
          name: `Room ${index + 1}`,
          squareFeet: polygon.area,
          perimeterLf: polygon.perimeter,
          geometry: {
            walls,
            openings,
            fixtures,
            staircases,
            polygon: polygon.points,
          },
        };
      });

      onSaveRooms(roomsToSave);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save rooms");
    } finally {
      setIsSaving(false);
    }
  };

  // Tool change handlers
  const handleToolChange = (tool: SketchTool) => {
    setToolState((prev) => ({ ...prev, activeTool: tool }));
    setSelectedIds([]);
  };

  const handleToolStateChange = (updates: Partial<ToolState>) => {
    setToolState((prev) => ({ ...prev, ...updates }));
  };

  const handleCanvasStateChange = (updates: Partial<CanvasState>) => {
    setCanvasState((prev) => ({ ...prev, ...updates }));
  };

  if (isLoading) {
    return (
      <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Loading sketch editor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-2 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
        <div className="flex items-center gap-4">
          <button
            onClick={onClose}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100"
          >
            &larr; Back
          </button>
          <h1 className="text-lg font-semibold">Sketch Editor</h1>
        </div>

        <div className="flex items-center gap-4">
          {error && (
            <span className="text-sm text-red-600 dark:text-red-400">{error}</span>
          )}

          <div className="text-sm text-gray-500 dark:text-gray-400">
            Zoom: {Math.round(canvasState.scale * 100)}%
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving ? "Saving..." : "Save & Close"}
          </button>
        </div>
      </header>

      {/* Level tabs */}
      <LevelTabs
        levels={levels}
        activeLevel={activeLevel}
        onLevelChange={setActiveLevel}
        onAddLevel={handleAddLevel}
        onRemoveLevel={handleRemoveLevel}
        onRenameLevel={handleRenameLevel}
      />

      {/* Main content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Toolbar */}
        <Toolbar
          toolState={toolState}
          onToolChange={handleToolChange}
          onToolStateChange={handleToolStateChange}
          gridVisible={canvasState.gridVisible}
          onGridToggle={() => handleCanvasStateChange({ gridVisible: !canvasState.gridVisible })}
        />

        {/* Canvas */}
        <div ref={containerRef} className="flex-1 overflow-hidden">
          <SketchCanvas
            walls={walls}
            openings={openings}
            fixtures={fixtures}
            staircases={staircases}
            onWallsChange={setWalls}
            onOpeningsChange={setOpenings}
            onFixturesChange={setFixtures}
            onStaircasesChange={setStaircases}
            toolState={toolState}
            canvasState={canvasState}
            onCanvasStateChange={handleCanvasStateChange}
            selectedIds={selectedIds}
            onSelectionChange={setSelectedIds}
            width={dimensions.width}
            height={dimensions.height}
          />
        </div>
      </div>

      {/* Status bar */}
      <footer className="flex items-center justify-between px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-xs text-gray-600 dark:text-gray-400">
        <div className="flex items-center gap-4">
          <span>{walls.length} walls</span>
          <span>{openings.length} openings</span>
          <span>{fixtures.length} fixtures</span>
          <span>{staircases.length} stairs</span>
        </div>

        <div className="flex items-center gap-4">
          <span>Grid: {canvasState.gridVisible ? "On" : "Off"}</span>
          <span>Snap: {canvasState.snapToGrid ? "On" : "Off"}</span>
          <span>
            Press <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">W</kbd> for walls,{" "}
            <kbd className="px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-xs">Esc</kbd> to cancel
          </span>
        </div>
      </footer>
    </div>
  );
}
