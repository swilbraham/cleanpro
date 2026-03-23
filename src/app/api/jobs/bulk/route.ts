import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No items selected" },
        { status: 400 }
      );
    }

    switch (action) {
      case "delete": {
        // Check for invoiced jobs
        const invoicedJobs = await prisma.job.findMany({
          where: { id: { in: ids }, invoice: { isNot: null } },
          select: { jobNumber: true },
        });
        if (invoicedJobs.length > 0) {
          return NextResponse.json(
            {
              error: `Cannot delete jobs with invoices: ${invoicedJobs.map((j) => j.jobNumber).join(", ")}`,
            },
            { status: 400 }
          );
        }

        await prisma.$transaction(async (tx) => {
          await tx.jobLineItem.deleteMany({ where: { jobId: { in: ids } } });
          await tx.job.deleteMany({ where: { id: { in: ids } } });
        });

        return NextResponse.json({
          message: `${ids.length} job(s) deleted`,
          count: ids.length,
        });
      }

      case "cancel": {
        const result = await prisma.job.updateMany({
          where: {
            id: { in: ids },
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          },
          data: { status: "CANCELLED" },
        });

        return NextResponse.json({
          message: `${result.count} job(s) cancelled`,
          count: result.count,
        });
      }

      case "schedule": {
        const result = await prisma.job.updateMany({
          where: {
            id: { in: ids },
            status: { in: ["CANCELLED"] },
          },
          data: { status: "SCHEDULED" },
        });

        return NextResponse.json({
          message: `${result.count} job(s) rescheduled`,
          count: result.count,
        });
      }

      case "complete": {
        const result = await prisma.job.updateMany({
          where: {
            id: { in: ids },
            status: { in: ["SCHEDULED", "IN_PROGRESS"] },
          },
          data: { status: "COMPLETED" },
        });

        return NextResponse.json({
          message: `${result.count} job(s) completed`,
          count: result.count,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Bulk operation failed:", error);
    return NextResponse.json(
      { error: error.message || "Bulk operation failed" },
      { status: 500 }
    );
  }
}
