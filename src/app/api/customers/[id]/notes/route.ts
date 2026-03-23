import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const noteSchema = z.object({
  content: z.string().min(1, "Note content is required"),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { content } = noteSchema.parse(body);

    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) {
      return NextResponse.json(
        { error: "Customer not found" },
        { status: 404 }
      );
    }

    // Get the first admin user as the note author
    // In a real app, this would come from the authenticated session
    const author = await prisma.user.findFirst({
      where: { role: "ADMIN" },
    });

    if (!author) {
      return NextResponse.json(
        { error: "No author found" },
        { status: 500 }
      );
    }

    const note = await prisma.note.create({
      data: {
        customerId: id,
        authorId: author.id,
        content,
      },
      include: {
        author: { select: { name: true } },
      },
    });

    return NextResponse.json(note, { status: 201 });
  } catch (error: any) {
    if (error.name === "ZodError") {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    console.error("Failed to create note:", error);
    return NextResponse.json(
      { error: "Failed to create note" },
      { status: 500 }
    );
  }
}
