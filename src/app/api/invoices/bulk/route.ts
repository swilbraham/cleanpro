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
      case "void": {
        // Only void unpaid invoices (UNPAID or OVERDUE)
        const result = await prisma.invoice.updateMany({
          where: {
            id: { in: ids },
            status: { in: ["UNPAID", "OVERDUE"] },
          },
          data: { status: "VOID" },
        });

        return NextResponse.json({
          message: `${result.count} invoice(s) voided`,
          count: result.count,
        });
      }

      case "delete": {
        // Only allow deleting VOID invoices
        const nonVoidInvoices = await prisma.invoice.findMany({
          where: { id: { in: ids }, status: { not: "VOID" } },
          select: { invoiceNumber: true },
        });

        if (nonVoidInvoices.length > 0) {
          return NextResponse.json(
            {
              error: `Can only delete voided invoices. Non-void: ${nonVoidInvoices.map((i) => i.invoiceNumber).join(", ")}`,
            },
            { status: 400 }
          );
        }

        await prisma.$transaction(async (tx) => {
          await tx.payment.deleteMany({
            where: { invoiceId: { in: ids } },
          });
          await tx.invoice.deleteMany({
            where: { id: { in: ids } },
          });
        });

        return NextResponse.json({
          message: `${ids.length} invoice(s) deleted`,
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
