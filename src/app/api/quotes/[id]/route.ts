import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { quoteSchema } from "@/lib/validators";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        customer: true,
        lineItems: {
          include: { service: true },
          orderBy: { id: "asc" },
        },
        job: {
          select: { id: true, jobNumber: true, status: true },
        },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(quote);
  } catch (error) {
    console.error("Failed to fetch quote:", error);
    return NextResponse.json(
      { error: "Failed to fetch quote" },
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
    const validated = quoteSchema.parse(body);

    const existing = await prisma.quote.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    if (existing.status === "CONVERTED") {
      return NextResponse.json(
        { error: "Cannot edit a converted quote" },
        { status: 400 }
      );
    }

    // Calculate line item totals
    const lineItems = validated.lineItems.map((item) => ({
      serviceId: item.serviceId,
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      total: item.quantity * item.unitPrice,
    }));

    const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = 20;
    const taxAmount = subtotal * 0.2;
    const total = subtotal + taxAmount;

    const quote = await prisma.$transaction(async (tx) => {
      // Delete existing line items
      await tx.quoteLineItem.deleteMany({ where: { quoteId: id } });

      // Update quote with new line items
      return tx.quote.update({
        where: { id },
        data: {
          customerId: validated.customerId,
          subtotal,
          taxRate,
          taxAmount,
          total,
          notes: validated.notes || null,
          validUntil: validated.validUntil
            ? new Date(validated.validUntil)
            : null,
          lineItems: {
            create: lineItems,
          },
        },
        include: {
          customer: true,
          lineItems: { include: { service: true } },
        },
      });
    });

    return NextResponse.json(quote);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to update quote:", error);
    return NextResponse.json(
      { error: "Failed to update quote" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.quote.findUnique({
      where: { id },
      include: { job: { select: { id: true } } },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    if (existing.status === "CONVERTED" && existing.job) {
      return NextResponse.json(
        { error: "Cannot delete a converted quote with an associated job" },
        { status: 400 }
      );
    }

    await prisma.quote.delete({ where: { id } });

    return NextResponse.json({ message: "Quote deleted" });
  } catch (error) {
    console.error("Failed to delete quote:", error);
    return NextResponse.json(
      { error: "Failed to delete quote" },
      { status: 500 }
    );
  }
}
