import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serviceSchema } from "@/lib/validators";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = serviceSchema.parse(body);

    const existing = await prisma.service.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    const service = await prisma.service.update({
      where: { id },
      data: {
        name: validated.name,
        description: validated.description || null,
        unitPrice: validated.unitPrice,
        unit: validated.unit,
        category: validated.category,
        isActive: validated.isActive ?? existing.isActive,
      },
    });

    return NextResponse.json(service);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to update service:", error);
    return NextResponse.json(
      { error: "Failed to update service" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.service.findUnique({
      where: { id },
      include: {
        quoteLineItems: { select: { id: true }, take: 1 },
        jobLineItems: { select: { id: true }, take: 1 },
      },
    });

    if (!existing) {
      return NextResponse.json(
        { error: "Service not found" },
        { status: 404 }
      );
    }

    if (existing.quoteLineItems.length > 0 || existing.jobLineItems.length > 0) {
      // Soft-delete: deactivate instead of deleting if in use
      await prisma.service.update({
        where: { id },
        data: { isActive: false },
      });
      return NextResponse.json({ message: "Service deactivated (in use by existing quotes/jobs)" });
    }

    await prisma.service.delete({ where: { id } });

    return NextResponse.json({ message: "Service deleted" });
  } catch (error) {
    console.error("Failed to delete service:", error);
    return NextResponse.json(
      { error: "Failed to delete service" },
      { status: 500 }
    );
  }
}
