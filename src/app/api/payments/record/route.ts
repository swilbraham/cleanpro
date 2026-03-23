import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoiceId, amount, method } = body;

    if (!invoiceId || !amount || !method) {
      return NextResponse.json(
        { error: "invoiceId, amount, and method are required" },
        { status: 400 }
      );
    }

    if (!["CASH", "BANK_TRANSFER"].includes(method)) {
      return NextResponse.json(
        { error: "Manual payments must use CASH or BANK_TRANSFER method" },
        { status: 400 }
      );
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { error: "Amount must be a positive number" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id: invoiceId },
      });

      if (!invoice) {
        throw new Error("Invoice not found");
      }

      if (invoice.status === "PAID") {
        throw new Error("Invoice is already paid");
      }

      if (invoice.status === "VOID") {
        throw new Error("Invoice has been voided");
      }

      const amountDue = invoice.total - invoice.amountPaid;
      if (parsedAmount > amountDue) {
        throw new Error("Amount exceeds the amount due");
      }

      const payment = await tx.payment.create({
        data: {
          invoiceId,
          amount: parsedAmount,
          method,
          status: "SUCCEEDED",
        },
      });

      const newAmountPaid = invoice.amountPaid + parsedAmount;
      const isPaid = newAmountPaid >= invoice.total;

      await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: newAmountPaid,
          status: isPaid ? "PAID" : "PARTIAL",
          paidAt: isPaid ? new Date() : undefined,
        },
      });

      return payment;
    });

    return NextResponse.json(result, { status: 201 });
  } catch (error: any) {
    console.error("Failed to record payment:", error);
    const message = error.message || "Failed to record payment";
    const status = message.includes("not found") ? 404 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
