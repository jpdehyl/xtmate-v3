"use client";

import { cn } from "@/lib/utils";
import type { SketchTool, ToolState, DoorType, WindowType, FixtureCategory, FixtureType, StaircaseType } from "@/lib/geometry/types";

interface ToolbarProps {
  toolState: ToolState;
  onToolChange: (tool: SketchTool) => void;
  onToolStateChange: (updates: Partial<ToolState>) => void;
  gridVisible: boolean;
  onGridToggle: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
}

interface ToolButtonProps {
  tool: SketchTool;
  activeTool: SketchTool;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  shortcut: string;
}

function ToolButton({ tool, activeTool, onClick, icon, label, shortcut }: ToolButtonProps) {
  const isActive = tool === activeTool;

  return (
    <button
      onClick={onClick}
      title={`${label} (${shortcut})`}
      className={cn(
        "p-2 rounded-lg transition-colors flex flex-col items-center gap-1",
        isActive
          ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300"
          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
      )}
    >
      {icon}
      <span className="text-xs">{label}</span>
    </button>
  );
}

const DOOR_TYPES: { value: DoorType; label: string }[] = [
  { value: "single", label: "Single" },
  { value: "double", label: "Double" },
  { value: "pocket", label: "Pocket" },
  { value: "bi-fold", label: "Bi-Fold" },
  { value: "sliding", label: "Sliding" },
];

const WINDOW_TYPES: { value: WindowType; label: string }[] = [
  { value: "hung", label: "Hung" },
  { value: "casement", label: "Casement" },
  { value: "sliding", label: "Sliding" },
  { value: "picture", label: "Picture" },
];

const FIXTURE_OPTIONS: { category: FixtureCategory; types: { value: FixtureType; label: string }[] }[] = [
  {
    category: "kitchen",
    types: [
      { value: "sink", label: "Sink" },
      { value: "stove", label: "Stove" },
      { value: "fridge", label: "Fridge" },
      { value: "dishwasher", label: "Dishwasher" },
      { value: "island", label: "Island" },
    ],
  },
  {
    category: "bathroom",
    types: [
      { value: "toilet", label: "Toilet" },
      { value: "tub", label: "Tub" },
      { value: "shower", label: "Shower" },
      { value: "vanity", label: "Vanity" },
    ],
  },
  {
    category: "laundry",
    types: [
      { value: "washer", label: "Washer" },
      { value: "dryer", label: "Dryer" },
      { value: "utility-sink", label: "Utility Sink" },
    ],
  },
];

const STAIRCASE_TYPES: { value: StaircaseType; label: string }[] = [
  { value: "straight", label: "Straight" },
  { value: "l-shaped", label: "L-Shaped" },
  { value: "u-shaped", label: "U-Shaped" },
];

export function Toolbar({
  toolState,
  onToolChange,
  onToolStateChange,
  gridVisible,
  onGridToggle,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
}: ToolbarProps) {
  const { activeTool, doorType, windowType, fixtureCategory, fixtureType, staircaseType } = toolState;

  return (
    <div className="flex flex-col gap-4 p-3 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 w-20">
      {/* Primary tools */}
      <div className="flex flex-col gap-1">
        <ToolButton
          tool="select"
          activeTool={activeTool}
          onClick={() => onToolChange("select")}
          shortcut="V"
          label="Select"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
            </svg>
          }
        />

        <ToolButton
          tool="wall"
          activeTool={activeTool}
          onClick={() => onToolChange("wall")}
          shortcut="W"
          label="Wall"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6z" />
            </svg>
          }
        />

        <ToolButton
          tool="door"
          activeTool={activeTool}
          onClick={() => onToolChange("door")}
          shortcut="D"
          label="Door"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 4H6a2 2 0 00-2 2v12a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-2m-4-1v8m0 0l-3-3m3 3l3-3" />
            </svg>
          }
        />

        <ToolButton
          tool="window"
          activeTool={activeTool}
          onClick={() => onToolChange("window")}
          shortcut="O"
          label="Window"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm8 0v14M4 12h16" />
            </svg>
          }
        />

        <ToolButton
          tool="fixture"
          activeTool={activeTool}
          onClick={() => onToolChange("fixture")}
          shortcut="F"
          label="Fixture"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          }
        />

        <ToolButton
          tool="staircase"
          activeTool={activeTool}
          onClick={() => onToolChange("staircase")}
          shortcut="S"
          label="Stairs"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21h18M3 21V8l6-3v16M9 21V5l6-3v19M15 21V2l6 3v16" />
            </svg>
          }
        />
      </div>

      {/* Separator */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Navigation tools */}
      <div className="flex flex-col gap-1">
        <ToolButton
          tool="pan"
          activeTool={activeTool}
          onClick={() => onToolChange("pan")}
          shortcut="P"
          label="Pan"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11" />
            </svg>
          }
        />

        <ToolButton
          tool="measure"
          activeTool={activeTool}
          onClick={() => onToolChange("measure")}
          shortcut="M"
          label="Measure"
          icon={
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          }
        />
      </div>

      {/* Separator */}
      <div className="border-t border-gray-200 dark:border-gray-700" />

      {/* Grid toggle */}
      <button
        onClick={onGridToggle}
        title={`Toggle Grid (G) - ${gridVisible ? "On" : "Off"}`}
        className={cn(
          "p-2 rounded-lg transition-colors flex flex-col items-center gap-1",
          gridVisible
            ? "bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            : "text-gray-400 dark:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
        )}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
        </svg>
        <span className="text-xs">Grid</span>
      </button>

      {/* Tool options panel - appears below based on active tool */}
      {activeTool === "door" && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Door Type</p>
          <select
            value={doorType}
            onChange={(e) => onToolStateChange({ doorType: e.target.value as DoorType })}
            className="w-full text-xs p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
          >
            {DOOR_TYPES.map((dt) => (
              <option key={dt.value} value={dt.value}>
                {dt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {activeTool === "window" && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Window Type</p>
          <select
            value={windowType}
            onChange={(e) => onToolStateChange({ windowType: e.target.value as WindowType })}
            className="w-full text-xs p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
          >
            {WINDOW_TYPES.map((wt) => (
              <option key={wt.value} value={wt.value}>
                {wt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {activeTool === "fixture" && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Fixture</p>
          <select
            value={fixtureCategory}
            onChange={(e) => {
              const cat = e.target.value as FixtureCategory;
              const firstType = FIXTURE_OPTIONS.find((f) => f.category === cat)?.types[0].value;
              onToolStateChange({ fixtureCategory: cat, fixtureType: firstType || "sink" });
            }}
            className="w-full text-xs p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 mb-1"
          >
            <option value="kitchen">Kitchen</option>
            <option value="bathroom">Bathroom</option>
            <option value="laundry">Laundry</option>
          </select>
          <select
            value={fixtureType}
            onChange={(e) => onToolStateChange({ fixtureType: e.target.value as FixtureType })}
            className="w-full text-xs p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
          >
            {FIXTURE_OPTIONS.find((f) => f.category === fixtureCategory)?.types.map((ft) => (
              <option key={ft.value} value={ft.value}>
                {ft.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {activeTool === "staircase" && (
        <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Stair Type</p>
          <select
            value={staircaseType}
            onChange={(e) => onToolStateChange({ staircaseType: e.target.value as StaircaseType })}
            className="w-full text-xs p-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
          >
            {STAIRCASE_TYPES.map((st) => (
              <option key={st.value} value={st.value}>
                {st.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
