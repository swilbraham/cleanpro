import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { customerSchema } from "@/lib/validators";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const customer = await prisma.customer.findUnique({
      where: { id },
      include: {
        properties: {
          orderBy: { createdAt: "desc" },
        },
        jobs: {
          include: {
            property: { select: { address: true } },
            assignedTo: { select: { name: true } },
          },
          orderBy: { scheduledDate: "desc" },
        },
        notes: {
          include: {
            author: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        quotes: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
        invoices: {
          orderBy: { createdAt: "desc" },
          take: 10,
        },
      },
    });

    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(customer);
  } catch (error) {
    console.error("Failed to fetch customer:", error);
    return NextResponse.json(
      { error: "Failed to fetch customer" },
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
    const validated = customerSchema.parse(body);

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Geocoding stub - preserve existing or set null
    const customer = await prisma.customer.update({
      where: { id },
      data: {
        ...validated,
        tags: validated.tags || [],
        latitude: null,
        longitude: null,
      },
    });

    return NextResponse.json(customer);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to update customer:", error);
    return NextResponse.json(
      { error: "Failed to update customer" },
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

    const existing = await prisma.customer.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Check for invoices - don't delete customers with invoices
    const invoiceCount = await prisma.invoice.count({
      where: { customerId: id },
    });
    if (invoiceCount > 0) {
      return NextResponse.json(
        { error: "Cannot delete a customer with invoices. Archive them instead." },
        { status: 400 }
      );
    }

    // Cascade delete related records in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete job line items for all customer jobs
      const jobIds = (
        await tx.job.findMany({ where: { customerId: id }, select: { id: true } })
      ).map((j) => j.id);
      if (jobIds.length > 0) {
        await tx.jobLineItem.deleteMany({ where: { jobId: { in: jobIds } } });
      }

      // Delete quote line items for all customer quotes
      const quoteIds = (
        await tx.quote.findMany({ where: { customerId: id }, select: { id: true } })
      ).map((q) => q.id);
      if (quoteIds.length > 0) {
        await tx.quoteLineItem.deleteMany({ where: { quoteId: { in: quoteIds } } });
      }

      await tx.note.deleteMany({ where: { customerId: id } });
      await tx.job.deleteMany({ where: { customerId: id } });
      await tx.quote.deleteMany({ where: { customerId: id } });
      await tx.property.deleteMany({ where: { customerId: id } });
      await tx.customer.delete({ where: { id } });
    });

    return NextResponse.json({ message: "Customer deleted" });
  } catch (error) {
    console.error("Failed to delete customer:", error);
    return NextResponse.json(
      { error: "Failed to delete customer" },
      { status: 500 }
    );
  }
}
