import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderToStream } from "@react-pdf/renderer";
import { InvoicePDF } from "@/components/invoices/invoice-pdf";

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
          where: { status: "SUCCEEDED" },
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

    const stream = await renderToStream(
      InvoicePDF({ invoice: invoice as any })
    );

    return new Response(stream as unknown as ReadableStream, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${invoice.invoiceNumber}.pdf"`,
      },
    });
  } catch (error) {
    console.error("Failed to generate PDF:", error);
    return NextResponse.json(
      { error: "Failed to generate PDF" },
      { status: 500 }
    );
  }
}
