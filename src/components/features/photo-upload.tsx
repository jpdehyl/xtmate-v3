"use client";

import { useState, useRef, useCallback } from "react";

const PHOTO_TYPES = [
  { value: "BEFORE", label: "Before", description: "Pre-damage state" },
  { value: "DURING", label: "During", description: "During restoration" },
  { value: "AFTER", label: "After", description: "Post-restoration" },
  { value: "DAMAGE", label: "Damage", description: "Specific damage documentation" },
  { value: "EQUIPMENT", label: "Equipment", description: "Equipment deployed" },
  { value: "OVERVIEW", label: "Overview", description: "General property shots" },
] as const;

interface PhotoUploadProps {
  estimateId: string;
  roomId?: string;
  onUploadComplete?: (photo: unknown) => void;
  onUploadError?: (error: string) => void;
}

interface UploadingFile {
  file: File;
  preview: string;
  progress: number;
  error?: string;
}

export function PhotoUpload({
  estimateId,
  roomId,
  onUploadComplete,
  onUploadError,
}: PhotoUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<string>("OVERVIEW");
  const [caption, setCaption] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(true);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const getGpsLocation = useCallback((): Promise<{ latitude: number; longitude: number } | null> => {
    if (!gpsEnabled || !navigator.geolocation) {
      return Promise.resolve(null);
    }

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          resolve(null);
        },
        { enableHighAccuracy: true, timeout: 5000 }
      );
    });
  }, [gpsEnabled]);

  const uploadFile = async (file: File, index: number) => {
    try {
      // Get GPS location
      const location = await getGpsLocation();

      const formData = new FormData();
      formData.append("file", file);
      formData.append(
        "metadata",
        JSON.stringify({
          estimateId,
          roomId: roomId || undefined,
          photoType: selectedType,
          caption: caption || undefined,
          takenAt: new Date().toISOString(),
          latitude: location?.latitude,
          longitude: location?.longitude,
        })
      );

      const response = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Upload failed");
      }

      const photo = await response.json();

      // Update progress to complete
      setUploadingFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, progress: 100 } : f))
      );

      return photo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Upload failed";
      setUploadingFiles((prev) =>
        prev.map((f, i) => (i === index ? { ...f, error: errorMessage } : f))
      );
      throw err;
    }
  };

  const handleFilesSelected = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newFiles: UploadingFile[] = Array.from(files).map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      progress: 0,
    }));

    setUploadingFiles(newFiles);
    setIsUploading(true);

    const results: unknown[] = [];
    const errors: string[] = [];

    for (let i = 0; i < newFiles.length; i++) {
      try {
        // Update progress to show upload started
        setUploadingFiles((prev) =>
          prev.map((f, idx) => (idx === i ? { ...f, progress: 50 } : f))
        );

        const photo = await uploadFile(newFiles[i].file, i);
        results.push(photo);
        onUploadComplete?.(photo);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed";
        errors.push(msg);
        onUploadError?.(msg);
      }
    }

    setIsUploading(false);

    // Clean up after a delay
    setTimeout(() => {
      // Clean up object URLs
      newFiles.forEach((f) => URL.revokeObjectURL(f.preview));

      // Clear completed uploads
      setUploadingFiles((prev) => prev.filter((f) => f.error));

      // Close if all succeeded
      if (errors.length === 0) {
        setIsOpen(false);
        setCaption("");
      }
    }, 1500);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFilesSelected(e.dataTransfer.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center gap-2 text-sm"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        Add Photos
      </button>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" style={{ overscrollBehavior: 'contain' }}>
      <div className="bg-white dark:bg-gray-900 rounded-lg max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold">Add Photos</h3>
          <button
            onClick={() => {
              if (!isUploading) {
                setIsOpen(false);
                setUploadingFiles([]);
                setCaption("");
              }
            }}
            disabled={isUploading}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 disabled:opacity-50"
            aria-label="Close upload dialog"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Photo type selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Photo Type
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {PHOTO_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setSelectedType(type.value)}
                  className={`p-2 text-left rounded-lg border transition-colors ${
                    selectedType === type.value
                      ? "border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <div className="font-medium text-sm">{type.label}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {type.description}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Caption input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Caption (optional)
            </label>
            <input
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a description..."
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-800 dark:text-gray-100"
            />
          </div>

          {/* GPS toggle */}
          <div className="flex items-center justify-between">
            <div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                GPS Location
              </span>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Tag photos with current location
              </p>
            </div>
            <button
              onClick={() => setGpsEnabled(!gpsEnabled)}
              role="switch"
              aria-checked={gpsEnabled}
              aria-label="GPS Location"
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                gpsEnabled ? "bg-primary-600" : "bg-gray-200 dark:bg-gray-700"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  gpsEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Upload area */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-gray-400 dark:hover:border-gray-600 transition-colors"
          >
            {uploadingFiles.length > 0 ? (
              <div className="space-y-3">
                {uploadingFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-2 bg-gray-50 dark:bg-gray-800 rounded"
                  >
                    <img
                      src={file.preview}
                      alt="Preview"
                      className="w-12 h-12 object-cover rounded"
                      width={48}
                      height={48}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {file.file.name}
                      </p>
                      {file.error ? (
                        <p className="text-xs text-red-500">{file.error}</p>
                      ) : (
                        <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-primary-600 transition-all duration-300"
                            style={{ width: `${file.progress}%` }}
                          />
                        </div>
                      )}
                    </div>
                    {file.progress === 100 && !file.error && (
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <>
                <svg
                  className="w-12 h-12 mx-auto text-gray-400 mb-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  />
                </svg>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Drag and drop photos here, or
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  {/* File picker button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    Browse Files
                  </button>

                  {/* Camera button (mobile) */}
                  <button
                    onClick={() => cameraInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                    Take Photo
                  </button>
                </div>
              </>
            )}
          </div>

          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            Supports JPEG, PNG, WebP, HEIC. Max 10MB per file.
          </p>
        </div>

        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
          multiple
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => handleFilesSelected(e.target.files)}
          className="hidden"
        />
      </div>
    </div>
  );
}
