import express from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

function normalizeText(value) {
  return value ? String(value).trim() : null;
}

router.get("/", requireAuth, async (request, response) => {
  const leases = await prisma.lease.findMany({
    where: {
      property: {
        ownerId: request.user.id
      }
    },
    include: {
      property: true,
      unit: true,
      tenant: true,
      documents: {
        orderBy: { createdAt: "desc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return response.json({ leases });
});

router.post("/", requireAuth, async (request, response) => {
  const {
    propertyId,
    unitId,
    tenantId,
    status,
    startDate,
    endDate,
    moveInDate,
    monthlyRent,
    securityDeposit,
    depositReceivedDate,
    rentDueDay,
    lateFeeType,
    lateFeeAmount,
    billingFrequency,
    renewalStatus,
    noticePeriodDays,
    petTerms,
    parkingTerms,
    utilityResponsibility,
    notes
  } = request.body;

  if (!propertyId || !unitId || !tenantId || !startDate || !endDate) {
    return response.status(400).json({ message: "Property, unit, tenant, start date, and end date are required" });
  }

  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      propertyId,
      property: {
        ownerId: request.user.id
      }
    }
  });

  const tenant = await prisma.tenant.findFirst({
    where: {
      id: tenantId,
      propertyId,
      property: {
        ownerId: request.user.id
      }
    }
  });

  if (!unit || !tenant) {
    return response.status(404).json({ message: "Unit or tenant not found" });
  }

  const lease = await prisma.lease.create({
    data: {
      propertyId,
      unitId,
      tenantId,
      status: ["active", "pending", "expired", "terminated"].includes(status) ? status : "active",
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      moveInDate: moveInDate ? new Date(moveInDate) : null,
      monthlyRent: Number(monthlyRent || unit.rent || 0),
      securityDeposit: Number(securityDeposit || unit.securityDepositTarget || 0),
      depositReceivedDate: depositReceivedDate ? new Date(depositReceivedDate) : null,
      rentDueDay: Number(rentDueDay || 1),
      lateFeeType: normalizeText(lateFeeType),
      lateFeeAmount: lateFeeAmount ? Number(lateFeeAmount) : null,
      billingFrequency:
        ["monthly", "quarterly", "annual"].includes(billingFrequency) ? billingFrequency : "monthly",
      renewalStatus:
        ["fixed_term", "month_to_month", "renewal_in_progress"].includes(renewalStatus)
          ? renewalStatus
          : "fixed_term",
      noticePeriodDays: noticePeriodDays ? Number(noticePeriodDays) : null,
      petTerms: normalizeText(petTerms),
      parkingTerms: normalizeText(parkingTerms),
      utilityResponsibility: normalizeText(utilityResponsibility),
      notes: normalizeText(notes)
    }
  });

  await prisma.unit.update({
    where: { id: unit.id },
    data: {
      rent: Number(monthlyRent || unit.rent || 0),
      status: status === "pending" ? "notice" : "occupied",
      availableFrom: null
    }
  });

  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      leaseEnd: new Date(endDate)
    }
  });

  return response.status(201).json({ lease });
});

export default router;
