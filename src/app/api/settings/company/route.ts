import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const settings = await prisma.companySettings.upsert({
      where: { id: "default" },
      update: {},
      create: {
        id: "default",
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to fetch company settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch company settings" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();

    const {
      companyName,
      address,
      city,
      postcode,
      phone,
      email,
      website,
      vatNumber,
      defaultTaxRate,
      invoicePrefix,
      quotePrefix,
      jobPrefix,
      invoiceTerms,
      quoteTerms,
    } = body;

    const data: any = {};

    if (companyName !== undefined) data.companyName = companyName;
    if (address !== undefined) data.address = address || null;
    if (city !== undefined) data.city = city || null;
    if (postcode !== undefined) data.postcode = postcode || null;
    if (phone !== undefined) data.phone = phone || null;
    if (email !== undefined) data.email = email || null;
    if (website !== undefined) data.website = website || null;
    if (vatNumber !== undefined) data.vatNumber = vatNumber || null;
    if (defaultTaxRate !== undefined)
      data.defaultTaxRate = parseFloat(defaultTaxRate) || 0;
    if (invoicePrefix !== undefined) data.invoicePrefix = invoicePrefix;
    if (quotePrefix !== undefined) data.quotePrefix = quotePrefix;
    if (jobPrefix !== undefined) data.jobPrefix = jobPrefix;
    if (invoiceTerms !== undefined) data.invoiceTerms = invoiceTerms || null;
    if (quoteTerms !== undefined) data.quoteTerms = quoteTerms || null;

    const settings = await prisma.companySettings.upsert({
      where: { id: "default" },
      update: data,
      create: {
        id: "default",
        ...data,
      },
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Failed to update company settings:", error);
    return NextResponse.json(
      { error: "Failed to update company settings" },
      { status: 500 }
    );
  }
}
