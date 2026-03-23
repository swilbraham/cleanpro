import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { quoteSchema } from "@/lib/validators";
import { getNextNumber } from "@/lib/sequence";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "20", 10);
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { quoteNumber: { contains: search, mode: "insensitive" } },
        {
          customer: {
            OR: [
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { phone: { contains: search } },
            ],
          },
        },
      ];
    }

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true,
            },
          },
          lineItems: { select: { id: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take: limit,
      }),
      prisma.quote.count({ where }),
    ]);

    return NextResponse.json({
      quotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Failed to fetch quotes:", error);
    return NextResponse.json(
      { error: "Failed to fetch quotes" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = quoteSchema.parse(body);

    // Verify customer exists
    const customer = await prisma.customer.findUnique({
      where: { id: validated.customerId },
    });
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
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

    const quoteNumber = await getNextNumber("quote");

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        customerId: validated.customerId,
        status: "DRAFT",
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

    return NextResponse.json(quote, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to create quote:", error);
    return NextResponse.json(
      { error: "Failed to create quote" },
      { status: 500 }
    );
  }
}
