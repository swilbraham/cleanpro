import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { startOfDay, endOfDay, startOfWeek, endOfWeek, startOfMonth, endOfMonth } from "date-fns";

export async function GET() {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const [
      todayJobs,
      weekJobCount,
      revenueToday,
      revenueWeek,
      revenueMonth,
      outstandingInvoices,
      overdueInvoices,
    ] = await Promise.all([
      prisma.job.findMany({
        where: {
          scheduledDate: { gte: todayStart, lte: todayEnd },
          status: { not: "CANCELLED" },
        },
        include: {
          customer: true,
          property: true,
          assignedTo: true,
          lineItems: { include: { service: true } },
        },
        orderBy: { scheduledTime: "asc" },
      }),
      prisma.job.count({
        where: {
          scheduledDate: { gte: weekStart, lte: weekEnd },
          status: { not: "CANCELLED" },
        },
      }),
      prisma.payment.aggregate({
        where: {
          status: "SUCCEEDED",
          createdAt: { gte: todayStart, lte: todayEnd },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: "SUCCEEDED",
          createdAt: { gte: weekStart, lte: weekEnd },
        },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: {
          status: "SUCCEEDED",
          createdAt: { gte: monthStart, lte: monthEnd },
        },
        _sum: { amount: true },
      }),
      prisma.invoice.findMany({
        where: { status: { in: ["UNPAID", "PARTIAL"] } },
      }),
      prisma.invoice.findMany({
        where: {
          status: { in: ["UNPAID", "PARTIAL"] },
          dueDate: { lt: now },
        },
      }),
    ]);

    const outstandingTotal = outstandingInvoices.reduce(
      (sum, inv) => sum + (inv.total - inv.amountPaid),
      0
    );
    const overdueTotal = overdueInvoices.reduce(
      (sum, inv) => sum + (inv.total - inv.amountPaid),
      0
    );

    return NextResponse.json({
      todayJobs,
      weekJobCount,
      revenueToday: revenueToday._sum.amount || 0,
      revenueWeek: revenueWeek._sum.amount || 0,
      revenueMonth: revenueMonth._sum.amount || 0,
      outstandingCount: outstandingInvoices.length,
      outstandingTotal,
      overdueCount: overdueInvoices.length,
      overdueTotal,
    });
  } catch (error) {
    console.error("Dashboard stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch dashboard stats" },
      { status: 500 }
    );
  }
}
