import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, jobId, notes } = body;

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      );
    }

    // Check if user has an open time entry
    const openEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        clockOut: null,
      },
    });

    if (openEntry) {
      // Clock out
      const clockOut = new Date();
      const duration = Math.round(
        (clockOut.getTime() - openEntry.clockIn.getTime()) / 60000
      );

      const entry = await prisma.timeEntry.update({
        where: { id: openEntry.id },
        data: {
          clockOut,
          duration,
        },
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

      return NextResponse.json({
        entry,
        action: "clocked_out",
      });
    } else {
      // Clock in
      const entry = await prisma.timeEntry.create({
        data: {
          userId,
          jobId: jobId || null,
          clockIn: new Date(),
          notes: notes || null,
        },
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

      return NextResponse.json({
        entry,
        action: "clocked_in",
      });
    }
  } catch (error) {
    console.error("Failed to toggle clock:", error);
    return NextResponse.json(
      { error: "Failed to toggle clock" },
      { status: 500 }
    );
  }
}
