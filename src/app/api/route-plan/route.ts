import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface RouteRequest {
  date: string;
  startAddress?: string;
}

interface GoogleRouteLeg {
  duration: string;
  distanceMeters: number;
}

interface GoogleRoute {
  optimizedIntermediateWaypointIndex?: number[];
  legs: GoogleRouteLeg[];
  polyline?: {
    encodedPolyline: string;
  };
}

export async function POST(request: Request) {
  try {
    const body: RouteRequest = await request.json();
    const { date, startAddress } = body;

    if (!date) {
      return NextResponse.json(
        { error: "date is required" },
        { status: 400 }
      );
    }

    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    const jobs = await prisma.job.findMany({
      where: {
        scheduledDate: {
          gte: dayStart,
          lte: dayEnd,
        },
        status: {
          in: ["SCHEDULED", "IN_PROGRESS"],
        },
      },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        property: {
          select: {
            id: true,
            address: true,
            city: true,
            postcode: true,
            latitude: true,
            longitude: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true },
        },
        lineItems: {
          select: { id: true, description: true, total: true },
        },
      },
      orderBy: { scheduledTime: "asc" },
    });

    if (jobs.length === 0) {
      return NextResponse.json({
        jobs: [],
        orderedJobIds: [],
        legs: [],
        totalDuration: "0s",
        totalDistanceMeters: 0,
        encodedPolyline: null,
      });
    }

    const apiKey = process.env.GOOGLE_MAPS_API_KEY;

    // If no API key, return jobs in scheduledTime order (fallback)
    if (!apiKey) {
      return NextResponse.json({
        jobs,
        orderedJobIds: jobs.map((j) => j.id),
        legs: [],
        totalDuration: "0s",
        totalDistanceMeters: 0,
        encodedPolyline: null,
        fallback: true,
      });
    }

    // Build waypoints from job property/customer addresses
    const waypoints = jobs.map((job) => {
      const address = job.property
        ? `${job.property.address}, ${job.property.city}, ${job.property.postcode}`
        : "";
      return {
        jobId: job.id,
        address,
      };
    });

    // Filter out jobs with no address
    const validWaypoints = waypoints.filter((w) => w.address.trim() !== "");

    if (validWaypoints.length < 2) {
      return NextResponse.json({
        jobs,
        orderedJobIds: jobs.map((j) => j.id),
        legs: [],
        totalDuration: "0s",
        totalDistanceMeters: 0,
        encodedPolyline: null,
        fallback: true,
      });
    }

    // Origin: either startAddress or first job address
    const origin = startAddress || validWaypoints[0].address;
    const destination = validWaypoints[validWaypoints.length - 1].address;
    const intermediates = validWaypoints.slice(1, -1);

    const routeRequest: Record<string, unknown> = {
      origin: {
        address: origin,
      },
      destination: {
        address: destination,
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      optimizeWaypointOrder: intermediates.length > 0,
    };

    if (intermediates.length > 0) {
      routeRequest.intermediates = intermediates.map((wp) => ({
        address: wp.address,
      }));
    }

    try {
      const response = await fetch(
        "https://routes.googleapis.com/directions/v2:computeRoutes",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Goog-Api-Key": apiKey,
            "X-Goog-FieldMask":
              "routes.optimizedIntermediateWaypointIndex,routes.legs.duration,routes.legs.distanceMeters,routes.polyline",
          },
          body: JSON.stringify(routeRequest),
        }
      );

      if (!response.ok) {
        console.error(
          "Google Routes API error:",
          response.status,
          await response.text()
        );
        // Fallback to time-ordered
        return NextResponse.json({
          jobs,
          orderedJobIds: jobs.map((j) => j.id),
          legs: [],
          totalDuration: "0s",
          totalDistanceMeters: 0,
          encodedPolyline: null,
          fallback: true,
        });
      }

      const data = await response.json();
      const route: GoogleRoute = data.routes?.[0];

      if (!route) {
        return NextResponse.json({
          jobs,
          orderedJobIds: jobs.map((j) => j.id),
          legs: [],
          totalDuration: "0s",
          totalDistanceMeters: 0,
          encodedPolyline: null,
          fallback: true,
        });
      }

      // Reorder job IDs based on optimized waypoint order
      let orderedJobIds: string[];
      if (
        route.optimizedIntermediateWaypointIndex &&
        route.optimizedIntermediateWaypointIndex.length > 0
      ) {
        // First waypoint is always the origin (index 0 in validWaypoints)
        orderedJobIds = [validWaypoints[0].jobId];
        // Map optimized intermediate indices back to job IDs
        for (const idx of route.optimizedIntermediateWaypointIndex) {
          orderedJobIds.push(intermediates[idx].jobId);
        }
        // Last waypoint is always the destination
        orderedJobIds.push(
          validWaypoints[validWaypoints.length - 1].jobId
        );
      } else {
        orderedJobIds = validWaypoints.map((w) => w.jobId);
      }

      // Calculate totals from legs
      const legs = (route.legs || []).map((leg) => ({
        duration: leg.duration || "0s",
        distanceMeters: leg.distanceMeters || 0,
      }));

      let totalDistanceMeters = 0;
      let totalDurationSeconds = 0;
      for (const leg of legs) {
        totalDistanceMeters += leg.distanceMeters;
        // Parse duration string like "1234s"
        const seconds = parseInt(leg.duration.replace("s", ""), 10) || 0;
        totalDurationSeconds += seconds;
      }

      const totalDuration = `${totalDurationSeconds}s`;
      const encodedPolyline =
        route.polyline?.encodedPolyline || null;

      // Reorder jobs array to match optimized order
      const jobMap = new Map(jobs.map((j) => [j.id, j]));
      const orderedJobs = orderedJobIds
        .map((id) => jobMap.get(id))
        .filter(Boolean);

      // Add any jobs that weren't in the optimization (no address)
      const optimizedSet = new Set(orderedJobIds);
      const remainingJobs = jobs.filter((j) => !optimizedSet.has(j.id));

      return NextResponse.json({
        jobs: [...orderedJobs, ...remainingJobs],
        orderedJobIds,
        legs,
        totalDuration,
        totalDistanceMeters,
        encodedPolyline,
        fallback: false,
      });
    } catch (apiError) {
      console.error("Google Routes API call failed:", apiError);
      // Fallback to time-ordered
      return NextResponse.json({
        jobs,
        orderedJobIds: jobs.map((j) => j.id),
        legs: [],
        totalDuration: "0s",
        totalDistanceMeters: 0,
        encodedPolyline: null,
        fallback: true,
      });
    }
  } catch (error) {
    console.error("Failed to plan route:", error);
    return NextResponse.json(
      { error: "Failed to plan route" },
      { status: 500 }
    );
  }
}
