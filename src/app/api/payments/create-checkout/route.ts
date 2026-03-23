import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { invoiceId } = body;

    if (!invoiceId) {
      return NextResponse.json(
        { error: "invoiceId is required" },
        { status: 400 }
      );
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        job: {
          include: {
            lineItems: {
              include: {
                service: {
                  select: { name: true },
                },
              },
            },
          },
        },
      },
    });

    if (!invoice) {
      return NextResponse.json(
        { error: "Invoice not found" },
        { status: 404 }
      );
    }

    if (invoice.status === "PAID") {
      return NextResponse.json(
        { error: "Invoice is already paid" },
        { status: 400 }
      );
    }

    if (invoice.status === "VOID") {
      return NextResponse.json(
        { error: "Invoice has been voided" },
        { status: 400 }
      );
    }

    const amountDue = invoice.total - invoice.amountPaid;

    if (amountDue <= 0) {
      return NextResponse.json(
        { error: "No amount due on this invoice" },
        { status: 400 }
      );
    }

    const lineItems = invoice.job.lineItems.map((item) => ({
      price_data: {
        currency: "gbp",
        product_data: {
          name: item.service.name,
          description: item.description,
        },
        unit_amount: Math.round(item.unitPrice * 100),
      },
      quantity: item.quantity,
    }));

    // Add VAT as a separate line item
    if (invoice.taxAmount > 0) {
      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: {
            name: `VAT (${invoice.taxRate}%)`,
            description: "Value Added Tax",
          },
          unit_amount: Math.round(invoice.taxAmount * 100),
        },
        quantity: 1,
      });
    }

    // If partial payment has been made, adjust with a discount
    if (invoice.amountPaid > 0) {
      lineItems.push({
        price_data: {
          currency: "gbp",
          product_data: {
            name: "Previous payments",
            description: "Amount already paid",
          },
          unit_amount: -Math.round(invoice.amountPaid * 100),
        },
        quantity: 1,
      });
    }

    const origin = new URL(request.url).origin;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card", "klarna"],
      mode: "payment",
      customer_email: invoice.customer.email || undefined,
      line_items: lineItems,
      metadata: {
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
      },
      success_url: `${origin}/invoices/${invoice.id}?payment=success`,
      cancel_url: `${origin}/invoices/${invoice.id}?payment=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create checkout session:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
