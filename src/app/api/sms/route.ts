import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: List all SMS reminders with filtering
export async function GET(request: Request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  const type = url.searchParams.get("type");
  const page = parseInt(url.searchParams.get("page") || "1");
  const limit = 50;

  const where: any = {};
  if (status) where.status = status;
  if (type) where.type = type;

  const [reminders, total] = await Promise.all([
    prisma.smsReminder.findMany({
      where,
      include: {
        job: {
          select: {
            jobNumber: true,
            scheduledDate: true,
            customer: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: (page - 1) * limit,
    }),
    prisma.smsReminder.count({ where }),
  ]);

  return NextResponse.json({ reminders, total, page, pages: Math.ceil(total / limit) });
}
