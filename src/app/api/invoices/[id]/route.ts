import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const invoice = await prisma.invoice.findUnique({
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
        job: {
          include: {
            lineItems: {
              include: {
                service: {
                  select: {
                    id: true,
                    name: true,
                    unit: true,
                  },
                },
              },
            },
          },
        },
        payments: {
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error("Failed to fetch invoice:", error);
    return NextResponse.json(
      { error: "Failed to fetch invoice" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const invoice = await prisma.invoice.findUnique({
      where: { id },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (body.status !== undefined) {
      updateData.status = body.status;
    }
    if (body.notes !== undefined) {
      updateData.notes = body.notes;
    }
    if (body.dueDate !== undefined) {
      updateData.dueDate = new Date(body.dueDate);
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: updateData,
      include: {
        customer: true,
        job: {
          include: {
            lineItems: {
              include: { service: true },
            },
          },
        },
        payments: true,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Failed to update invoice:", error);
    return NextResponse.json(
      { error: "Failed to update invoice" },
      { status: 500 }
    );
  }
}
