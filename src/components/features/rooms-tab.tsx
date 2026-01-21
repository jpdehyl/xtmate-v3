"use client";

import { useState, useEffect } from "react";
import type { Room, Level } from "@/lib/db/schema";
import { ROOM_CATEGORIES } from "@/lib/geometry/types";

interface RoomsTabProps {
  estimateId: string;
  isOnline: boolean;
  onOpenSketchEditor: () => void;
}

interface RoomCardProps {
  room: Room;
  onEdit: (room: Room) => void;
  onDelete: (roomId: string) => void;
}

function RoomCard({ room, onEdit, onDelete }: RoomCardProps) {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-gray-300 dark:hover:border-gray-600 transition-colors">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 dark:text-gray-100 truncate">
              {room.name}
            </h4>
            {room.category && (
              <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded">
                {room.category}
              </span>
            )}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
            {room.squareFeet && (
              <p>Area: {room.squareFeet.toFixed(1)} sq ft</p>
            )}
            {room.lengthIn && room.widthIn && (
              <p>
                Dimensions: {(room.lengthIn / 12).toFixed(1)}{"'"} x{" "}
                {(room.widthIn / 12).toFixed(1)}{`' x `}
                {room.heightIn ? `${(room.heightIn / 12).toFixed(1)}'` : "8'"}
              </p>
            )}
            {room.perimeterLf && (
              <p>Perimeter: {room.perimeterLf.toFixed(1)} LF</p>
            )}
          </div>
          {(room.floorMaterial || room.wallMaterial || room.ceilingMaterial) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {room.floorMaterial && (
                <span className="text-xs px-1.5 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 rounded">
                  Floor: {room.floorMaterial}
                </span>
              )}
              {room.wallMaterial && (
                <span className="text-xs px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 rounded">
                  Walls: {room.wallMaterial}
                </span>
              )}
              {room.ceilingMaterial && (
                <span className="text-xs px-1.5 py-0.5 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 rounded">
                  Ceiling: {room.ceilingMaterial}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="flex gap-1">
          <button
            onClick={() => onEdit(room)}
            className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            title="Edit room"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            onClick={() => onDelete(room.id)}
            className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
            title="Delete room"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

interface AddRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: NewRoomData) => void;
  levels: Level[];
  editingRoom?: Room | null;
}

interface NewRoomData {
  name: string;
  category?: string;
  levelId?: string;
  lengthIn?: number;
  widthIn?: number;
  heightIn?: number;
  floorMaterial?: string;
  wallMaterial?: string;
  ceilingMaterial?: string;
}

function AddRoomModal({ isOpen, onClose, onSave, levels, editingRoom }: AddRoomModalProps) {
  const [formData, setFormData] = useState<NewRoomData>({
    name: "",
    category: "",
    levelId: "",
    lengthIn: undefined,
    widthIn: undefined,
    heightIn: 96,
    floorMaterial: "",
    wallMaterial: "",
    ceilingMaterial: "",
  });

  useEffect(() => {
    if (editingRoom) {
      setFormData({
        name: editingRoom.name,
        category: editingRoom.category || "",
        levelId: editingRoom.levelId || "",
        lengthIn: editingRoom.lengthIn || undefined,
        widthIn: editingRoom.widthIn || undefined,
        heightIn: editingRoom.heightIn || 96,
        floorMaterial: editingRoom.floorMaterial || "",
        wallMaterial: editingRoom.wallMaterial || "",
        ceilingMaterial: editingRoom.ceilingMaterial || "",
      });
    } else {
      setFormData({
        name: "",
        category: "",
        levelId: levels[0]?.id || "",
        lengthIn: undefined,
        widthIn: undefined,
        heightIn: 96,
        floorMaterial: "",
        wallMaterial: "",
        ceilingMaterial: "",
      });
    }
  }, [editingRoom, levels, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      levelId: formData.levelId || undefined,
      category: formData.category || undefined,
      floorMaterial: formData.floorMaterial || undefined,
      wallMaterial: formData.wallMaterial || undefined,
      ceilingMaterial: formData.ceilingMaterial || undefined,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        <h3 className="text-lg font-semibold mb-4">
          {editingRoom ? "Edit Room" : "Add Room"}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Room Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                placeholder="e.g., Master Bedroom"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
              >
                <option value="">Select category...</option>
                {ROOM_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.replace("-", " ").replace(/\b\w/g, (l) => l.toUpperCase())}
                  </option>
                ))}
              </select>
            </div>

            {levels.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Level
                </label>
                <select
                  value={formData.levelId}
                  onChange={(e) => setFormData({ ...formData, levelId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                >
                  <option value="">No level</option>
                  {levels.map((level) => (
                    <option key={level.id} value={level.id}>
                      {level.label || `Level ${level.name}`}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Dimensions (optional)
            </h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Length (ft)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.lengthIn ? formData.lengthIn / 12 : ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lengthIn: e.target.value ? parseFloat(e.target.value) * 12 : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="12"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Width (ft)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.widthIn ? formData.widthIn / 12 : ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      widthIn: e.target.value ? parseFloat(e.target.value) * 12 : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="10"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Height (ft)
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.heightIn ? formData.heightIn / 12 : ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      heightIn: e.target.value ? parseFloat(e.target.value) * 12 : undefined,
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="8"
                />
              </div>
            </div>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Materials (optional)
            </h4>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Floor
                </label>
                <input
                  type="text"
                  value={formData.floorMaterial}
                  onChange={(e) => setFormData({ ...formData, floorMaterial: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Hardwood"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Walls
                </label>
                <input
                  type="text"
                  value={formData.wallMaterial}
                  onChange={(e) => setFormData({ ...formData, wallMaterial: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Drywall"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
                  Ceiling
                </label>
                <input
                  type="text"
                  value={formData.ceilingMaterial}
                  onChange={(e) => setFormData({ ...formData, ceilingMaterial: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
                  placeholder="Drywall"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              {editingRoom ? "Save Changes" : "Add Room"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RoomsTab({ estimateId, isOnline, onOpenSketchEditor }: RoomsTabProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setIsLoading(true);
      try {
        const [roomsRes, levelsRes] = await Promise.all([
          fetch(`/api/estimates/${estimateId}/rooms`),
          fetch(`/api/estimates/${estimateId}/levels`),
        ]);

        if (!roomsRes.ok || !levelsRes.ok) {
          throw new Error("Failed to fetch data");
        }

        const [roomsData, levelsData] = await Promise.all([
          roomsRes.json(),
          levelsRes.json(),
        ]);

        setRooms(roomsData);
        setLevels(levelsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load rooms");
      } finally {
        setIsLoading(false);
      }
    }

    if (isOnline) {
      fetchData();
    } else {
      setIsLoading(false);
      setError("Room data is not available offline");
    }
  }, [estimateId, isOnline]);

  const handleAddRoom = async (data: NewRoomData) => {
    try {
      const response = await fetch(`/api/estimates/${estimateId}/rooms`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to add room");
      }

      const newRoom = await response.json();
      setRooms([...rooms, newRoom]);
      setShowAddModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add room");
    }
  };

  const handleEditRoom = async (data: NewRoomData) => {
    if (!editingRoom) return;

    try {
      const response = await fetch(`/api/estimates/${estimateId}/rooms/${editingRoom.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Failed to update room");
      }

      const updatedRoom = await response.json();
      setRooms(rooms.map((r) => (r.id === updatedRoom.id ? updatedRoom : r)));
      setEditingRoom(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update room");
    }
  };

  const handleDeleteRoom = async (roomId: string) => {
    try {
      const response = await fetch(`/api/estimates/${estimateId}/rooms/${roomId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete room");
      }

      setRooms(rooms.filter((r) => r.id !== roomId));
      setShowDeleteConfirm(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete room");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-40 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">Rooms</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {rooms.length} room{rooms.length !== 1 ? "s" : ""} in this estimate
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={onOpenSketchEditor}
            disabled={!isOnline}
            className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Open Sketch Editor
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            disabled={!isOnline}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Room
          </button>
        </div>
      </div>

      {rooms.length === 0 ? (
        <div className="border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg p-8 text-center">
          <svg
            className="w-12 h-12 mx-auto text-gray-400 mb-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No rooms yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Add rooms manually or use the sketch editor to draw your floor plan.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={onOpenSketchEditor}
              disabled={!isOnline}
              className="px-4 py-2 border border-gray-300 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Open Sketch Editor
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              disabled={!isOnline}
              className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Add Room Manually
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              onEdit={(r) => setEditingRoom(r)}
              onDelete={(id) => setShowDeleteConfirm(id)}
            />
          ))}
        </div>
      )}

      <AddRoomModal
        isOpen={showAddModal || !!editingRoom}
        onClose={() => {
          setShowAddModal(false);
          setEditingRoom(null);
        }}
        onSave={editingRoom ? handleEditRoom : handleAddRoom}
        levels={levels}
        editingRoom={editingRoom}
      />

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Room</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this room? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRoom(showDeleteConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
