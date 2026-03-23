import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { propertySchema } from "@/lib/validators";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const validated = propertySchema.parse(body);

    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    const property = await prisma.property.update({
      where: { id },
      data: {
        address: validated.address,
        city: validated.city,
        postcode: validated.postcode,
        propertyType: validated.propertyType || null,
        rooms: validated.rooms || null,
        sqFootage: validated.sqFootage || null,
        carpetTypes: validated.carpetTypes || [],
        accessNotes: validated.accessNotes || null,
        latitude: null,
        longitude: null,
      },
    });

    return NextResponse.json(property);
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to update property:", error);
    return NextResponse.json(
      { error: "Failed to update property" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.property.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: "Property not found" },
        { status: 404 }
      );
    }

    await prisma.property.delete({ where: { id } });

    return NextResponse.json({ message: "Property deleted" });
  } catch (error) {
    console.error("Failed to delete property:", error);
    return NextResponse.json(
      { error: "Failed to delete property" },
      { status: 500 }
    );
  }
}
