import bcrypt from "bcryptjs";
import { prisma } from "./db/prisma.js";

async function bootstrapDemoData() {
  const existingUsers = await prisma.user.count();
  if (existingUsers > 0) {
    console.log("Bootstrap skipped: database already contains users.");
    return;
  }

  const user = await prisma.user.create({
    data: {
      name: "Portfolio Owner",
      email: "owner@harborpm.com",
      passwordHash: await bcrypt.hash("password123", 10),
      properties: {
        create: [
          {
            name: "North Harbor Residences",
            address: "15 Riverfront Ave",
            city: "Chicago, IL",
            units: {
              create: [
                { label: "1A", status: "occupied", rent: 2100, beds: 2, baths: 2 },
                { label: "2C", status: "occupied", rent: 1950, beds: 2, baths: 1 },
                { label: "3B", status: "notice", rent: 2200, beds: 2, baths: 2 },
                { label: "4D", status: "vacant", rent: 2050, beds: 1, baths: 1 }
              ]
            },
            maintenance: {
              create: [
                { title: "Lobby intercom offline", priority: "high", status: "Open", unit: "Common Area" },
                { title: "Dishwasher leak", priority: "medium", status: "Awaiting vendor", unit: "2C" }
              ]
            }
          },
          {
            name: "Maple Court",
            address: "2908 Wabash Street",
            city: "Indianapolis, IN",
            units: {
              create: [
                { label: "101", status: "occupied", rent: 1450, beds: 1, baths: 1 },
                { label: "102", status: "occupied", rent: 1475, beds: 1, baths: 1 },
                { label: "201", status: "occupied", rent: 1525, beds: 2, baths: 1 },
                { label: "202", status: "occupied", rent: 1550, beds: 2, baths: 2 }
              ]
            },
            maintenance: {
              create: [{ title: "Hallway paint touch-up", priority: "low", status: "Scheduled", unit: "2nd Floor" }]
            }
          },
          {
            name: "Sage Hill Lofts",
            address: "87 Oakline Blvd",
            city: "Austin, TX",
            units: {
              create: [
                { label: "5A", status: "occupied", rent: 2650, beds: 2, baths: 2 },
                { label: "5B", status: "occupied", rent: 2590, beds: 2, baths: 2 },
                { label: "6A", status: "vacant", rent: 3100, beds: 3, baths: 2 },
                { label: "6B", status: "vacant", rent: 3050, beds: 3, baths: 2 }
              ]
            },
            maintenance: {
              create: [{ title: "HVAC inspection", priority: "high", status: "Open", unit: "6B" }]
            }
          }
        ]
      }
    },
    include: {
      properties: {
        include: {
          units: true
        }
      }
    }
  });

  const units = user.properties.flatMap((property) =>
    property.units.map((unit) => ({ ...unit, propertyId: property.id }))
  );

  const tenantFixtures = [
    ["Lena Morales", "1A", "2026-11-30", 0, 2100, "paid"],
    ["Jordan Lee", "2C", "2026-08-15", 420, 1530, "partial"],
    ["Mina Patel", "3B", "2026-05-31", 0, 2200, "paid"],
    ["Theo Grant", "101", "2027-01-31", 0, 1450, "paid"],
    ["Maya Ross", "102", "2026-12-31", 0, 1475, "paid"],
    ["Chris Vaughn", "201", "2026-09-30", 0, 1525, "paid"],
    ["Amara Cole", "202", "2026-10-15", 175, 1375, "overdue"],
    ["Diego Alvarez", "5A", "2026-07-31", 0, 2650, "paid"],
    ["Sofia Bennett", "5B", "2026-06-30", 0, 2590, "paid"]
  ];

  for (const [name, unitLabel, leaseEnd, balance, amount, status] of tenantFixtures) {
    const unit = units.find((item) => item.label === unitLabel);
    if (!unit) {
      continue;
    }

    const tenant = await prisma.tenant.create({
      data: {
        name,
        leaseEnd: new Date(leaseEnd),
        balance,
        propertyId: unit.propertyId,
        unitId: unit.id
      }
    });

    await prisma.payment.create({
      data: {
        amount,
        dueDate: new Date("2026-04-01"),
        status,
        tenantId: tenant.id
      }
    });
  }

  console.log("Bootstrap completed: demo data created.");
}

bootstrapDemoData()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Bootstrap failed", error);
    await prisma.$disconnect();
    process.exit(1);
  });
