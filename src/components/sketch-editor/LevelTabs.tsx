"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import type { Level } from "@/lib/db/schema";

interface LevelTabsProps {
  levels: Level[];
  activeLevel: string | null;
  onLevelChange: (levelId: string) => void;
  onAddLevel: (name: string, label: string) => void;
  onRemoveLevel: (levelId: string) => void;
  onRenameLevel: (levelId: string, name: string, label: string) => void;
}

const DEFAULT_LEVELS = [
  { name: "B", label: "Basement" },
  { name: "1", label: "First Floor" },
  { name: "2", label: "Second Floor" },
  { name: "3", label: "Third Floor" },
  { name: "A", label: "Attic" },
];

export function LevelTabs({
  levels,
  activeLevel,
  onLevelChange,
  onAddLevel,
  onRemoveLevel,
  onRenameLevel,
}: LevelTabsProps) {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [editingLevel, setEditingLevel] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  // Get available levels to add (ones not already added)
  const existingNames = new Set(levels.map((l) => l.name));
  const availableLevels = DEFAULT_LEVELS.filter((l) => !existingNames.has(l.name));

  const handleAddLevel = (name: string, label: string) => {
    onAddLevel(name, label);
    setShowAddMenu(false);
  };

  const handleStartEdit = (level: Level) => {
    setEditingLevel(level.id);
    setEditLabel(level.label || level.name);
  };

  const handleSaveEdit = (levelId: string, name: string) => {
    onRenameLevel(levelId, name, editLabel);
    setEditingLevel(null);
    setEditLabel("");
  };

  return (
    <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      {/* Level tabs */}
      <div className="flex items-center gap-1">
        {levels
          .sort((a, b) => (a.order || 0) - (b.order || 0))
          .map((level) => (
            <div
              key={level.id}
              className={cn(
                "group relative flex items-center gap-1 px-3 py-1.5 rounded-t-lg cursor-pointer transition-colors",
                activeLevel === level.id
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 shadow-sm"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
              onClick={() => onLevelChange(level.id)}
            >
              {editingLevel === level.id ? (
                <input
                  type="text"
                  value={editLabel}
                  onChange={(e) => setEditLabel(e.target.value)}
                  onBlur={() => handleSaveEdit(level.id, level.name)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleSaveEdit(level.id, level.name);
                    } else if (e.key === "Escape") {
                      setEditingLevel(null);
                    }
                  }}
                  autoFocus
                  className="w-20 px-1 py-0.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800"
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <>
                  <span className="text-sm font-medium">
                    {level.label || `Level ${level.name}`}
                  </span>

                  {/* Edit/delete buttons (visible on hover) */}
                  <div className="hidden group-hover:flex items-center gap-0.5 ml-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleStartEdit(level);
                      }}
                      className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      title="Rename level"
                    >
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    {levels.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveLevel(level.id);
                        }}
                        className="p-0.5 text-gray-400 hover:text-red-500"
                        title="Remove level"
                      >
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
      </div>

      {/* Add level button */}
      {availableLevels.length > 0 && (
        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="p-1.5 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            title="Add level"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Dropdown menu */}
          {showAddMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowAddMenu(false)}
              />
              <div className="absolute left-0 top-full mt-1 z-20 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-1 min-w-32">
                {availableLevels.map((level) => (
                  <button
                    key={level.name}
                    onClick={() => handleAddLevel(level.name, level.label)}
                    className="w-full px-3 py-1.5 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300"
                  >
                    {level.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Level info */}
      <div className="ml-auto text-xs text-gray-500 dark:text-gray-400">
        {levels.length} level{levels.length !== 1 ? "s" : ""}
      </div>
    </div>
  );
}
