import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const userId = searchParams.get("userId");

    const where: any = {};

    if (from || to) {
      where.clockIn = {};
      if (from) where.clockIn.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.clockIn.lte = toDate;
      }
    }

    if (userId) {
      where.userId = userId;
    }

    const entries = await prisma.timeEntry.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        job: {
          select: {
            id: true,
            jobNumber: true,
            customer: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: { clockIn: "desc" },
    });

    return NextResponse.json({ entries });
  } catch (error) {
    console.error("Failed to fetch time entries:", error);
    return NextResponse.json(
      { error: "Failed to fetch time entries" },
      { status: 500 }
    );
  }
}

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

    // Check if user already has an open time entry
    const openEntry = await prisma.timeEntry.findFirst({
      where: {
        userId,
        clockOut: null,
      },
    });

    if (openEntry) {
      return NextResponse.json(
        { error: "User already has an open time entry. Clock out first." },
        { status: 400 }
      );
    }

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

    return NextResponse.json(entry, { status: 201 });
  } catch (error) {
    console.error("Failed to create time entry:", error);
    return NextResponse.json(
      { error: "Failed to create time entry" },
      { status: 500 }
    );
  }
}
