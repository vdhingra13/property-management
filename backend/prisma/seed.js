import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function createPropertyWithUnits(userId, property) {
  return prisma.property.create({
    data: {
      ownerId: userId,
      code: property.code,
      name: property.name,
      address: property.addressLine1,
      addressLine1: property.addressLine1,
      addressLine2: property.addressLine2 || null,
      city: property.city,
      state: property.state,
      postalCode: property.postalCode,
      country: property.country,
      propertyType: property.propertyType,
      ownershipName: property.ownershipName,
      notes: property.notes,
      units: {
        create: property.units
      }
    },
    include: {
      units: true
    }
  });
}

async function main() {
  await prisma.document.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.lease.deleteMany();
  await prisma.tenant.deleteMany();
  await prisma.maintenanceRequest.deleteMany();
  await prisma.unit.deleteMany();
  await prisma.property.deleteMany();
  await prisma.user.deleteMany();

  const user = await prisma.user.create({
    data: {
      name: "Portfolio Owner",
      email: "owner@harborpm.com",
      passwordHash: await bcrypt.hash("password123", 10)
    }
  });

  const properties = await Promise.all([
    createPropertyWithUnits(user.id, {
      code: "NHR",
      name: "North Harbor Residences",
      addressLine1: "15 Riverfront Ave",
      city: "Chicago",
      state: "IL",
      postalCode: "60601",
      country: "USA",
      propertyType: "Apartment",
      ownershipName: "Harbor Residential LLC",
      notes: "Flagship waterfront building.",
      units: [
        { label: "1A", status: "occupied", rent: 2100, beds: 2, baths: 2, floor: "1", squareFeet: 980, marketRent: 2200, securityDepositTarget: 2100 },
        { label: "2C", status: "occupied", rent: 1950, beds: 2, baths: 1, floor: "2", squareFeet: 910, marketRent: 2050, securityDepositTarget: 1950 },
        { label: "3B", status: "notice", rent: 2200, beds: 2, baths: 2, floor: "3", squareFeet: 1010, marketRent: 2250, securityDepositTarget: 2200 },
        { label: "4D", status: "vacant", rent: 2050, beds: 1, baths: 1, floor: "4", squareFeet: 790, marketRent: 2100, securityDepositTarget: 2050, availableFrom: new Date("2026-05-01") }
      ]
    }),
    createPropertyWithUnits(user.id, {
      code: "MAP",
      name: "Maple Court",
      addressLine1: "2908 Wabash Street",
      city: "Indianapolis",
      state: "IN",
      postalCode: "46204",
      country: "USA",
      propertyType: "Multifamily",
      ownershipName: "Midwest Living Partners",
      notes: "Stable workforce housing asset.",
      units: [
        { label: "101", status: "occupied", rent: 1450, beds: 1, baths: 1, floor: "1", squareFeet: 690, marketRent: 1500, securityDepositTarget: 1450 },
        { label: "102", status: "occupied", rent: 1475, beds: 1, baths: 1, floor: "1", squareFeet: 700, marketRent: 1525, securityDepositTarget: 1475 },
        { label: "201", status: "occupied", rent: 1525, beds: 2, baths: 1, floor: "2", squareFeet: 840, marketRent: 1580, securityDepositTarget: 1525 },
        { label: "202", status: "occupied", rent: 1550, beds: 2, baths: 2, floor: "2", squareFeet: 890, marketRent: 1625, securityDepositTarget: 1550 }
      ]
    }),
    createPropertyWithUnits(user.id, {
      code: "SHL",
      name: "Sage Hill Lofts",
      addressLine1: "87 Oakline Blvd",
      city: "Austin",
      state: "TX",
      postalCode: "78701",
      country: "USA",
      propertyType: "Loft",
      ownershipName: "Oakline Holdings",
      notes: "High-rent urban loft product.",
      units: [
        { label: "5A", status: "occupied", rent: 2650, beds: 2, baths: 2, floor: "5", squareFeet: 1120, marketRent: 2700, securityDepositTarget: 2650 },
        { label: "5B", status: "occupied", rent: 2590, beds: 2, baths: 2, floor: "5", squareFeet: 1090, marketRent: 2640, securityDepositTarget: 2590 },
        { label: "6A", status: "vacant", rent: 3100, beds: 3, baths: 2, floor: "6", squareFeet: 1320, marketRent: 3150, securityDepositTarget: 3100, availableFrom: new Date("2026-04-25") },
        { label: "6B", status: "vacant", rent: 3050, beds: 3, baths: 2, floor: "6", squareFeet: 1280, marketRent: 3125, securityDepositTarget: 3050, availableFrom: new Date("2026-05-15") }
      ]
    })
  ]);

  const units = properties.flatMap((property) =>
    property.units.map((unit) => ({
      ...unit,
      propertyId: property.id,
      propertyName: property.name
    }))
  );

  const tenantFixtures = [
    {
      name: "Lena Morales",
      preferredName: "Lena",
      email: "lena.morales@example.com",
      phone: "312-555-0101",
      governmentIdType: "Driver License",
      governmentIdNumber: "IL-MOR-2041",
      policeVerificationStatus: "verified",
      unitLabel: "1A",
      leaseStart: "2025-12-01",
      leaseEnd: "2026-11-30",
      monthlyRent: 2100,
      securityDeposit: 2100
    },
    {
      name: "Jordan Lee",
      preferredName: "Jordan",
      email: "jordan.lee@example.com",
      phone: "312-555-0102",
      governmentIdType: "Passport",
      governmentIdNumber: "P-774002",
      policeVerificationStatus: "pending",
      unitLabel: "2C",
      leaseStart: "2025-09-01",
      leaseEnd: "2026-08-15",
      monthlyRent: 1950,
      securityDeposit: 1950
    },
    {
      name: "Mina Patel",
      preferredName: "Mina",
      email: "mina.patel@example.com",
      phone: "312-555-0103",
      governmentIdType: "State ID",
      governmentIdNumber: "IL-PAT-7712",
      policeVerificationStatus: "verified",
      unitLabel: "3B",
      leaseStart: "2025-06-01",
      leaseEnd: "2026-05-31",
      monthlyRent: 2200,
      securityDeposit: 2200
    },
    {
      name: "Theo Grant",
      preferredName: "Theo",
      email: "theo.grant@example.com",
      phone: "317-555-0141",
      governmentIdType: "Driver License",
      governmentIdNumber: "IN-GRA-1422",
      policeVerificationStatus: "verified",
      unitLabel: "101",
      leaseStart: "2026-02-01",
      leaseEnd: "2027-01-31",
      monthlyRent: 1450,
      securityDeposit: 1450
    },
    {
      name: "Maya Ross",
      preferredName: "Maya",
      email: "maya.ross@example.com",
      phone: "317-555-0142",
      governmentIdType: "Passport",
      governmentIdNumber: "P-903512",
      policeVerificationStatus: "verified",
      unitLabel: "102",
      leaseStart: "2026-01-01",
      leaseEnd: "2026-12-31",
      monthlyRent: 1475,
      securityDeposit: 1475
    },
    {
      name: "Chris Vaughn",
      preferredName: "Chris",
      email: "chris.vaughn@example.com",
      phone: "317-555-0143",
      governmentIdType: "Driver License",
      governmentIdNumber: "IN-VAU-2321",
      policeVerificationStatus: "verified",
      unitLabel: "201",
      leaseStart: "2025-10-01",
      leaseEnd: "2026-09-30",
      monthlyRent: 1525,
      securityDeposit: 1525
    },
    {
      name: "Amara Cole",
      preferredName: "Amara",
      email: "amara.cole@example.com",
      phone: "317-555-0144",
      governmentIdType: "Passport",
      governmentIdNumber: "P-883001",
      policeVerificationStatus: "pending",
      unitLabel: "202",
      leaseStart: "2025-11-01",
      leaseEnd: "2026-10-15",
      monthlyRent: 1550,
      securityDeposit: 1550
    },
    {
      name: "Diego Alvarez",
      preferredName: "Diego",
      email: "diego.alvarez@example.com",
      phone: "512-555-0191",
      governmentIdType: "Driver License",
      governmentIdNumber: "TX-ALV-8801",
      policeVerificationStatus: "verified",
      unitLabel: "5A",
      leaseStart: "2025-08-01",
      leaseEnd: "2026-07-31",
      monthlyRent: 2650,
      securityDeposit: 2650
    },
    {
      name: "Sofia Bennett",
      preferredName: "Sofia",
      email: "sofia.bennett@example.com",
      phone: "512-555-0192",
      governmentIdType: "State ID",
      governmentIdNumber: "TX-BEN-6621",
      policeVerificationStatus: "verified",
      unitLabel: "5B",
      leaseStart: "2025-07-01",
      leaseEnd: "2026-06-30",
      monthlyRent: 2590,
      securityDeposit: 2590
    }
  ];

  for (const fixture of tenantFixtures) {
    const unit = units.find((item) => item.label === fixture.unitLabel);

    const tenant = await prisma.tenant.create({
      data: {
        name: fixture.name,
        preferredName: fixture.preferredName,
        email: fixture.email,
        phone: fixture.phone,
        governmentIdType: fixture.governmentIdType,
        governmentIdNumber: fixture.governmentIdNumber,
        policeVerificationStatus: fixture.policeVerificationStatus,
        leaseEnd: new Date(fixture.leaseEnd),
        balance: 0,
        propertyId: unit.propertyId,
        unitId: unit.id
      }
    });

    const lease = await prisma.lease.create({
      data: {
        propertyId: unit.propertyId,
        unitId: unit.id,
        tenantId: tenant.id,
        status: fixture.unitLabel === "3B" ? "pending" : "active",
        startDate: new Date(fixture.leaseStart),
        endDate: new Date(fixture.leaseEnd),
        moveInDate: new Date(fixture.leaseStart),
        monthlyRent: fixture.monthlyRent,
        securityDeposit: fixture.securityDeposit,
        depositReceivedDate: new Date(fixture.leaseStart),
        rentDueDay: 1,
        lateFeeType: "flat",
        lateFeeAmount: 75,
        billingFrequency: "monthly",
        renewalStatus: "fixed_term",
        noticePeriodDays: 30,
        utilityResponsibility: "Electric in tenant name; water billed back",
        notes: "Seed lease for pilot workspace."
      }
    });

    await prisma.payment.create({
      data: {
        amount: fixture.monthlyRent,
        amountDue: fixture.monthlyRent,
        amountPaid: fixture.monthlyRent,
        dueDate: new Date("2026-04-01"),
        paidDate: new Date("2026-04-02"),
        paymentMethod: "ACH",
        referenceNumber: `APR-${unit.label}`,
        status: fixture.unitLabel === "202" ? "overdue" : fixture.unitLabel === "2C" ? "partial" : "paid",
        tenantId: tenant.id,
        leaseId: lease.id
      }
    });
  }

}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
