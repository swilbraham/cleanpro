import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { propertySchema } from "@/lib/validators";
import { z } from "zod";

const createPropertySchema = propertySchema.extend({
  customerId: z.string().min(1, "Customer ID is required"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const validated = createPropertySchema.parse(body);

    const customer = await prisma.customer.findUnique({
      where: { id: validated.customerId },
    });
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    const property = await prisma.property.create({
      data: {
        customerId: validated.customerId,
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

    return NextResponse.json(property, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to create property:", error);
    return NextResponse.json(
      { error: "Failed to create property" },
      { status: 500 }
    );
  }
}
