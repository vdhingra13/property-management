import express from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", requireAuth, async (request, response) => {
  const { name, propertyId, unitLabel } = request.body;

  const property = await prisma.property.findFirst({
    where: { id: propertyId, ownerId: request.user.id }
  });

  if (!property) {
    return response.status(404).json({ message: "Property not found" });
  }

  const unit = await prisma.unit.create({
    data: {
      label: unitLabel,
      status: "occupied",
      rent: 1800,
      beds: 2,
      baths: 1,
      propertyId
    }
  });

  const tenant = await prisma.tenant.create({
    data: {
      name,
      leaseEnd: new Date("2027-03-31"),
      propertyId,
      unitId: unit.id
    }
  });

  await prisma.payment.create({
    data: {
      amount: 1800,
      dueDate: new Date(),
      status: "paid",
      tenantId: tenant.id
    }
  });

  return response.status(201).json({ message: "Tenant created" });
});

export default router;
