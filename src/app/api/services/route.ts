import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { serviceSchema } from "@/lib/validators";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("active") !== "false";

    const where: Record<string, unknown> = {};
    if (activeOnly) where.isActive = true;
    if (category) where.category = category;

    const services = await prisma.service.findMany({
      where,
      orderBy: [{ category: "asc" }, { name: "asc" }],
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Failed to fetch services:", error);
    return NextResponse.json(
      { error: "Failed to fetch services" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = serviceSchema.parse(body);

    const service = await prisma.service.create({
      data: {
        name: validated.name,
        description: validated.description || null,
        unitPrice: validated.unitPrice,
        unit: validated.unit,
        category: validated.category,
        isActive: validated.isActive ?? true,
      },
    });

    return NextResponse.json(service, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to create service:", error);
    return NextResponse.json(
      { error: "Failed to create service" },
      { status: 500 }
    );
  }
}
