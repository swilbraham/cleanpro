import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.timeEntry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 }
      );
    }

    const data: any = {};

    if (body.clockOut !== undefined) {
      const clockOut = body.clockOut ? new Date(body.clockOut) : new Date();
      data.clockOut = clockOut;
      // Calculate duration in minutes
      const clockIn = existing.clockIn;
      data.duration = Math.round(
        (clockOut.getTime() - clockIn.getTime()) / 60000
      );
    }

    if (body.notes !== undefined) {
      data.notes = body.notes;
    }

    if (body.jobId !== undefined) {
      data.jobId = body.jobId || null;
    }

    const entry = await prisma.timeEntry.update({
      where: { id },
      data,
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        job: {
          select: {
            id: true,
            jobNumber: true,
            customer: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    return NextResponse.json(entry);
  } catch (error) {
    console.error("Failed to update time entry:", error);
    return NextResponse.json(
      { error: "Failed to update time entry" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.timeEntry.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Time entry not found" },
        { status: 404 }
      );
    }

    await prisma.timeEntry.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete time entry:", error);
    return NextResponse.json(
      { error: "Failed to delete time entry" },
      { status: 500 }
    );
  }
}
