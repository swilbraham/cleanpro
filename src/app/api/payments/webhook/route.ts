import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import Stripe from "stripe";

export async function POST(request: Request) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message);
    return NextResponse.json(
      { error: "Invalid signature" },
      { status: 400 }
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const invoiceId = session.metadata?.invoiceId;

    if (!invoiceId) {
      console.error("No invoiceId in session metadata");
      return NextResponse.json(
        { error: "Missing invoiceId in metadata" },
        { status: 400 }
      );
    }

    const amountTotal = (session.amount_total || 0) / 100;

    // Determine payment method from the session
    const paymentMethodType = session.payment_method_types?.[0];
    const method = paymentMethodType === "klarna" ? "KLARNA" : "CARD";

    try {
      await prisma.$transaction(async (tx) => {
        // Create the payment record
        await tx.payment.create({
          data: {
            invoiceId,
            amount: amountTotal,
            method,
            stripePaymentId: session.payment_intent as string,
            stripeCheckoutId: session.id,
            status: "SUCCEEDED",
          },
        });

        // Get the invoice to calculate new totals
        const invoice = await tx.invoice.findUniqueOrThrow({
          where: { id: invoiceId },
        });

        const newAmountPaid = invoice.amountPaid + amountTotal;
        const isPaid = newAmountPaid >= invoice.total;

        await tx.invoice.update({
          where: { id: invoiceId },
          data: {
            amountPaid: newAmountPaid,
            status: isPaid ? "PAID" : "PARTIAL",
            paidAt: isPaid ? new Date() : undefined,
          },
        });
      });
    } catch (error) {
      console.error("Failed to process payment:", error);
      return NextResponse.json(
        { error: "Failed to process payment" },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}
