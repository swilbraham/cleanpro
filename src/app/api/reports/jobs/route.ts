import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing required 'from' and 'to' query parameters" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const jobsByStatus = await prisma.job.groupBy({
      by: ["status"],
      _count: true,
      where: {
        scheduledDate: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    const data = jobsByStatus.map((group) => ({
      status: group.status,
      count: group._count,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Jobs report error:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs report" },
      { status: 500 }
    );
  }
}
