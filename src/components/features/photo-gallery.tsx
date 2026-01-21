"use client";

import { useState } from "react";
import type { Photo } from "@/lib/db/schema";
import { PhotoLightbox } from "./photo-lightbox";

const PHOTO_TYPE_LABELS: Record<string, string> = {
  BEFORE: "Before",
  DURING: "During",
  AFTER: "After",
  DAMAGE: "Damage",
  EQUIPMENT: "Equipment",
  OVERVIEW: "Overview",
};

const PHOTO_TYPE_COLORS: Record<string, string> = {
  BEFORE: "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400",
  DURING: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400",
  AFTER: "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400",
  DAMAGE: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400",
  EQUIPMENT: "bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400",
  OVERVIEW: "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-400",
};

interface PhotoGalleryProps {
  photos: Photo[];
  onDelete?: (photoId: string) => void;
  onUpdateCaption?: (photoId: string, caption: string) => void;
  onLinkToRoom?: (photoId: string, roomId: string | null) => void;
  isEditable?: boolean;
  selectedPhotoType?: string | null;
  rooms?: Array<{ id: string; name: string }>;
}

export function PhotoGallery({
  photos,
  onDelete,
  onUpdateCaption,
  onLinkToRoom,
  isEditable = true,
  selectedPhotoType,
  rooms = [],
}: PhotoGalleryProps) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Filter photos by type if selected
  const filteredPhotos = selectedPhotoType
    ? photos.filter((p) => p.photoType === selectedPhotoType)
    : photos;

  if (filteredPhotos.length === 0) {
    return (
      <div className="text-center py-8">
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
        <p className="text-gray-600 dark:text-gray-400">
          {selectedPhotoType
            ? `No ${PHOTO_TYPE_LABELS[selectedPhotoType]?.toLowerCase() || ""} photos yet`
            : "No photos uploaded yet"}
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {filteredPhotos.map((photo, index) => (
          <div
            key={photo.id}
            className="group relative aspect-square bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden cursor-pointer"
            onClick={() => setLightboxIndex(index)}
          >
            {/* Image */}
            <img
              src={photo.thumbnailUrl || photo.url}
              alt={photo.caption || photo.filename || "Photo"}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              loading="lazy"
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors" />

            {/* Photo type badge */}
            {photo.photoType && (
              <span
                className={`absolute top-2 left-2 text-xs font-medium px-2 py-0.5 rounded ${PHOTO_TYPE_COLORS[photo.photoType] || PHOTO_TYPE_COLORS.OVERVIEW}`}
              >
                {PHOTO_TYPE_LABELS[photo.photoType] || photo.photoType}
              </span>
            )}

            {/* Delete button (only on hover) */}
            {isEditable && onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteConfirmId(photo.id);
                }}
                className="absolute top-2 right-2 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                title="Delete photo"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              </button>
            )}

            {/* Caption overlay at bottom */}
            {photo.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2">
                <p className="text-white text-xs truncate">{photo.caption}</p>
              </div>
            )}

            {/* Room link indicator */}
            {photo.roomId && (
              <div className="absolute bottom-2 right-2 p-1 bg-white/90 dark:bg-gray-900/90 rounded text-xs text-gray-600 dark:text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Room
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox */}
      {lightboxIndex !== null && (
        <PhotoLightbox
          photos={filteredPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
          onDelete={isEditable && onDelete ? onDelete : undefined}
          onUpdateCaption={isEditable && onUpdateCaption ? onUpdateCaption : undefined}
          onLinkToRoom={isEditable && onLinkToRoom ? onLinkToRoom : undefined}
          rooms={rooms}
        />
      )}

      {/* Delete confirmation modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
          <div className="bg-white dark:bg-gray-900 rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Delete Photo</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Are you sure you want to delete this photo? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (onDelete) {
                    onDelete(deleteConfirmId);
                  }
                  setDeleteConfirmId(null);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
