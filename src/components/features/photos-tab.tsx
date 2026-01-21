"use client";

import { useState, useEffect, useCallback } from "react";
import type { Photo, Room } from "@/lib/db/schema";
import { PhotoGallery } from "./photo-gallery";
import { PhotoUpload } from "./photo-upload";

const PHOTO_TYPES = [
  { value: null, label: "All Photos" },
  { value: "BEFORE", label: "Before" },
  { value: "DURING", label: "During" },
  { value: "AFTER", label: "After" },
  { value: "DAMAGE", label: "Damage" },
  { value: "EQUIPMENT", label: "Equipment" },
  { value: "OVERVIEW", label: "Overview" },
] as const;

interface PhotosTabProps {
  estimateId: string;
  isOnline: boolean;
}

export function PhotosTab({ estimateId, isOnline }: PhotosTabProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    try {
      const params = new URLSearchParams({ estimateId });
      if (selectedType) {
        params.append("photoType", selectedType);
      }

      const response = await fetch(`/api/photos?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch photos");
      }

      const data = await response.json();
      setPhotos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load photos");
    }
  }, [estimateId, selectedType]);

  const fetchRooms = useCallback(async () => {
    try {
      const response = await fetch(`/api/estimates/${estimateId}/rooms`);
      if (!response.ok) {
        throw new Error("Failed to fetch rooms");
      }
      const data = await response.json();
      setRooms(data);
    } catch (err) {
      console.error("Error fetching rooms:", err);
    }
  }, [estimateId]);

  useEffect(() => {
    async function loadData() {
      setIsLoading(true);
      setError(null);

      if (!isOnline) {
        setError("Photos are not available offline");
        setIsLoading(false);
        return;
      }

      await Promise.all([fetchPhotos(), fetchRooms()]);
      setIsLoading(false);
    }

    loadData();
  }, [fetchPhotos, fetchRooms, isOnline]);

  // Refetch when filter changes
  useEffect(() => {
    if (isOnline && !isLoading) {
      fetchPhotos();
    }
  }, [selectedType, isOnline, isLoading, fetchPhotos]);

  const handleDelete = async (photoId: string) => {
    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete photo");
      }

      setPhotos((prev) => prev.filter((p) => p.id !== photoId));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete photo");
    }
  };

  const handleUpdateCaption = async (photoId: string, caption: string) => {
    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      });

      if (!response.ok) {
        throw new Error("Failed to update caption");
      }

      const updatedPhoto = await response.json();
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? updatedPhoto : p))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update caption");
    }
  };

  const handleLinkToRoom = async (photoId: string, roomId: string | null) => {
    try {
      const response = await fetch(`/api/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ roomId }),
      });

      if (!response.ok) {
        throw new Error("Failed to link photo to room");
      }

      const updatedPhoto = await response.json();
      setPhotos((prev) =>
        prev.map((p) => (p.id === photoId ? updatedPhoto : p))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to link photo");
    }
  };

  const handleUploadComplete = (photo: unknown) => {
    setPhotos((prev) => [photo as Photo, ...prev]);
  };

  const handleUploadError = (err: string) => {
    setError(err);
  };

  // Count photos by type
  const photoCounts = photos.reduce(
    (acc, photo) => {
      if (photo.photoType) {
        acc[photo.photoType] = (acc[photo.photoType] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-shrink-0"
            />
          ))}
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="aspect-square bg-gray-200 dark:bg-gray-700 rounded-lg animate-pulse"
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
          <button
            onClick={() => setError(null)}
            className="ml-2 text-red-500 hover:text-red-700"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Header with upload button */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-semibold">Photos</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {photos.length} photo{photos.length !== 1 ? "s" : ""} in this estimate
          </p>
        </div>
        {isOnline && (
          <PhotoUpload
            estimateId={estimateId}
            onUploadComplete={handleUploadComplete}
            onUploadError={handleUploadError}
          />
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {PHOTO_TYPES.map((type) => {
          const count = type.value ? photoCounts[type.value] || 0 : photos.length;
          const isSelected = selectedType === type.value;

          return (
            <button
              key={type.value || "all"}
              onClick={() => setSelectedType(type.value)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                isSelected
                  ? "bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
              }`}
            >
              {type.label}
              {count > 0 && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isSelected
                      ? "bg-primary-200 dark:bg-primary-800 text-primary-800 dark:text-primary-300"
                      : "bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Gallery */}
      {photos.length === 0 ? (
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            No photos yet
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Upload photos to document the property condition.
          </p>
          {isOnline && (
            <PhotoUpload
              estimateId={estimateId}
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
            />
          )}
        </div>
      ) : (
        <PhotoGallery
          photos={photos}
          onDelete={handleDelete}
          onUpdateCaption={handleUpdateCaption}
          onLinkToRoom={handleLinkToRoom}
          selectedPhotoType={selectedType}
          rooms={rooms.map((r) => ({ id: r.id, name: r.name }))}
        />
      )}
    </div>
  );
}
