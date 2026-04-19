import express from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

function normalizeText(value) {
  return value ? String(value).trim() : null;
}

router.get("/", requireAuth, async (request, response) => {
  const properties = await prisma.property.findMany({
    where: { ownerId: request.user.id },
    include: {
      units: {
        orderBy: { label: "asc" }
      },
      leases: {
        where: { status: "active" }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return response.json({ properties });
});

router.post("/", requireAuth, async (request, response) => {
  const {
    code,
    name,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    propertyType,
    ownershipName,
    notes
  } = request.body;

  if (!name || !addressLine1 || !city) {
    return response.status(400).json({ message: "Name, address line 1, and city are required" });
  }

  const property = await prisma.property.create({
    data: {
      code: normalizeText(code),
      name: String(name).trim(),
      address: String(addressLine1).trim(),
      addressLine1: String(addressLine1).trim(),
      addressLine2: normalizeText(addressLine2),
      city: String(city).trim(),
      state: normalizeText(state),
      postalCode: normalizeText(postalCode),
      country: normalizeText(country) || "USA",
      propertyType: normalizeText(propertyType),
      ownershipName: normalizeText(ownershipName),
      notes: normalizeText(notes),
      ownerId: request.user.id
    }
  });

  return response.status(201).json({ property });
});

router.put("/:id", requireAuth, async (request, response) => {
  const existing = await prisma.property.findFirst({
    where: { id: request.params.id, ownerId: request.user.id }
  });

  if (!existing) {
    return response.status(404).json({ message: "Property not found" });
  }

  const {
    code,
    name,
    addressLine1,
    addressLine2,
    city,
    state,
    postalCode,
    country,
    propertyType,
    ownershipName,
    notes
  } = request.body;

  const property = await prisma.property.update({
    where: { id: existing.id },
    data: {
      code: normalizeText(code),
      name: String(name || existing.name).trim(),
      address: String(addressLine1 || existing.addressLine1 || existing.address).trim(),
      addressLine1: String(addressLine1 || existing.addressLine1 || existing.address).trim(),
      addressLine2: normalizeText(addressLine2),
      city: String(city || existing.city).trim(),
      state: normalizeText(state),
      postalCode: normalizeText(postalCode),
      country: normalizeText(country) || existing.country || "USA",
      propertyType: normalizeText(propertyType),
      ownershipName: normalizeText(ownershipName),
      notes: normalizeText(notes)
    }
  });

  return response.json({ property });
});

router.post("/:id/units", requireAuth, async (request, response) => {
  const property = await prisma.property.findFirst({
    where: { id: request.params.id, ownerId: request.user.id }
  });

  if (!property) {
    return response.status(404).json({ message: "Property not found" });
  }

  const {
    label,
    floor,
    beds,
    baths,
    squareFeet,
    marketRent,
    rent,
    securityDepositTarget,
    status,
    availableFrom,
    notes
  } = request.body;

  if (!label) {
    return response.status(400).json({ message: "Unit label is required" });
  }

  const unit = await prisma.unit.create({
    data: {
      label: String(label).trim(),
      floor: normalizeText(floor),
      beds: Number(beds || 0),
      baths: Number(baths || 0),
      squareFeet: squareFeet ? Number(squareFeet) : null,
      marketRent: marketRent ? Number(marketRent) : null,
      rent: Number(rent || 0),
      securityDepositTarget: securityDepositTarget ? Number(securityDepositTarget) : null,
      status: ["occupied", "vacant", "notice"].includes(status) ? status : "vacant",
      availableFrom: availableFrom ? new Date(availableFrom) : null,
      notes: normalizeText(notes),
      propertyId: property.id
    }
  });

  return response.status(201).json({ unit });
});

export default router;
