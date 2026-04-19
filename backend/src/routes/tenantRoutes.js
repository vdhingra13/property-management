import express from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

function normalizeText(value) {
  return value ? String(value).trim() : null;
}

router.get("/", requireAuth, async (request, response) => {
  const tenants = await prisma.tenant.findMany({
    where: {
      property: {
        ownerId: request.user.id
      }
    },
    include: {
      property: true,
      unit: true,
      leases: {
        orderBy: { createdAt: "desc" }
      },
      documents: {
        orderBy: { createdAt: "desc" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return response.json({ tenants });
});

router.post("/", requireAuth, async (request, response) => {
  const {
    propertyId,
    unitId,
    name,
    preferredName,
    email,
    phone,
    alternatePhone,
    dateOfBirth,
    governmentIdType,
    governmentIdNumber,
    governmentIdExpiry,
    policeVerificationStatus,
    policeVerificationDate,
    emergencyContactName,
    emergencyContactPhone,
    permanentAddress,
    notes,
    leaseEnd,
    balance
  } = request.body;

  if (!propertyId || !unitId || !name) {
    return response.status(400).json({ message: "Property, unit, and tenant name are required" });
  }

  const unit = await prisma.unit.findFirst({
    where: {
      id: unitId,
      propertyId,
      property: {
        ownerId: request.user.id
      }
    },
    include: {
      tenant: true
    }
  });

  if (!unit) {
    return response.status(404).json({ message: "Unit not found" });
  }

  if (unit.tenant) {
    return response.status(409).json({ message: "This unit already has a tenant assigned" });
  }

  const tenant = await prisma.tenant.create({
    data: {
      propertyId,
      unitId,
      name: String(name).trim(),
      preferredName: normalizeText(preferredName),
      email: normalizeText(email),
      phone: normalizeText(phone),
      alternatePhone: normalizeText(alternatePhone),
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
      governmentIdType: normalizeText(governmentIdType),
      governmentIdNumber: normalizeText(governmentIdNumber),
      governmentIdExpiry: governmentIdExpiry ? new Date(governmentIdExpiry) : null,
      policeVerificationStatus:
        ["pending", "verified", "failed", "waived"].includes(policeVerificationStatus)
          ? policeVerificationStatus
          : "pending",
      policeVerificationDate: policeVerificationDate ? new Date(policeVerificationDate) : null,
      emergencyContactName: normalizeText(emergencyContactName),
      emergencyContactPhone: normalizeText(emergencyContactPhone),
      permanentAddress: normalizeText(permanentAddress),
      notes: normalizeText(notes),
      leaseEnd: leaseEnd ? new Date(leaseEnd) : new Date(),
      balance: balance ? Number(balance) : 0
    }
  });

  await prisma.unit.update({
    where: { id: unit.id },
    data: {
      status: "occupied"
    }
  });

  return response.status(201).json({ tenant });
});

router.put("/:id", requireAuth, async (request, response) => {
  const existing = await prisma.tenant.findFirst({
    where: {
      id: request.params.id,
      property: { ownerId: request.user.id }
    }
  });

  if (!existing) {
    return response.status(404).json({ message: "Tenant not found" });
  }

  const tenant = await prisma.tenant.update({
    where: { id: existing.id },
    data: {
      name: request.body.name ? String(request.body.name).trim() : existing.name,
      preferredName: normalizeText(request.body.preferredName),
      email: normalizeText(request.body.email),
      phone: normalizeText(request.body.phone),
      alternatePhone: normalizeText(request.body.alternatePhone),
      dateOfBirth: request.body.dateOfBirth ? new Date(request.body.dateOfBirth) : null,
      governmentIdType: normalizeText(request.body.governmentIdType),
      governmentIdNumber: normalizeText(request.body.governmentIdNumber),
      governmentIdExpiry: request.body.governmentIdExpiry ? new Date(request.body.governmentIdExpiry) : null,
      policeVerificationStatus:
        ["pending", "verified", "failed", "waived"].includes(request.body.policeVerificationStatus)
          ? request.body.policeVerificationStatus
          : existing.policeVerificationStatus,
      policeVerificationDate: request.body.policeVerificationDate ? new Date(request.body.policeVerificationDate) : null,
      emergencyContactName: normalizeText(request.body.emergencyContactName),
      emergencyContactPhone: normalizeText(request.body.emergencyContactPhone),
      permanentAddress: normalizeText(request.body.permanentAddress),
      notes: normalizeText(request.body.notes),
      leaseEnd: request.body.leaseEnd ? new Date(request.body.leaseEnd) : existing.leaseEnd,
      balance: request.body.balance != null ? Number(request.body.balance) : existing.balance
    }
  });

  return response.json({ tenant });
});

export default router;
