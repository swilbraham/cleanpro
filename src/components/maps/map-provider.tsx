"use client";

import { ReactNode } from "react";
import { useJsApiLoader } from "@react-google-maps/api";

const GOOGLE_MAPS_LIBRARIES: ("places" | "geometry")[] = ["places", "geometry"];

interface MapProviderProps {
  children: ReactNode;
}

export function MapProvider({ children }: MapProviderProps) {
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  if (loadError) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-red-600">
        Failed to load Google Maps. Please check your API key configuration.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8 text-sm text-muted-foreground">
        Loading maps...
      </div>
    );
  }

  return <>{children}</>;
}
