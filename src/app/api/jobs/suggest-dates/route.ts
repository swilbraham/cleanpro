import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Get the postcode area (e.g. "CH43" from "CH43 2LF", "SW1A" from "SW1A 1AA")
function getPostcodeArea(postcode: string): string {
  const clean = postcode.replace(/\s+/g, "").toUpperCase();
  // UK postcodes: outward code is everything before the last 3 chars
  if (clean.length >= 5) {
    return clean.slice(0, -3).trim();
  }
  // Fallback: first part before space
  return postcode.split(" ")[0]?.toUpperCase() || postcode.toUpperCase();
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const postcode = searchParams.get("postcode") || "";
    const customerId = searchParams.get("customerId") || "";

    if (!postcode && !customerId) {
      return NextResponse.json(
        { error: "postcode or customerId is required" },
        { status: 400 }
      );
    }

    // Get the target postcode area
    let targetArea = "";
    if (postcode) {
      targetArea = getPostcodeArea(postcode);
    } else if (customerId) {
      const customer = await prisma.customer.findUnique({
        where: { id: customerId },
        select: { postcode: true },
      });
      if (customer?.postcode) {
        targetArea = getPostcodeArea(customer.postcode);
      }
    }

    // Get the next 30 days date range
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysOut = new Date(today);
    thirtyDaysOut.setDate(thirtyDaysOut.getDate() + 30);

    // Find all scheduled/in-progress jobs in the next 30 days
    const upcomingJobs = await prisma.job.findMany({
      where: {
        scheduledDate: {
          gte: today,
          lte: thirtyDaysOut,
        },
        status: { in: ["SCHEDULED", "IN_PROGRESS"] },
      },
      select: {
        scheduledDate: true,
        scheduledTime: true,
        duration: true,
        customer: { select: { postcode: true } },
        property: { select: { postcode: true } },
      },
      orderBy: { scheduledDate: "asc" },
    });

    // Score each date by how many jobs are in the same postcode area
    const dateScores: Record<
      string,
      { date: string; nearbyJobs: number; totalJobs: number; times: string[] }
    > = {};

    for (const job of upcomingJobs) {
      const dateStr = job.scheduledDate.toISOString().split("T")[0];

      if (!dateScores[dateStr]) {
        dateScores[dateStr] = {
          date: dateStr,
          nearbyJobs: 0,
          totalJobs: 0,
          times: [],
        };
      }

      dateScores[dateStr].totalJobs++;
      if (job.scheduledTime) {
        dateScores[dateStr].times.push(job.scheduledTime);
      }

      // Check if this job is in the same postcode area
      const jobPostcode =
        job.property?.postcode || job.customer?.postcode || "";
      if (targetArea && jobPostcode) {
        const jobArea = getPostcodeArea(jobPostcode);
        if (jobArea === targetArea) {
          dateScores[dateStr].nearbyJobs++;
        }
      }
    }

    // Sort: dates with most nearby jobs first, then by date
    const scoredDates = Object.values(dateScores)
      .filter((d) => d.nearbyJobs > 0)
      .sort((a, b) => {
        if (b.nearbyJobs !== a.nearbyJobs) return b.nearbyJobs - a.nearbyJobs;
        return a.date.localeCompare(b.date);
      });

    // If we have nearby matches, suggest those. Otherwise, suggest dates with fewest jobs (lighter days)
    let suggestions: {
      date: string;
      reason: string;
      nearbyJobs: number;
      totalJobs: number;
      suggestedTime: string | null;
    }[] = [];

    if (scoredDates.length > 0) {
      suggestions = scoredDates.slice(0, 3).map((d) => {
        // Suggest a time gap after the last nearby job
        const sortedTimes = d.times
          .filter(Boolean)
          .sort();
        let suggestedTime: string | null = null;

        if (sortedTimes.length > 0) {
          // Find the last scheduled time, add typical job duration (1hr)
          const lastTime = sortedTimes[sortedTimes.length - 1];
          const [h, m] = lastTime.split(":").map(Number);
          const suggestedHour = h + 1;
          if (suggestedHour < 18) {
            suggestedTime = `${String(suggestedHour).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
          }
        }

        return {
          date: d.date,
          reason: `${d.nearbyJobs} job${d.nearbyJobs > 1 ? "s" : ""} already in ${targetArea} area`,
          nearbyJobs: d.nearbyJobs,
          totalJobs: d.totalJobs,
          suggestedTime,
        };
      });
    }

    // If fewer than 3 suggestions, fill with lightest days (fewest total jobs)
    if (suggestions.length < 3) {
      const allDates: string[] = [];
      for (let i = 1; i <= 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() + i);
        // Skip weekends
        if (d.getDay() === 0 || d.getDay() === 6) continue;
        allDates.push(d.toISOString().split("T")[0]);
      }

      const lightDays = allDates
        .filter((date) => !suggestions.find((s) => s.date === date))
        .map((date) => ({
          date,
          totalJobs: dateScores[date]?.totalJobs || 0,
        }))
        .sort((a, b) => a.totalJobs - b.totalJobs)
        .slice(0, 3 - suggestions.length);

      for (const day of lightDays) {
        suggestions.push({
          date: day.date,
          reason:
            day.totalJobs === 0
              ? "Open day — no jobs scheduled"
              : `Light day — only ${day.totalJobs} job${day.totalJobs > 1 ? "s" : ""} booked`,
          nearbyJobs: 0,
          totalJobs: day.totalJobs,
          suggestedTime: "09:00",
        });
      }
    }

    return NextResponse.json({
      suggestions: suggestions.slice(0, 3),
      postcodeArea: targetArea,
    });
  } catch (error) {
    console.error("Failed to suggest dates:", error);
    return NextResponse.json(
      { error: "Failed to suggest dates" },
      { status: 500 }
    );
  }
}
