"use client";

import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MapProvider } from "@/components/maps/map-provider";
import { RouteMap } from "@/components/maps/route-map";
import { RouteList } from "@/components/maps/route-list";
import { Route, Loader2 } from "lucide-react";

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
  lineItems: { id: string; description: string; total: number }[];
}

interface RouteLeg {
  duration: string;
  distanceMeters: number;
}

interface RouteResponse {
  jobs: RouteJob[];
  orderedJobIds: string[];
  legs: RouteLeg[];
  totalDuration: string;
  totalDistanceMeters: number;
  encodedPolyline: string | null;
  fallback?: boolean;
}

function getTodayString(): string {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

export default function RoutePlannerPage() {
  const [date, setDate] = useState(getTodayString());
  const [startAddress, setStartAddress] = useState("");
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const optimizeRoute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/route-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date,
          startAddress: startAddress || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to optimize route");
      }

      const data: RouteResponse = await response.json();
      setRouteData(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to optimize route";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [date, startAddress]);

  const totalDurationMinutes = routeData
    ? Math.round(
        (parseInt(routeData.totalDuration.replace("s", ""), 10) || 0) / 60
      )
    : 0;

  const totalDistanceKm = routeData
    ? (routeData.totalDistanceMeters / 1000).toFixed(1)
    : "0";

  const totalDistanceMiles = routeData
    ? (routeData.totalDistanceMeters / 1609.34).toFixed(1)
    : "0";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Route Planner</h1>
          <p className="text-muted-foreground">
            Optimise your daily route for maximum efficiency
          </p>
        </div>
      </div>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label htmlFor="route-date">Date</Label>
              <Input
                id="route-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="space-y-2 flex-1 min-w-[200px]">
              <Label htmlFor="start-address">
                Start Address (optional)
              </Label>
              <Input
                id="start-address"
                type="text"
                value={startAddress}
                onChange={(e) => setStartAddress(e.target.value)}
                placeholder="e.g. your depot or home address"
              />
            </div>
            <Button onClick={optimizeRoute} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Optimising...
                </>
              ) : (
                <>
                  <Route className="mr-2 h-4 w-4" />
                  Optimise Route
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Summary bar */}
      {routeData && routeData.jobs.length > 0 && (
        <div className="flex flex-wrap gap-6 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-muted-foreground">Jobs:</span>
            <span className="font-semibold">{routeData.jobs.length}</span>
          </div>
          {routeData.totalDistanceMeters > 0 && (
            <>
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">
                  Total Distance:
                </span>
                <span className="font-semibold">
                  {totalDistanceMiles} miles ({totalDistanceKm} km)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium text-muted-foreground">
                  Est. Drive Time:
                </span>
                <span className="font-semibold">
                  {totalDurationMinutes >= 60
                    ? `${Math.floor(totalDurationMinutes / 60)}h ${totalDurationMinutes % 60}m`
                    : `${totalDurationMinutes}m`}
                </span>
              </div>
            </>
          )}
          {routeData.fallback && (
            <div className="text-amber-600">
              Showing jobs in scheduled time order (route optimisation
              unavailable)
            </div>
          )}
        </div>
      )}

      {/* Split layout */}
      {routeData && (
        <MapProvider>
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left panel: job list */}
            <div className="lg:col-span-2">
              <Card className="h-full">
                <CardHeader className="pb-3">
                  <h2 className="text-lg font-semibold">
                    Route Order ({routeData.jobs.length} stops)
                  </h2>
                </CardHeader>
                <CardContent className="pt-0">
                  <RouteList
                    jobs={routeData.jobs}
                    legs={routeData.legs}
                    totalDuration={routeData.totalDuration}
                    totalDistanceMeters={routeData.totalDistanceMeters}
                  />
                </CardContent>
              </Card>
            </div>

            {/* Right panel: map */}
            <div className="lg:col-span-3">
              <Card className="h-full min-h-[500px]">
                <CardContent className="p-0 h-full min-h-[500px]">
                  <RouteMap
                    jobs={routeData.jobs}
                    encodedPolyline={routeData.encodedPolyline}
                  />
                </CardContent>
              </Card>
            </div>
          </div>
        </MapProvider>
      )}

      {/* Empty state */}
      {routeData && routeData.jobs.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center">
            <Route className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold">No jobs for this date</h3>
            <p className="text-muted-foreground mt-1">
              There are no scheduled or in-progress jobs for the selected
              date.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
