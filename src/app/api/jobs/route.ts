import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextNumber } from "@/lib/sequence";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const assignedTo = searchParams.get("assignedTo") || "";
    const customerId = searchParams.get("customerId") || "";
    const from = searchParams.get("from") || "";
    const to = searchParams.get("to") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (assignedTo) {
      where.assignedToId = assignedTo;
    }

    if (customerId) {
      where.customerId = customerId;
    }

    if (from || to) {
      where.scheduledDate = {};
      if (from) {
        where.scheduledDate.gte = new Date(from);
      }
      if (to) {
        where.scheduledDate.lte = new Date(to);
      }
    }

    if (search) {
      where.OR = [
        { jobNumber: { contains: search, mode: "insensitive" as const } },
        {
          customer: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" as const } },
              { lastName: { contains: search, mode: "insensitive" as const } },
              { phone: { contains: search } },
            ],
          },
        },
        {
          property: {
            address: { contains: search, mode: "insensitive" as const },
          },
        },
      ];
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
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
            select: { id: true, address: true, city: true, postcode: true },
          },
          assignedTo: { select: { id: true, name: true, color: true } },
          lineItems: {
            select: { id: true, description: true, total: true },
          },
          invoice: { select: { id: true, invoiceNumber: true } },
        },
        orderBy: { scheduledDate: "desc" },
        skip,
        take: limit,
      }),
      prisma.job.count({ where }),
    ]);

    return NextResponse.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch jobs:", error);
    return NextResponse.json(
      { error: "Failed to fetch jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      customerId,
      propertyId,
      assignedToId,
      scheduledDate,
      scheduledTime,
      duration,
      notes,
      lineItems,
    } = body;

    if (!customerId || !scheduledDate) {
      return NextResponse.json(
        { error: "customerId and scheduledDate are required" },
        { status: 400 }
      );
    }

    const jobNumber = await getNextNumber("job");

    const job = await prisma.job.create({
      data: {
        jobNumber,
        customerId,
        propertyId: propertyId || null,
        assignedToId: assignedToId || null,
        scheduledDate: new Date(scheduledDate),
        scheduledTime: scheduledTime || null,
        duration: duration || 60,
        notes: notes || null,
        lineItems: lineItems?.length
          ? {
              create: lineItems.map(
                (item: {
                  serviceId: string;
                  description: string;
                  quantity: number;
                  unitPrice: number;
                }) => ({
                  serviceId: item.serviceId,
                  description: item.description,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                  total: item.quantity * item.unitPrice,
                })
              ),
            }
          : undefined,
      },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true },
        },
        property: {
          select: { id: true, address: true },
        },
        assignedTo: { select: { id: true, name: true } },
        lineItems: true,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create job:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create job" },
      { status: 500 }
    );
  }
}
