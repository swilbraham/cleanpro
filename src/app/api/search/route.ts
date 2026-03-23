import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";

    if (q.length < 2) {
      return NextResponse.json(
        { customers: [], jobs: [], invoices: [], requests: [] }
      );
    }

    const [customers, jobs, invoices, requests] = await Promise.all([
      prisma.customer.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.job.findMany({
        where: {
          jobNumber: { contains: q, mode: "insensitive" },
        },
        include: { customer: true },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.invoice.findMany({
        where: {
          invoiceNumber: { contains: q, mode: "insensitive" },
        },
        include: { customer: true },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
      prisma.request.findMany({
        where: {
          OR: [
            { firstName: { contains: q, mode: "insensitive" } },
            { lastName: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        },
        take: 5,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    return NextResponse.json({
      customers: customers.map((c) => ({
        id: c.id,
        label: `${c.firstName} ${c.lastName}`,
        sublabel: c.phone,
        type: "customer" as const,
      })),
      jobs: jobs.map((j) => ({
        id: j.id,
        label: j.jobNumber,
        sublabel: `${j.customer.firstName} ${j.customer.lastName} - ${j.status}`,
        type: "job" as const,
      })),
      invoices: invoices.map((inv) => ({
        id: inv.id,
        label: inv.invoiceNumber,
        sublabel: `${inv.customer.firstName} ${inv.customer.lastName} - ${inv.status}`,
        type: "invoice" as const,
      })),
      requests: requests.map((r) => ({
        id: r.id,
        label: `${r.firstName} ${r.lastName}`,
        sublabel: `${r.status} - ${r.phone}`,
        type: "request" as const,
      })),
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "Failed to search" },
      { status: 500 }
    );
  }
}
