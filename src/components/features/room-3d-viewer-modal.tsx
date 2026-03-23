'use client';

import React from 'react';
import type { Room } from '@/lib/db/schema';
import { RoomViewer3D } from '@/components/room-viewer-3d';

interface Room3DViewerModalProps {
  isOpen: boolean;
  room: Room | null;
  onClose: () => void;
}

export function Room3DViewerModal({ isOpen, room, onClose }: Room3DViewerModalProps) {
  if (!isOpen || !room) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col">
        {/* Header */}
        <div className="border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              3D View: {room.name}
            </h3>
            {room.category && (
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                {room.category.charAt(0).toUpperCase() + room.category.slice(1)}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            aria-label="Close 3D viewer"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 3D Viewer */}
        <div className="flex-1 overflow-hidden">
          <RoomViewer3D room={room} showGrid showHelpers />
        </div>

        {/* Footer with dimensions */}
        {(room.lengthIn || room.widthIn || room.heightIn) && (
          <div className="border-t border-gray-200 dark:border-gray-700 px-6 py-3 bg-gray-50 dark:bg-gray-800/50">
            <div className="grid grid-cols-3 gap-4 text-sm">
              {room.lengthIn && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Length</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {(room.lengthIn / 12).toFixed(1)}{`'`}
                  </p>
                </div>
              )}
              {room.widthIn && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Width</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {(room.widthIn / 12).toFixed(1)}{`'`}
                  </p>
                </div>
              )}
              {room.heightIn && (
                <div>
                  <p className="text-gray-600 dark:text-gray-400">Height</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {(room.heightIn / 12).toFixed(1)}{`'`}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
