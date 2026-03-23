import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextNumber } from "@/lib/sequence";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const job = await prisma.job.findUnique({
      where: { id },
      include: {
        lineItems: true,
        invoice: { select: { id: true } },
      },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    if (job.status !== "COMPLETED") {
      return NextResponse.json(
        { error: "Can only generate invoices for completed jobs" },
        { status: 400 }
      );
    }

    if (job.invoice) {
      return NextResponse.json(
        { error: "This job already has an invoice" },
        { status: 400 }
      );
    }

    if (job.lineItems.length === 0) {
      return NextResponse.json(
        { error: "Cannot generate an invoice for a job with no line items" },
        { status: 400 }
      );
    }

    const subtotal = job.lineItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = 20;
    const taxAmount = subtotal * 0.2;
    const total = subtotal + taxAmount;
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 14);

    const invoice = await prisma.$transaction(async (tx) => {
      const invoiceNumber = await getNextNumber("invoice");

      const newInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          jobId: id,
          customerId: job.customerId,
          subtotal,
          taxRate,
          taxAmount,
          total,
          dueDate,
        },
      });

      await tx.job.update({
        where: { id },
        data: { status: "INVOICED" },
      });

      return newInvoice;
    });

    return NextResponse.json(invoice, { status: 201 });
  } catch (error) {
    console.error("Failed to generate invoice:", error);
    return NextResponse.json(
      { error: "Failed to generate invoice" },
      { status: 500 }
    );
  }
}
