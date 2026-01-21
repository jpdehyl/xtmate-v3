"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Stage, Layer, Rect, Line, Circle, Text } from "react-konva";
import type Konva from "konva";
import type {
  Wall,
  Opening,
  Fixture,
  Staircase,
  SketchTool,
  ToolState,
  CanvasState,
  Point,
  SnapPoint,
} from "@/lib/geometry/types";
import { getBestSnapPoint, snapWallEndpoint } from "@/lib/geometry/snapping";
import { GridLayer } from "./layers/GridLayer";
import { WallsLayer } from "./layers/WallsLayer";
import { DoorsLayer } from "./layers/DoorsLayer";
import { WindowsLayer } from "./layers/WindowsLayer";
import { FixturesLayer } from "./layers/FixturesLayer";
import { StaircasesLayer } from "./layers/StaircasesLayer";

interface SketchCanvasProps {
  walls: Wall[];
  openings: Opening[];
  fixtures: Fixture[];
  staircases: Staircase[];
  onWallsChange: (walls: Wall[]) => void;
  onOpeningsChange: (openings: Opening[]) => void;
  onFixturesChange: (fixtures: Fixture[]) => void;
  onStaircasesChange: (staircases: Staircase[]) => void;
  toolState: ToolState;
  canvasState: CanvasState;
  onCanvasStateChange: (state: Partial<CanvasState>) => void;
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  width: number;
  height: number;
}

const WALL_THICKNESS = 6;
const PIXELS_PER_FOOT = 12; // 1 foot = 12 pixels at scale 1

export function SketchCanvas({
  walls,
  openings,
  fixtures,
  staircases,
  onWallsChange,
  onOpeningsChange,
  onFixturesChange,
  onStaircasesChange,
  toolState,
  canvasState,
  onCanvasStateChange,
  selectedIds,
  onSelectionChange,
  width,
  height,
}: SketchCanvasProps) {
  const stageRef = useRef<Konva.Stage>(null);
  const [drawingWall, setDrawingWall] = useState<Partial<Wall> | null>(null);
  const [mousePosition, setMousePosition] = useState<Point>({ x: 0, y: 0 });
  const [snapPoint, setSnapPoint] = useState<SnapPoint | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastPinchCenter = useRef<Point | null>(null);
  const lastPinchDist = useRef<number>(0);

  // Get the current mouse position in canvas coordinates
  const getCanvasPosition = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent | TouchEvent>): Point => {
      const stage = stageRef.current;
      if (!stage) return { x: 0, y: 0 };

      const pos = stage.getPointerPosition();
      if (!pos) return { x: 0, y: 0 };

      // Convert screen position to canvas coordinates
      return {
        x: (pos.x - canvasState.offsetX) / canvasState.scale,
        y: (pos.y - canvasState.offsetY) / canvasState.scale,
      };
    },
    [canvasState.offsetX, canvasState.offsetY, canvasState.scale]
  );

  // Handle mouse move
  const handleMouseMove = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      const pos = getCanvasPosition(e);
      setMousePosition(pos);

      // Find snap point if drawing or in wall mode
      if (toolState.activeTool === "wall") {
        const snap = getBestSnapPoint(
          pos,
          walls,
          canvasState.gridSize,
          canvasState.snapDistance,
          drawingWall ? [drawingWall.id || ""] : [],
          canvasState.snapToGrid
        );
        setSnapPoint(snap);
      }
    },
    [getCanvasPosition, toolState.activeTool, walls, canvasState, drawingWall]
  );

  // Handle click
  const handleClick = useCallback(
    (e: Konva.KonvaEventObject<MouseEvent>) => {
      if (isDragging) return;

      const pos = snapPoint || getCanvasPosition(e);

      switch (toolState.activeTool) {
        case "wall":
          if (!drawingWall) {
            // Start new wall
            setDrawingWall({
              id: crypto.randomUUID(),
              startX: pos.x,
              startY: pos.y,
              endX: pos.x,
              endY: pos.y,
              thickness: WALL_THICKNESS,
            });
          } else {
            // Complete wall
            const endPos = canvasState.snapToGrid
              ? snapWallEndpoint(
                  { x: drawingWall.startX!, y: drawingWall.startY! },
                  pos,
                  true
                )
              : pos;

            const newWall: Wall = {
              id: drawingWall.id!,
              startX: drawingWall.startX!,
              startY: drawingWall.startY!,
              endX: endPos.x,
              endY: endPos.y,
              thickness: WALL_THICKNESS,
            };

            // Don't add very short walls
            const length = Math.sqrt(
              Math.pow(newWall.endX - newWall.startX, 2) +
                Math.pow(newWall.endY - newWall.startY, 2)
            );

            if (length > 5) {
              onWallsChange([...walls, newWall]);
            }

            // Start new wall from endpoint
            setDrawingWall({
              id: crypto.randomUUID(),
              startX: endPos.x,
              startY: endPos.y,
              endX: endPos.x,
              endY: endPos.y,
              thickness: WALL_THICKNESS,
            });
          }
          break;

        case "select":
          // Handle selection - target will be handled by individual layers
          if (e.target === stageRef.current) {
            onSelectionChange([]);
          }
          break;
      }
    },
    [
      isDragging,
      snapPoint,
      getCanvasPosition,
      toolState.activeTool,
      drawingWall,
      canvasState.snapToGrid,
      walls,
      onWallsChange,
      onSelectionChange,
    ]
  );

  // Handle double click (finish wall drawing)
  const handleDoubleClick = useCallback(() => {
    if (toolState.activeTool === "wall" && drawingWall) {
      setDrawingWall(null);
    }
  }, [toolState.activeTool, drawingWall]);

  // Handle wheel for zoom
  const handleWheel = useCallback(
    (e: Konva.KonvaEventObject<WheelEvent>) => {
      e.evt.preventDefault();

      const stage = stageRef.current;
      if (!stage) return;

      const oldScale = canvasState.scale;
      const pointer = stage.getPointerPosition();
      if (!pointer) return;

      const mousePointTo = {
        x: (pointer.x - canvasState.offsetX) / oldScale,
        y: (pointer.y - canvasState.offsetY) / oldScale,
      };

      // Zoom in or out
      const direction = e.evt.deltaY > 0 ? -1 : 1;
      const scaleBy = 1.1;
      const newScale = direction > 0 ? oldScale * scaleBy : oldScale / scaleBy;

      // Clamp scale
      const clampedScale = Math.max(0.1, Math.min(5, newScale));

      onCanvasStateChange({
        scale: clampedScale,
        offsetX: pointer.x - mousePointTo.x * clampedScale,
        offsetY: pointer.y - mousePointTo.y * clampedScale,
      });
    },
    [canvasState.scale, canvasState.offsetX, canvasState.offsetY, onCanvasStateChange]
  );

  // Handle pan start
  const handleDragStart = useCallback(() => {
    if (toolState.activeTool === "pan") {
      setIsDragging(true);
    }
  }, [toolState.activeTool]);

  // Handle pan
  const handleDragMove = useCallback(
    (e: Konva.KonvaEventObject<DragEvent>) => {
      if (toolState.activeTool === "pan" && isDragging) {
        const stage = e.target as Konva.Stage;
        onCanvasStateChange({
          offsetX: stage.x(),
          offsetY: stage.y(),
        });
      }
    },
    [toolState.activeTool, isDragging, onCanvasStateChange]
  );

  // Handle pan end
  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Touch gestures for mobile
  const handleTouchMove = useCallback(
    (e: Konva.KonvaEventObject<TouchEvent>) => {
      const touch1 = e.evt.touches[0];
      const touch2 = e.evt.touches[1];

      if (touch1 && touch2) {
        e.evt.preventDefault();

        const center = {
          x: (touch1.clientX + touch2.clientX) / 2,
          y: (touch1.clientY + touch2.clientY) / 2,
        };

        const dist = Math.sqrt(
          Math.pow(touch1.clientX - touch2.clientX, 2) +
            Math.pow(touch1.clientY - touch2.clientY, 2)
        );

        if (!lastPinchCenter.current) {
          lastPinchCenter.current = center;
          lastPinchDist.current = dist;
          return;
        }

        // Pinch zoom
        const scale = canvasState.scale * (dist / lastPinchDist.current);
        const clampedScale = Math.max(0.1, Math.min(5, scale));

        // Pan
        const dx = center.x - lastPinchCenter.current.x;
        const dy = center.y - lastPinchCenter.current.y;

        onCanvasStateChange({
          scale: clampedScale,
          offsetX: canvasState.offsetX + dx,
          offsetY: canvasState.offsetY + dy,
        });

        lastPinchCenter.current = center;
        lastPinchDist.current = dist;
      }
    },
    [canvasState, onCanvasStateChange]
  );

  const handleTouchEnd = useCallback(() => {
    lastPinchCenter.current = null;
    lastPinchDist.current = 0;
  }, []);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (drawingWall) {
          setDrawingWall(null);
        }
        onSelectionChange([]);
      }

      if (e.key === "Delete" || e.key === "Backspace") {
        if (selectedIds.length > 0) {
          // Delete selected walls
          onWallsChange(walls.filter((w) => !selectedIds.includes(w.id)));
          // Delete selected openings
          onOpeningsChange(openings.filter((o) => !selectedIds.includes(o.id)));
          // Delete selected fixtures
          onFixturesChange(fixtures.filter((f) => !selectedIds.includes(f.id)));
          // Delete selected staircases
          onStaircasesChange(staircases.filter((s) => !selectedIds.includes(s.id)));
          onSelectionChange([]);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    drawingWall,
    selectedIds,
    walls,
    openings,
    fixtures,
    staircases,
    onWallsChange,
    onOpeningsChange,
    onFixturesChange,
    onStaircasesChange,
    onSelectionChange,
  ]);

  // Get preview wall while drawing
  const previewWall = drawingWall
    ? {
        ...drawingWall,
        endX: snapPoint?.x ?? mousePosition.x,
        endY: snapPoint?.y ?? mousePosition.y,
      }
    : null;

  return (
    <Stage
      ref={stageRef}
      width={width}
      height={height}
      x={canvasState.offsetX}
      y={canvasState.offsetY}
      scaleX={canvasState.scale}
      scaleY={canvasState.scale}
      draggable={toolState.activeTool === "pan"}
      onMouseMove={handleMouseMove}
      onClick={handleClick}
      onDblClick={handleDoubleClick}
      onWheel={handleWheel}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ cursor: toolState.activeTool === "pan" ? "grab" : "crosshair" }}
    >
      {/* Grid layer */}
      {canvasState.gridVisible && (
        <GridLayer
          width={width}
          height={height}
          gridSize={canvasState.gridSize}
          scale={canvasState.scale}
          offsetX={canvasState.offsetX}
          offsetY={canvasState.offsetY}
        />
      )}

      {/* Main content layer */}
      <Layer>
        {/* Walls */}
        <WallsLayer
          walls={walls}
          selectedIds={selectedIds}
          onSelect={(id) => onSelectionChange([id])}
          previewWall={previewWall as Wall | null}
        />

        {/* Doors */}
        <DoorsLayer
          walls={walls}
          openings={openings.filter((o) => o.type === "door")}
          selectedIds={selectedIds}
          onSelect={(id) => onSelectionChange([id])}
        />

        {/* Windows */}
        <WindowsLayer
          walls={walls}
          openings={openings.filter((o) => o.type === "window")}
          selectedIds={selectedIds}
          onSelect={(id) => onSelectionChange([id])}
        />

        {/* Fixtures */}
        <FixturesLayer
          fixtures={fixtures}
          selectedIds={selectedIds}
          onSelect={(id) => onSelectionChange([id])}
        />

        {/* Staircases */}
        <StaircasesLayer
          staircases={staircases}
          selectedIds={selectedIds}
          onSelect={(id) => onSelectionChange([id])}
        />

        {/* Snap point indicator */}
        {snapPoint && toolState.activeTool === "wall" && (
          <>
            <Circle
              x={snapPoint.x}
              y={snapPoint.y}
              radius={6 / canvasState.scale}
              fill="rgba(59, 130, 246, 0.5)"
              stroke="#3b82f6"
              strokeWidth={2 / canvasState.scale}
            />
            <Text
              x={snapPoint.x + 10 / canvasState.scale}
              y={snapPoint.y - 15 / canvasState.scale}
              text={snapPoint.type}
              fontSize={10 / canvasState.scale}
              fill="#3b82f6"
            />
          </>
        )}
      </Layer>
    </Stage>
  );
}
