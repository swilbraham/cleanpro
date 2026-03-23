import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNextNumber } from "@/lib/sequence";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const quote = await prisma.quote.findUnique({
      where: { id },
      include: {
        lineItems: true,
        job: { select: { id: true } },
      },
    });

    if (!quote) {
      return NextResponse.json(
        { error: "Quote not found" },
        { status: 404 }
      );
    }

    if (quote.status === "CONVERTED") {
      return NextResponse.json(
        { error: "Quote has already been converted" },
        { status: 400 }
      );
    }

    if (quote.status === "DECLINED") {
      return NextResponse.json(
        { error: "Cannot convert a declined quote" },
        { status: 400 }
      );
    }

    const jobNumber = await getNextNumber("job");

    // Schedule for tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);

    const job = await prisma.$transaction(async (tx) => {
      // Create the job with copied line items
      const newJob = await tx.job.create({
        data: {
          jobNumber,
          customerId: quote.customerId,
          quoteId: quote.id,
          status: "SCHEDULED",
          scheduledDate: tomorrow,
          scheduledTime: "09:00",
          duration: 60,
          notes: quote.notes,
          lineItems: {
            create: quote.lineItems.map((item) => ({
              serviceId: item.serviceId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              total: item.total,
            })),
          },
        },
        include: {
          customer: true,
          lineItems: { include: { service: true } },
        },
      });

      // Update quote status to CONVERTED
      await tx.quote.update({
        where: { id: quote.id },
        data: { status: "CONVERTED" },
      });

      return newJob;
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error("Failed to convert quote to job:", error);
    return NextResponse.json(
      { error: "Failed to convert quote to job" },
      { status: 500 }
    );
  }
}
