export function openNavigation(lat: number, lng: number) {
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;
  window.open(url, "_blank");
}

export interface RouteWaypoint {
  address: string;
  lat: number;
  lng: number;
  jobId: string;
}

export interface OptimizedRoute {
  orderedJobIds: string[];
  legs: {
    duration: string;
    distanceMeters: number;
  }[];
  totalDuration: string;
  totalDistanceMeters: number;
  encodedPolyline?: string;
}
