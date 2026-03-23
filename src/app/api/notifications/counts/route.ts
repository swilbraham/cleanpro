import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const [newRequests, overdueInvoices, todaysJobs] = await Promise.all([
      prisma.request.count({
        where: { status: "NEW" },
      }),
      prisma.invoice.count({
        where: { status: "OVERDUE" },
      }),
      prisma.job.count({
        where: {
          scheduledDate: {
            gte: todayStart,
            lte: todayEnd,
          },
          status: "SCHEDULED",
        },
      }),
    ]);

    return NextResponse.json({
      newRequests,
      overdueInvoices,
      todaysJobs,
    });
  } catch (error) {
    console.error("Notification counts error:", error);
    return NextResponse.json(
      { error: "Failed to fetch notification counts" },
      { status: 500 }
    );
  }
}
