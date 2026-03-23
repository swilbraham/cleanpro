import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (!from || !to) {
      return NextResponse.json(
        { error: "Missing required 'from' and 'to' query parameters" },
        { status: 400 }
      );
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const payments = await prisma.payment.findMany({
      where: {
        status: "SUCCEEDED",
        createdAt: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: { createdAt: "asc" },
    });

    const grouped: Record<string, number> = {};
    for (const payment of payments) {
      const dateKey = payment.createdAt.toISOString().split("T")[0];
      grouped[dateKey] = (grouped[dateKey] || 0) + payment.amount;
    }

    const data = Object.entries(grouped).map(([date, amount]) => ({
      date,
      amount: Math.round(amount * 100) / 100,
    }));

    return NextResponse.json(data);
  } catch (error) {
    console.error("Revenue report error:", error);
    return NextResponse.json(
      { error: "Failed to fetch revenue report" },
      { status: 500 }
    );
  }
}
