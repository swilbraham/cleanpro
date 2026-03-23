import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Clean existing data
  await prisma.payment.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.jobLineItem.deleteMany();
  await prisma.job.deleteMany();
  await prisma.quoteLineItem.deleteMany();
  await prisma.quote.deleteMany();
  await prisma.note.deleteMany();
  await prisma.property.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.service.deleteMany();
  await prisma.session.deleteMany();
  await prisma.account.deleteMany();
  await prisma.user.deleteMany();
  await prisma.sequence.deleteMany();

  // Create admin user
  const hashedPassword = await bcrypt.hash("password123", 12);
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@cleanpro.com",
      hashedPassword,
      role: "ADMIN",
      color: "#1d4ed8",
    },
  });

  const cleaner = await prisma.user.create({
    data: {
      name: "Dave Thompson",
      email: "dave@cleanpro.com",
      hashedPassword,
      role: "CLEANER",
      color: "#16a34a",
    },
  });

  console.log("Created users");

  // Create services
  const services = await Promise.all([
    prisma.service.create({
      data: {
        name: "Carpet Clean - Per Room",
        description: "Professional carpet cleaning per room",
        unitPrice: 35,
        unit: "per room",
        category: "carpet",
      },
    }),
    prisma.service.create({
      data: {
        name: "Stain Treatment",
        description: "Specialist stain removal treatment",
        unitPrice: 15,
        unit: "per stain",
        category: "addon",
      },
    }),
    prisma.service.create({
      data: {
        name: "Sofa Clean - 2 Seater",
        description: "Full clean for a 2-seater sofa",
        unitPrice: 45,
        unit: "per item",
        category: "upholstery",
      },
    }),
    prisma.service.create({
      data: {
        name: "Sofa Clean - 3 Seater",
        description: "Full clean for a 3-seater sofa",
        unitPrice: 55,
        unit: "per item",
        category: "upholstery",
      },
    }),
    prisma.service.create({
      data: {
        name: "Armchair Clean",
        description: "Full clean for an armchair",
        unitPrice: 25,
        unit: "per item",
        category: "upholstery",
      },
    }),
    prisma.service.create({
      data: {
        name: "Mattress Clean - Single",
        description: "Deep clean for a single mattress",
        unitPrice: 30,
        unit: "per item",
        category: "upholstery",
      },
    }),
    prisma.service.create({
      data: {
        name: "Mattress Clean - Double",
        description: "Deep clean for a double mattress",
        unitPrice: 40,
        unit: "per item",
        category: "upholstery",
      },
    }),
    prisma.service.create({
      data: {
        name: "Rug Cleaning",
        description: "Professional rug cleaning",
        unitPrice: 25,
        unit: "per item",
        category: "carpet",
      },
    }),
  ]);

  console.log("Created services");

  // Create customers with UK addresses
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        firstName: "Sarah",
        lastName: "Johnson",
        email: "sarah.johnson@email.com",
        phone: "07700 900123",
        address: "14 Oak Avenue",
        city: "Manchester",
        postcode: "M20 3BW",
        latitude: 53.4084,
        longitude: -2.2234,
        tags: ["regular", "residential"],
      },
    }),
    prisma.customer.create({
      data: {
        firstName: "James",
        lastName: "Williams",
        email: "james.w@email.com",
        phone: "07700 900456",
        address: "27 Park Lane",
        city: "Manchester",
        postcode: "M14 5QA",
        latitude: 53.4484,
        longitude: -2.2108,
        tags: ["residential"],
      },
    }),
    prisma.customer.create({
      data: {
        firstName: "Emma",
        lastName: "Brown",
        email: "emma.brown@email.com",
        phone: "07700 900789",
        address: "8 Church Street",
        city: "Stockport",
        postcode: "SK1 1YG",
        latitude: 53.4106,
        longitude: -2.1575,
        tags: ["regular"],
      },
    }),
    prisma.customer.create({
      data: {
        firstName: "Michael",
        lastName: "Davis",
        email: "m.davis@email.com",
        phone: "07700 900321",
        address: "52 High Street",
        city: "Sale",
        postcode: "M33 7ZF",
        latitude: 53.4242,
        longitude: -2.3219,
        tags: ["commercial"],
      },
    }),
    prisma.customer.create({
      data: {
        firstName: "Lisa",
        lastName: "Wilson",
        email: "lisa.w@email.com",
        phone: "07700 900654",
        address: "3 Maple Drive",
        city: "Didsbury",
        postcode: "M20 6RR",
        latitude: 53.4157,
        longitude: -2.2325,
        tags: ["residential", "high-value"],
      },
    }),
    prisma.customer.create({
      data: {
        firstName: "Robert",
        lastName: "Taylor",
        email: "r.taylor@email.com",
        phone: "07700 900987",
        address: "19 Victoria Road",
        city: "Chorlton",
        postcode: "M21 9BG",
        latitude: 53.4387,
        longitude: -2.2724,
        tags: ["regular", "residential"],
      },
    }),
    prisma.customer.create({
      data: {
        firstName: "Amanda",
        lastName: "Clark",
        email: "a.clark@email.com",
        phone: "07700 900147",
        address: "41 Station Road",
        city: "Altrincham",
        postcode: "WA14 1EP",
        latitude: 53.3879,
        longitude: -2.3485,
        tags: ["commercial"],
      },
    }),
    prisma.customer.create({
      data: {
        firstName: "David",
        lastName: "Moore",
        email: "d.moore@email.com",
        phone: "07700 900258",
        address: "6 Elm Close",
        city: "Stretford",
        postcode: "M32 0AH",
        latitude: 53.4468,
        longitude: -2.3112,
        tags: ["residential"],
      },
    }),
    prisma.customer.create({
      data: {
        firstName: "Jennifer",
        lastName: "White",
        email: "j.white@email.com",
        phone: "07700 900369",
        address: "33 London Road",
        city: "Stockport",
        postcode: "SK7 4AT",
        latitude: 53.3933,
        longitude: -2.1426,
        tags: ["regular", "high-value"],
      },
    }),
    prisma.customer.create({
      data: {
        firstName: "Paul",
        lastName: "Harris",
        email: "p.harris@email.com",
        phone: "07700 900741",
        address: "15 Willow Lane",
        city: "Urmston",
        postcode: "M41 5AQ",
        latitude: 53.4492,
        longitude: -2.3543,
        tags: ["residential"],
      },
    }),
  ]);

  console.log("Created customers");

  // Create properties for some customers
  await Promise.all([
    prisma.property.create({
      data: {
        customerId: customers[0].id,
        address: "14 Oak Avenue",
        city: "Manchester",
        postcode: "M20 3BW",
        latitude: 53.4084,
        longitude: -2.2234,
        propertyType: "house",
        rooms: 4,
        sqFootage: 1200,
        carpetTypes: ["wool", "synthetic"],
        accessNotes: "Ring doorbell. Parking available on drive.",
      },
    }),
    prisma.property.create({
      data: {
        customerId: customers[2].id,
        address: "8 Church Street",
        city: "Stockport",
        postcode: "SK1 1YG",
        latitude: 53.4106,
        longitude: -2.1575,
        propertyType: "flat",
        rooms: 2,
        sqFootage: 650,
        carpetTypes: ["synthetic"],
        accessNotes: "Flat 3B, buzzer entry. No parking on-site.",
      },
    }),
    prisma.property.create({
      data: {
        customerId: customers[4].id,
        address: "3 Maple Drive",
        city: "Didsbury",
        postcode: "M20 6RR",
        latitude: 53.4157,
        longitude: -2.2325,
        propertyType: "house",
        rooms: 6,
        sqFootage: 2400,
        carpetTypes: ["wool", "berber", "synthetic"],
        accessNotes: "Key safe by front door, code 4587.",
      },
    }),
    prisma.property.create({
      data: {
        customerId: customers[6].id,
        address: "41 Station Road",
        city: "Altrincham",
        postcode: "WA14 1EP",
        latitude: 53.3879,
        longitude: -2.3485,
        propertyType: "office",
        rooms: 8,
        sqFootage: 3000,
        carpetTypes: ["synthetic"],
        accessNotes: "Commercial premises. Contact reception on arrival.",
      },
    }),
  ]);

  console.log("Created properties");

  // Initialize sequence counters
  await prisma.sequence.createMany({
    data: [
      { id: "quote", current: 5 },
      { id: "job", current: 3 },
      { id: "invoice", current: 1 },
    ],
  });

  // Create some sample quotes
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const quote1 = await prisma.quote.create({
    data: {
      quoteNumber: "Q-0001",
      customerId: customers[0].id,
      status: "ACCEPTED",
      subtotal: 120,
      taxRate: 20,
      taxAmount: 24,
      total: 144,
      notes: "Full house carpet clean - 4 rooms",
      validUntil: nextWeek,
      lineItems: {
        create: [
          {
            serviceId: services[0].id,
            description: "Carpet Clean - Per Room",
            quantity: 3,
            unitPrice: 35,
            total: 105,
          },
          {
            serviceId: services[1].id,
            description: "Stain Treatment",
            quantity: 1,
            unitPrice: 15,
            total: 15,
          },
        ],
      },
    },
  });

  const quote2 = await prisma.quote.create({
    data: {
      quoteNumber: "Q-0002",
      customerId: customers[1].id,
      status: "DRAFT",
      subtotal: 80,
      taxRate: 20,
      taxAmount: 16,
      total: 96,
      notes: "Living room carpet and sofa",
      validUntil: nextWeek,
      lineItems: {
        create: [
          {
            serviceId: services[0].id,
            description: "Carpet Clean - Per Room",
            quantity: 1,
            unitPrice: 35,
            total: 35,
          },
          {
            serviceId: services[2].id,
            description: "Sofa Clean - 2 Seater",
            quantity: 1,
            unitPrice: 45,
            total: 45,
          },
        ],
      },
    },
  });

  await prisma.quote.create({
    data: {
      quoteNumber: "Q-0003",
      customerId: customers[4].id,
      status: "SENT",
      subtotal: 255,
      taxRate: 20,
      taxAmount: 51,
      total: 306,
      notes: "Full house clean with upholstery",
      validUntil: nextWeek,
      lineItems: {
        create: [
          {
            serviceId: services[0].id,
            description: "Carpet Clean - Per Room",
            quantity: 5,
            unitPrice: 35,
            total: 175,
          },
          {
            serviceId: services[3].id,
            description: "Sofa Clean - 3 Seater",
            quantity: 1,
            unitPrice: 55,
            total: 55,
          },
          {
            serviceId: services[4].id,
            description: "Armchair Clean",
            quantity: 1,
            unitPrice: 25,
            total: 25,
          },
        ],
      },
    },
  });

  await prisma.quote.create({
    data: {
      quoteNumber: "Q-0004",
      customerId: customers[8].id,
      status: "ACCEPTED",
      subtotal: 95,
      taxRate: 20,
      taxAmount: 19,
      total: 114,
      lineItems: {
        create: [
          {
            serviceId: services[0].id,
            description: "Carpet Clean - Per Room",
            quantity: 2,
            unitPrice: 35,
            total: 70,
          },
          {
            serviceId: services[7].id,
            description: "Rug Cleaning",
            quantity: 1,
            unitPrice: 25,
            total: 25,
          },
        ],
      },
    },
  });

  await prisma.quote.create({
    data: {
      quoteNumber: "Q-0005",
      customerId: customers[3].id,
      status: "CONVERTED",
      subtotal: 155,
      taxRate: 20,
      taxAmount: 31,
      total: 186,
      notes: "Office carpet clean",
      lineItems: {
        create: [
          {
            serviceId: services[0].id,
            description: "Carpet Clean - Per Room",
            quantity: 4,
            unitPrice: 35,
            total: 140,
          },
          {
            serviceId: services[1].id,
            description: "Stain Treatment",
            quantity: 1,
            unitPrice: 15,
            total: 15,
          },
        ],
      },
    },
  });

  console.log("Created quotes");

  // Create jobs (some for today, some for this week)
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const job1 = await prisma.job.create({
    data: {
      jobNumber: "J-0001",
      customerId: customers[0].id,
      quoteId: quote1.id,
      assignedToId: admin.id,
      status: "SCHEDULED",
      scheduledDate: today,
      scheduledTime: "09:00",
      duration: 90,
      notes: "4 room carpet clean with stain treatment",
      lineItems: {
        create: [
          {
            serviceId: services[0].id,
            description: "Carpet Clean - Per Room",
            quantity: 3,
            unitPrice: 35,
            total: 105,
          },
          {
            serviceId: services[1].id,
            description: "Stain Treatment",
            quantity: 1,
            unitPrice: 15,
            total: 15,
          },
        ],
      },
    },
  });

  const job2 = await prisma.job.create({
    data: {
      jobNumber: "J-0002",
      customerId: customers[5].id,
      assignedToId: cleaner.id,
      status: "SCHEDULED",
      scheduledDate: today,
      scheduledTime: "11:00",
      duration: 60,
      notes: "2 room clean plus rug",
      lineItems: {
        create: [
          {
            serviceId: services[0].id,
            description: "Carpet Clean - Per Room",
            quantity: 2,
            unitPrice: 35,
            total: 70,
          },
          {
            serviceId: services[7].id,
            description: "Rug Cleaning",
            quantity: 1,
            unitPrice: 25,
            total: 25,
          },
        ],
      },
    },
  });

  await prisma.job.create({
    data: {
      jobNumber: "J-0003",
      customerId: customers[2].id,
      assignedToId: admin.id,
      status: "SCHEDULED",
      scheduledDate: today,
      scheduledTime: "14:00",
      duration: 45,
      notes: "Living room carpet and sofa",
      lineItems: {
        create: [
          {
            serviceId: services[0].id,
            description: "Carpet Clean - Per Room",
            quantity: 1,
            unitPrice: 35,
            total: 35,
          },
          {
            serviceId: services[2].id,
            description: "Sofa Clean - 2 Seater",
            quantity: 1,
            unitPrice: 45,
            total: 45,
          },
        ],
      },
    },
  });

  // A completed job from yesterday
  const completedJob = await prisma.job.create({
    data: {
      jobNumber: "J-0004",
      customerId: customers[7].id,
      assignedToId: cleaner.id,
      status: "INVOICED",
      scheduledDate: yesterday,
      scheduledTime: "10:00",
      duration: 60,
      lineItems: {
        create: [
          {
            serviceId: services[0].id,
            description: "Carpet Clean - Per Room",
            quantity: 2,
            unitPrice: 35,
            total: 70,
          },
        ],
      },
    },
  });

  // Create an invoice for the completed job
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNumber: "INV-0001",
      jobId: completedJob.id,
      customerId: customers[7].id,
      status: "PAID",
      subtotal: 70,
      taxRate: 20,
      taxAmount: 14,
      total: 84,
      amountPaid: 84,
      dueDate: new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000),
      paidAt: yesterday,
    },
  });

  // Create a payment for the invoice
  await prisma.payment.create({
    data: {
      invoiceId: invoice.id,
      amount: 84,
      method: "CARD",
      status: "SUCCEEDED",
      stripePaymentId: "pi_test_sample_001",
    },
  });

  // Add some notes
  await prisma.note.createMany({
    data: [
      {
        customerId: customers[0].id,
        authorId: admin.id,
        content: "Preferred appointment time: mornings before noon",
      },
      {
        customerId: customers[4].id,
        authorId: admin.id,
        content: "Has a large golden retriever. Will put dog in garden during clean.",
      },
      {
        customerId: customers[6].id,
        authorId: admin.id,
        content: "Commercial account - invoiced monthly. Contact accounts@company.com for payment.",
      },
    ],
  });

  console.log("Created jobs, invoices, payments, and notes");
  console.log("\nSeed complete!");
  console.log("Login: admin@cleanpro.com / password123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
