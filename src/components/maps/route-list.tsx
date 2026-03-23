"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTime } from "@/lib/formatters";
import { openNavigation } from "@/lib/google-maps";
import { MapPin, Navigation, Clock } from "lucide-react";

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

interface RouteLeg {
  duration: string;
  distanceMeters: number;
}

interface RouteListProps {
  jobs: RouteJob[];
  legs: RouteLeg[];
  totalDuration: string;
  totalDistanceMeters: number;
}

function formatDurationSeconds(seconds: number): string {
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.round(seconds / 60);
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
}

function formatDistanceMeters(meters: number): string {
  const miles = meters / 1609.34;
  if (miles < 0.1) return `${Math.round(meters)}m`;
  return `${miles.toFixed(1)} mi`;
}

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  SCHEDULED: "default",
  IN_PROGRESS: "secondary",
  COMPLETED: "outline",
  CANCELLED: "destructive",
  INVOICED: "outline",
};

export function RouteList({
  jobs,
  legs,
  totalDuration,
  totalDistanceMeters,
}: RouteListProps) {
  if (jobs.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4 text-center">
        No jobs to display.
      </p>
    );
  }

  const totalSeconds = parseInt(totalDuration.replace("s", ""), 10) || 0;

  return (
    <div className="space-y-1">
      {jobs.map((job, index) => {
        const leg = legs[index] || null;
        const legDurationSeconds = leg
          ? parseInt(leg.duration.replace("s", ""), 10) || 0
          : 0;

        return (
          <div key={job.id}>
            {/* Drive time between stops */}
            {index > 0 && leg && legDurationSeconds > 0 && (
              <div className="flex items-center gap-2 py-2 px-3 text-xs text-muted-foreground">
                <div className="flex-1 border-t border-dashed" />
                <Navigation className="h-3 w-3" />
                <span>
                  {formatDurationSeconds(legDurationSeconds)} &middot;{" "}
                  {formatDistanceMeters(leg.distanceMeters)}
                </span>
                <div className="flex-1 border-t border-dashed" />
              </div>
            )}

            {/* Job card */}
            <div className="flex items-start gap-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors">
              {/* Number badge */}
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold">
                {index + 1}
              </div>

              {/* Job details */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-medium text-sm leading-tight">
                      {job.customer.firstName} {job.customer.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Job #{job.jobNumber}
                    </p>
                  </div>
                  <Badge variant={STATUS_VARIANTS[job.status] || "outline"}>
                    {job.status.replace("_", " ")}
                  </Badge>
                </div>

                {/* Address */}
                {job.property && (
                  <div className="flex items-start gap-1.5 mt-2 text-xs text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      {job.property.address}, {job.property.city},{" "}
                      {job.property.postcode}
                    </span>
                  </div>
                )}

                {/* Time */}
                {job.scheduledTime && (
                  <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>
                      {formatTime(job.scheduledTime)} &middot; {job.duration} min
                    </span>
                  </div>
                )}

                {/* Navigate button */}
                {job.property?.latitude && job.property?.longitude && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="mt-2 h-7 text-xs"
                    onClick={() =>
                      openNavigation(
                        job.property!.latitude!,
                        job.property!.longitude!
                      )
                    }
                  >
                    <Navigation className="mr-1.5 h-3 w-3" />
                    Navigate
                  </Button>
                )}
              </div>
            </div>
          </div>
        );
      })}

      {/* Route summary */}
      {totalDistanceMeters > 0 && (
        <div className="mt-4 pt-4 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Route Summary</span>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-lg font-bold">
                {formatDistanceMeters(totalDistanceMeters)}
              </p>
              <p className="text-xs text-muted-foreground">Total Distance</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-lg font-bold">
                {formatDurationSeconds(totalSeconds)}
              </p>
              <p className="text-xs text-muted-foreground">Drive Time</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
