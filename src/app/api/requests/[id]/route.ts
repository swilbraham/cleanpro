import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const req = await prisma.request.findUnique({
      where: { id },
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            postcode: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            color: true,
          },
        },
      },
    });

    if (!req) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(req);
  } catch (error) {
    console.error("Failed to fetch request:", error);
    return NextResponse.json(
      { error: "Failed to fetch request" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const existing = await prisma.request.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

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
      status,
      priority,
      notes,
      customerId,
      assignedToId,
    } = body;

    const data: any = {};

    if (source !== undefined) data.source = source;
    if (firstName !== undefined) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;
    if (email !== undefined) data.email = email || null;
    if (phone !== undefined) data.phone = phone;
    if (address !== undefined) data.address = address || null;
    if (city !== undefined) data.city = city || null;
    if (postcode !== undefined) data.postcode = postcode || null;
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status;
    if (priority !== undefined) data.priority = priority;
    if (notes !== undefined) data.notes = notes || null;
    if (customerId !== undefined) data.customerId = customerId || null;
    if (assignedToId !== undefined) data.assignedToId = assignedToId || null;

    const updated = await prisma.request.update({
      where: { id },
      data,
      include: {
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        assignedTo: {
          select: { id: true, name: true, email: true, color: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error: any) {
    console.error("Failed to update request:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update request" },
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

    const existing = await prisma.request.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Request not found" },
        { status: 404 }
      );
    }

    await prisma.request.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete request:", error);
    return NextResponse.json(
      { error: "Failed to delete request" },
      { status: 500 }
    );
  }
}
