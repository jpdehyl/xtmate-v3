'use client';

import { useMemo, useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { cn } from '@/lib/utils';
import { MapPin, ExternalLink, Navigation } from 'lucide-react';
import Link from 'next/link';

interface Project {
  id: string;
  name: string | null;
  propertyAddress: string | null;
  propertyCity: string | null;
  propertyState: string | null;
  latitude?: number | null;
  longitude?: number | null;
  status: string | null;
  jobType?: string | null;
}

interface ProjectsMapProps {
  projects: Project[];
  className?: string;
  googleMapsApiKey?: string;
}

const mapContainerStyle = {
  width: '100%',
  height: '100%',
};

const defaultCenter = {
  lat: 40.7128,  // New York City
  lng: -74.006,
};

// Custom map styling for a cleaner look
const mapStyles = [
  {
    featureType: 'all',
    elementType: 'geometry.fill',
    stylers: [{ saturation: -20 }],
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#c9e9f6' }],
  },
  {
    featureType: 'poi',
    elementType: 'labels',
    stylers: [{ visibility: 'off' }],
  },
];

// Status colors for markers (Paul Davis gold palette)
const statusColors: Record<string, string> = {
  draft: '#94A3B8',
  in_progress: '#b4975a',
  completed: '#8a7344',
};

export function ProjectsMap({ projects, className, googleMapsApiKey }: ProjectsMapProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: googleMapsApiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '',
  });

  // Filter projects with valid coordinates
  const projectsWithCoords = useMemo(() => {
    return projects.filter((p) => p.latitude && p.longitude);
  }, [projects]);

  // Calculate map center from projects
  const mapCenter = useMemo(() => {
    if (projectsWithCoords.length === 0) return defaultCenter;

    const avgLat = projectsWithCoords.reduce((sum, p) => sum + (p.latitude || 0), 0) / projectsWithCoords.length;
    const avgLng = projectsWithCoords.reduce((sum, p) => sum + (p.longitude || 0), 0) / projectsWithCoords.length;

    return { lat: avgLat, lng: avgLng };
  }, [projectsWithCoords]);

  const onMarkerClick = useCallback((project: Project) => {
    setSelectedProject(project);
  }, []);

  const onInfoWindowClose = useCallback(() => {
    setSelectedProject(null);
  }, []);

  // Format address for display
  const formatAddress = (project: Project) => {
    const parts = [project.propertyAddress, project.propertyCity, project.propertyState].filter(Boolean);
    return parts.join(', ');
  };

  // Open in Google Maps
  const openInGoogleMaps = (project: Project) => {
    const address = encodeURIComponent(formatAddress(project));
    if (project.latitude && project.longitude) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${project.latitude},${project.longitude}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${address}`, '_blank');
    }
  };

  // Get directions
  const getDirections = (project: Project) => {
    const address = encodeURIComponent(formatAddress(project));
    if (project.latitude && project.longitude) {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${project.latitude},${project.longitude}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${address}`, '_blank');
    }
  };

  // Show fallback if no API key or load error
  if (!googleMapsApiKey && !process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
    return (
      <div className={cn('rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden', className)}>
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">Project Locations</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Active estimates across your service area</p>
        </div>
        <div className="h-[300px] bg-gray-50 dark:bg-gray-800/50 flex flex-col items-center justify-center p-6">
          <MapPin className="w-12 h-12 text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center">
            Add a Google Maps API key to enable the interactive map
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
            Set NEXT_PUBLIC_GOOGLE_MAPS_API_KEY in your environment
          </p>

          {/* Show project list instead */}
          {projects.length > 0 && (
            <div className="mt-4 w-full max-w-md">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Project Addresses:</p>
              <div className="space-y-2 max-h-[150px] overflow-y-auto">
                {projects.slice(0, 5).map((project) => (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white dark:bg-gray-800 text-sm border border-gray-100 dark:border-gray-700"
                  >
                    <span className="truncate text-gray-900 dark:text-white">{formatAddress(project) || 'No address'}</span>
                    <button
                      onClick={() => openInGoogleMaps(project)}
                      className="ml-2 p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    >
                      <ExternalLink className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className={cn('rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden', className)}>
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">Project Locations</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Active estimates across your service area</p>
        </div>
        <div className="h-[300px] bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">Failed to load map</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className={cn('rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden', className)}>
        <div className="p-5 border-b border-gray-200 dark:border-gray-800">
          <h3 className="font-semibold text-gray-900 dark:text-white">Project Locations</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Active estimates across your service area</p>
        </div>
        <div className="h-[300px] bg-gray-50 dark:bg-gray-800/50 flex items-center justify-center">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-pd-gold border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-500 dark:text-gray-400">Loading map...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden', className)}>
      <div className="p-5 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white">Project Locations</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {projectsWithCoords.length} active estimates mapped
            </p>
          </div>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-pd-gold" /> In Progress
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-pd-gold-700" /> Completed
            </span>
          </div>
        </div>
      </div>
      <div className="h-[300px]">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={projectsWithCoords.length > 1 ? 10 : 13}
          options={{
            styles: mapStyles,
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
          }}
        >
          {projectsWithCoords.map((project) => (
            <Marker
              key={project.id}
              position={{ lat: project.latitude!, lng: project.longitude! }}
              onClick={() => onMarkerClick(project)}
              icon={{
                path: 'M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z',
                fillColor: statusColors[project.status || 'draft'] || statusColors.draft,
                fillOpacity: 1,
                strokeWeight: 2,
                strokeColor: '#FFFFFF',
                scale: 1.5,
                anchor: new google.maps.Point(12, 22),
              }}
            />
          ))}

          {selectedProject && (
            <InfoWindow
              position={{
                lat: selectedProject.latitude!,
                lng: selectedProject.longitude!,
              }}
              onCloseClick={onInfoWindowClose}
            >
              <div className="p-2 min-w-[200px]">
                <h4 className="font-semibold text-gray-900 mb-1">
                  {selectedProject.name || 'Untitled'}
                </h4>
                <p className="text-sm text-gray-600 mb-2">
                  {formatAddress(selectedProject)}
                </p>
                <div className="flex gap-2">
                  <Link
                    href={`/dashboard/estimates/${selectedProject.id}`}
                    className="flex-1 text-center text-xs px-2 py-1.5 bg-pd-gold text-white rounded hover:bg-pd-gold-600 transition-colors"
                  >
                    View Details
                  </Link>
                  <button
                    onClick={() => getDirections(selectedProject)}
                    className="p-1.5 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                    title="Get Directions"
                  >
                    <Navigation className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              </div>
            </InfoWindow>
          )}
        </GoogleMap>
      </div>
    </div>
  );
}
