import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.job.findUnique({
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
        property: {
          select: {
            id: true,
            address: true,
            city: true,
            postcode: true,
            propertyType: true,
            rooms: true,
            sqFootage: true,
            carpetTypes: true,
            accessNotes: true,
          },
        },
        quote: {
          select: {
            id: true,
            quoteNumber: true,
            total: true,
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
        lineItems: {
          include: {
            service: {
              select: { id: true, name: true, unit: true },
            },
          },
        },
        invoice: {
          select: {
            id: true,
            invoiceNumber: true,
            status: true,
            total: true,
            amountPaid: true,
          },
        },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json(job);
  } catch (error) {
    console.error("Failed to fetch job:", error);
    return NextResponse.json(
      { error: "Failed to fetch job" },
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

    const existing = await prisma.job.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const {
      status,
      scheduledDate,
      scheduledTime,
      duration,
      assignedToId,
      propertyId,
      notes,
      lineItems,
    } = body;

    const data: any = {};

    if (status !== undefined) data.status = status;
    if (scheduledDate !== undefined)
      data.scheduledDate = new Date(scheduledDate);
    if (scheduledTime !== undefined) data.scheduledTime = scheduledTime;
    if (duration !== undefined) data.duration = duration;
    if (assignedToId !== undefined) data.assignedToId = assignedToId || null;
    if (propertyId !== undefined) data.propertyId = propertyId || null;
    if (notes !== undefined) data.notes = notes;

    const job = await prisma.$transaction(async (tx) => {
      if (lineItems !== undefined) {
        await tx.jobLineItem.deleteMany({ where: { jobId: id } });
        if (lineItems.length > 0) {
          await tx.jobLineItem.createMany({
            data: lineItems.map(
              (item: {
                serviceId: string;
                description: string;
                quantity: number;
                unitPrice: number;
              }) => ({
                jobId: id,
                serviceId: item.serviceId,
                description: item.description,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                total: item.quantity * item.unitPrice,
              })
            ),
          });
        }
      }

      return tx.job.update({
        where: { id },
        data,
        include: {
          customer: {
            select: { id: true, firstName: true, lastName: true },
          },
          property: {
            select: { id: true, address: true, city: true, postcode: true },
          },
          assignedTo: { select: { id: true, name: true, color: true } },
          lineItems: {
            include: {
              service: { select: { id: true, name: true, unit: true } },
            },
          },
          invoice: {
            select: { id: true, invoiceNumber: true, status: true },
          },
        },
      });
    });

    return NextResponse.json(job);
  } catch (error: any) {
    console.error("Failed to update job:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update job" },
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

    const existing = await prisma.job.findUnique({
      where: { id },
      include: { invoice: { select: { id: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (existing.invoice) {
      return NextResponse.json(
        { error: "Cannot delete a job that has an invoice. Void the invoice first." },
        { status: 400 }
      );
    }

    await prisma.job.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete job:", error);
    return NextResponse.json(
      { error: "Failed to delete job" },
      { status: 500 }
    );
  }
}
