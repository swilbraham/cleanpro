import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, ids } = body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json(
        { error: "No items selected" },
        { status: 400 }
      );
    }

    switch (action) {
      case "delete": {
        // Check for invoices – block deletion if any customer has invoices
        const customersWithInvoices = await prisma.customer.findMany({
          where: { id: { in: ids }, invoices: { some: {} } },
          select: { firstName: true, lastName: true },
        });
        if (customersWithInvoices.length > 0) {
          const names = customersWithInvoices
            .map((c) => `${c.firstName} ${c.lastName}`)
            .join(", ");
          return NextResponse.json(
            {
              error: `Cannot delete customers with invoices: ${names}`,
            },
            { status: 400 }
          );
        }

        // Gather related job and quote IDs for cascading line item deletes
        const jobs = await prisma.job.findMany({
          where: { customerId: { in: ids } },
          select: { id: true },
        });
        const jobIds = jobs.map((j) => j.id);

        const quotes = await prisma.quote.findMany({
          where: { customerId: { in: ids } },
          select: { id: true },
        });
        const quoteIds = quotes.map((q) => q.id);

        await prisma.$transaction(async (tx) => {
          // Delete line items for jobs and quotes
          if (jobIds.length > 0) {
            await tx.jobLineItem.deleteMany({ where: { jobId: { in: jobIds } } });
          }
          if (quoteIds.length > 0) {
            await tx.quoteLineItem.deleteMany({ where: { quoteId: { in: quoteIds } } });
          }

          // Delete notes, jobs, quotes, properties, then customers
          await tx.note.deleteMany({ where: { customerId: { in: ids } } });
          await tx.job.deleteMany({ where: { customerId: { in: ids } } });
          await tx.quote.deleteMany({ where: { customerId: { in: ids } } });
          await tx.property.deleteMany({ where: { customerId: { in: ids } } });
          await tx.customer.deleteMany({ where: { id: { in: ids } } });
        });

        return NextResponse.json({
          message: `${ids.length} customer(s) deleted`,
          count: ids.length,
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error("Bulk operation failed:", error);
    return NextResponse.json(
      { error: error.message || "Bulk operation failed" },
      { status: 500 }
    );
  }
}
