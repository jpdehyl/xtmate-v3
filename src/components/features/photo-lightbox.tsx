"use client";

import { useState, useEffect, useCallback } from "react";
import type { Photo } from "@/lib/db/schema";

const PHOTO_TYPE_LABELS: Record<string, string> = {
  BEFORE: "Before",
  DURING: "During",
  AFTER: "After",
  DAMAGE: "Damage",
  EQUIPMENT: "Equipment",
  OVERVIEW: "Overview",
};

interface PhotoLightboxProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
  onDelete?: (photoId: string) => void;
  onUpdateCaption?: (photoId: string, caption: string) => void;
  onLinkToRoom?: (photoId: string, roomId: string | null) => void;
  rooms?: Array<{ id: string; name: string }>;
}

export function PhotoLightbox({
  photos,
  initialIndex,
  onClose,
  onDelete,
  onUpdateCaption,
  onLinkToRoom,
  rooms = [],
}: PhotoLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isEditingCaption, setIsEditingCaption] = useState(false);
  const [captionValue, setCaptionValue] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const currentPhoto = photos[currentIndex];

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % photos.length);
    setIsEditingCaption(false);
  }, [photos.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + photos.length) % photos.length);
    setIsEditingCaption(false);
  }, [photos.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case "Escape":
          onClose();
          break;
        case "ArrowRight":
          goNext();
          break;
        case "ArrowLeft":
          goPrev();
          break;
        case "i":
          setShowInfo((prev) => !prev);
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, goNext, goPrev]);

  const handleSaveCaption = () => {
    if (onUpdateCaption && currentPhoto) {
      onUpdateCaption(currentPhoto.id, captionValue);
    }
    setIsEditingCaption(false);
  };

  const handleStartEditCaption = () => {
    setCaptionValue(currentPhoto?.caption || "");
    setIsEditingCaption(true);
  };

  const handleRoomChange = (roomId: string) => {
    if (onLinkToRoom && currentPhoto) {
      onLinkToRoom(currentPhoto.id, roomId || null);
    }
  };

  const handleDelete = () => {
    if (onDelete && currentPhoto) {
      onDelete(currentPhoto.id);
      if (photos.length <= 1) {
        onClose();
      } else {
        setCurrentIndex((prev) => Math.min(prev, photos.length - 2));
      }
    }
    setShowDeleteConfirm(false);
  };

  if (!currentPhoto) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Close button */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 z-10 p-2 text-white/80 hover:text-white transition-colors"
        title="Close (Esc)"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Main image container */}
      <div className="absolute inset-0 flex items-center justify-center p-4">
        <img
          src={currentPhoto.url}
          alt={currentPhoto.caption || currentPhoto.filename || "Photo"}
          className="max-w-full max-h-full object-contain"
        />
      </div>

      {/* Navigation arrows */}
      {photos.length > 1 && (
        <>
          <button
            onClick={goPrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors"
            title="Previous (Left Arrow)"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-white/80 hover:text-white bg-black/30 hover:bg-black/50 rounded-full transition-colors"
            title="Next (Right Arrow)"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </>
      )}

      {/* Bottom bar with info */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
        <div className="flex items-end justify-between gap-4">
          {/* Left side: Caption and metadata */}
          <div className="flex-1 min-w-0">
            {isEditingCaption ? (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={captionValue}
                  onChange={(e) => setCaptionValue(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white/10 border border-white/30 rounded text-white placeholder-white/50 focus:outline-none focus:border-white/50"
                  placeholder="Add a caption..."
                  autoFocus
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveCaption();
                    if (e.key === "Escape") setIsEditingCaption(false);
                  }}
                />
                <button
                  onClick={handleSaveCaption}
                  className="px-3 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingCaption(false)}
                  className="px-3 py-2 text-white/80 hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div>
                {currentPhoto.caption ? (
                  <p
                    className="text-white text-lg mb-1 cursor-pointer hover:text-white/80"
                    onClick={onUpdateCaption ? handleStartEditCaption : undefined}
                    title={onUpdateCaption ? "Click to edit caption" : undefined}
                  >
                    {currentPhoto.caption}
                  </p>
                ) : onUpdateCaption ? (
                  <button
                    onClick={handleStartEditCaption}
                    className="text-white/60 hover:text-white/80 text-sm transition-colors"
                  >
                    + Add caption
                  </button>
                ) : null}

                <div className="flex items-center gap-3 text-white/60 text-sm">
                  {currentPhoto.photoType && (
                    <span className="px-2 py-0.5 bg-white/20 rounded">
                      {PHOTO_TYPE_LABELS[currentPhoto.photoType] || currentPhoto.photoType}
                    </span>
                  )}
                  <span>{currentIndex + 1} of {photos.length}</span>
                  {currentPhoto.takenAt && (
                    <span>
                      {new Date(currentPhoto.takenAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Right side: Actions */}
          <div className="flex items-center gap-2">
            {/* Room link dropdown */}
            {onLinkToRoom && rooms.length > 0 && (
              <select
                value={currentPhoto.roomId || ""}
                onChange={(e) => handleRoomChange(e.target.value)}
                className="px-3 py-2 bg-white/10 border border-white/30 rounded text-white text-sm focus:outline-none focus:border-white/50"
              >
                <option value="">No room</option>
                {rooms.map((room) => (
                  <option key={room.id} value={room.id}>
                    {room.name}
                  </option>
                ))}
              </select>
            )}

            {/* Info button */}
            <button
              onClick={() => setShowInfo(!showInfo)}
              className={`p-2 rounded transition-colors ${
                showInfo
                  ? "bg-white/20 text-white"
                  : "text-white/80 hover:text-white hover:bg-white/10"
              }`}
              title="Show info (i)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>

            {/* Delete button */}
            {onDelete && (
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="p-2 text-white/80 hover:text-red-400 hover:bg-white/10 rounded transition-colors"
                title="Delete photo"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Info panel */}
      {showInfo && (
        <div className="absolute top-16 right-4 w-72 bg-black/90 rounded-lg p-4 text-white/80 text-sm space-y-2">
          <h4 className="font-medium text-white mb-3">Photo Information</h4>

          {currentPhoto.filename && (
            <div className="flex justify-between">
              <span>Filename:</span>
              <span className="text-white truncate ml-2 max-w-32">{currentPhoto.filename}</span>
            </div>
          )}

          {currentPhoto.mimeType && (
            <div className="flex justify-between">
              <span>Type:</span>
              <span className="text-white">{currentPhoto.mimeType}</span>
            </div>
          )}

          {currentPhoto.sizeBytes && (
            <div className="flex justify-between">
              <span>Size:</span>
              <span className="text-white">
                {(currentPhoto.sizeBytes / 1024 / 1024).toFixed(2)} MB
              </span>
            </div>
          )}

          {currentPhoto.takenAt && (
            <div className="flex justify-between">
              <span>Taken:</span>
              <span className="text-white">
                {new Date(currentPhoto.takenAt).toLocaleString()}
              </span>
            </div>
          )}

          {(currentPhoto.latitude || currentPhoto.longitude) && (
            <div className="flex justify-between">
              <span>Location:</span>
              <span className="text-white">
                {currentPhoto.latitude?.toFixed(4)}, {currentPhoto.longitude?.toFixed(4)}
              </span>
            </div>
          )}

          <div className="flex justify-between">
            <span>Uploaded:</span>
            <span className="text-white">
              {currentPhoto.createdAt && new Date(currentPhoto.createdAt).toLocaleDateString()}
            </span>
          </div>
        </div>
      )}

      {/* Delete confirmation */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-10">
          <div className="bg-gray-900 rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-white mb-2">Delete Photo</h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this photo? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-4">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-300 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
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
