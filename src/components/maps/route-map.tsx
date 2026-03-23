"use client";

import { useState, useCallback, useMemo } from "react";
import { GoogleMap, Marker, Polyline, InfoWindow } from "@react-google-maps/api";
import { formatTime } from "@/lib/formatters";

interface JobProperty {
  id: string;
  address: string;
  city: string;
  postcode: string;
  latitude: number | null;
  longitude: number | null;
}

interface JobCustomer {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

interface RouteJob {
  id: string;
  jobNumber: string;
  status: string;
  scheduledDate: string;
  scheduledTime: string | null;
  duration: number;
  notes: string | null;
  customer: JobCustomer;
  property: JobProperty | null;
  assignedTo: { id: string; name: string } | null;
}

interface RouteMapProps {
  jobs: RouteJob[];
  encodedPolyline: string | null;
}

const DEFAULT_CENTER = { lat: 52.5, lng: -1.5 };

const MAP_CONTAINER_STYLE = {
  width: "100%",
  height: "100%",
  minHeight: "500px",
  borderRadius: "0.5rem",
};

const MAP_OPTIONS: google.maps.MapOptions = {
  disableDefaultUI: false,
  zoomControl: true,
  mapTypeControl: false,
  streetViewControl: false,
  fullscreenControl: true,
};

const POLYLINE_OPTIONS: google.maps.PolylineOptions = {
  strokeColor: "#2563eb",
  strokeOpacity: 0.8,
  strokeWeight: 4,
};

/**
 * Decode a Google encoded polyline string into an array of lat/lng points.
 * Implements the Encoded Polyline Algorithm.
 */
function decodePolyline(encoded: string): { lat: number; lng: number }[] {
  const points: { lat: number; lng: number }[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;

    // Decode latitude
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlat = result & 1 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    // Decode longitude
    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    const dlng = result & 1 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push({
      lat: lat / 1e5,
      lng: lng / 1e5,
    });
  }

  return points;
}

/**
 * Create a numbered marker label SVG data URL.
 */
function createMarkerIcon(index: number): google.maps.Icon {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
      <path d="M16 0C7.2 0 0 7.2 0 16c0 12 16 24 16 24s16-12 16-24C32 7.2 24.8 0 16 0z" fill="#2563eb"/>
      <circle cx="16" cy="15" r="10" fill="white"/>
      <text x="16" y="19" text-anchor="middle" font-family="Arial,sans-serif" font-size="12" font-weight="bold" fill="#2563eb">${index + 1}</text>
    </svg>
  `;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(32, 40),
    anchor: new google.maps.Point(16, 40),
  };
}

export function RouteMap({ jobs, encodedPolyline }: RouteMapProps) {
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [selectedJob, setSelectedJob] = useState<RouteJob | null>(null);

  // Get marker positions from job properties
  const markers = useMemo(() => {
    return jobs
      .map((job, index) => {
        if (!job.property?.latitude || !job.property?.longitude) return null;
        return {
          job,
          index,
          position: {
            lat: job.property.latitude,
            lng: job.property.longitude,
          },
        };
      })
      .filter(Boolean) as {
      job: RouteJob;
      index: number;
      position: { lat: number; lng: number };
    }[];
  }, [jobs]);

  // Decode the polyline path
  const polylinePath = useMemo(() => {
    if (!encodedPolyline) return [];
    try {
      return decodePolyline(encodedPolyline);
    } catch {
      return [];
    }
  }, [encodedPolyline]);

  // Fit map bounds to show all markers
  const onLoad = useCallback(
    (mapInstance: google.maps.Map) => {
      setMap(mapInstance);

      if (markers.length === 0) {
        mapInstance.setCenter(DEFAULT_CENTER);
        mapInstance.setZoom(7);
        return;
      }

      const bounds = new google.maps.LatLngBounds();
      markers.forEach(({ position }) => {
        bounds.extend(position);
      });

      // Also include polyline points in bounds
      polylinePath.forEach((point) => {
        bounds.extend(point);
      });

      mapInstance.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    },
    [markers, polylinePath]
  );

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  return (
    <GoogleMap
      mapContainerStyle={MAP_CONTAINER_STYLE}
      options={MAP_OPTIONS}
      center={DEFAULT_CENTER}
      zoom={7}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {/* Route polyline */}
      {polylinePath.length > 0 && (
        <Polyline path={polylinePath} options={POLYLINE_OPTIONS} />
      )}

      {/* Job markers */}
      {markers.map(({ job, index, position }) => (
        <Marker
          key={job.id}
          position={position}
          icon={createMarkerIcon(index)}
          onClick={() => setSelectedJob(job)}
          title={`${index + 1}. ${job.customer.firstName} ${job.customer.lastName}`}
        />
      ))}

      {/* Info window */}
      {selectedJob && selectedJob.property?.latitude && selectedJob.property?.longitude && (
        <InfoWindow
          position={{
            lat: selectedJob.property.latitude,
            lng: selectedJob.property.longitude,
          }}
          onCloseClick={() => setSelectedJob(null)}
        >
          <div className="p-1 min-w-[200px]">
            <p className="font-semibold text-sm">
              {selectedJob.customer.firstName} {selectedJob.customer.lastName}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {selectedJob.property.address}, {selectedJob.property.city},{" "}
              {selectedJob.property.postcode}
            </p>
            {selectedJob.scheduledTime && (
              <p className="text-xs text-gray-600 mt-1">
                Time: {formatTime(selectedJob.scheduledTime)}
              </p>
            )}
            <p className="text-xs mt-1">
              <span
                className={`inline-block px-1.5 py-0.5 rounded text-white text-[10px] font-medium ${
                  selectedJob.status === "SCHEDULED"
                    ? "bg-blue-500"
                    : selectedJob.status === "IN_PROGRESS"
                      ? "bg-amber-500"
                      : "bg-gray-500"
                }`}
              >
                {selectedJob.status.replace("_", " ")}
              </span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Job #{selectedJob.jobNumber} &middot; {selectedJob.duration} min
            </p>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
