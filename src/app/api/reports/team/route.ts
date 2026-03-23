import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        role: true,
        jobs: {
          select: {
            id: true,
            status: true,
            lineItems: {
              select: {
                total: true,
              },
            },
          },
        },
      },
    });

    const data = users.map((user) => {
      const totalJobs = user.jobs.length;
      const completedJobs = user.jobs.filter(
        (j) => j.status === "COMPLETED" || j.status === "INVOICED"
      ).length;
      const revenue = user.jobs
        .filter((j) => j.status === "COMPLETED" || j.status === "INVOICED")
        .reduce(
          (sum, job) =>
            sum + job.lineItems.reduce((s, li) => s + li.total, 0),
          0
        );

      return {
        id: user.id,
        name: user.name,
        role: user.role,
        totalJobs,
        completedJobs,
        revenue: Math.round(revenue * 100) / 100,
      };
    });

    return NextResponse.json(data);
  } catch (error) {
    console.error("Team report error:", error);
    return NextResponse.json(
      { error: "Failed to fetch team report" },
      { status: 500 }
    );
  }
}
