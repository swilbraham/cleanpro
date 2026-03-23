import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const source = searchParams.get("source") || "";
    const priority = searchParams.get("priority") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (source) {
      where.source = source;
    }

    if (priority) {
      where.priority = priority;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" as const } },
        { lastName: { contains: search, mode: "insensitive" as const } },
        { email: { contains: search, mode: "insensitive" as const } },
        { phone: { contains: search } },
        { description: { contains: search, mode: "insensitive" as const } },
        { address: { contains: search, mode: "insensitive" as const } },
        { city: { contains: search, mode: "insensitive" as const } },
        { postcode: { contains: search, mode: "insensitive" as const } },
      ];
    }

    const [requests, total] = await Promise.all([
      prisma.request.findMany({
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
          assignedTo: { select: { id: true, name: true, color: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.request.count({ where }),
    ]);

    return NextResponse.json({
      requests,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch requests:", error);
    return NextResponse.json(
      { error: "Failed to fetch requests" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      source,
      firstName,
      lastName,
      email,
      phone,
      address,
      city,
      postcode,
      description,
      priority,
      notes,
      assignedToId,
    } = body;

    if (!firstName || !lastName || !phone || !description) {
      return NextResponse.json(
        { error: "firstName, lastName, phone, and description are required" },
        { status: 400 }
      );
    }

    const newRequest = await prisma.request.create({
      data: {
        source: source || "PHONE",
        firstName,
        lastName,
        email: email || null,
        phone,
        address: address || null,
        city: city || null,
        postcode: postcode || null,
        description,
        priority: priority || "MEDIUM",
        notes: notes || null,
        assignedToId: assignedToId || null,
      },
      include: {
        customer: {
          select: { id: true, firstName: true, lastName: true },
        },
        assignedTo: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(newRequest, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create request" },
      { status: 500 }
    );
  }
}
