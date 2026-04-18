import express from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.post("/", requireAuth, async (request, response) => {
  const { title, propertyId, priority } = request.body;

  const property = await prisma.property.findFirst({
    where: { id: propertyId, ownerId: request.user.id }
  });

  if (!property) {
    return response.status(404).json({ message: "Property not found" });
  }

  const requestRecord = await prisma.maintenanceRequest.create({
    data: {
      title,
      priority: ["low", "medium", "high"].includes(priority) ? priority : "medium",
      status: "Open",
      unit: "To assign",
      propertyId
    }
  });

  return response.status(201).json(requestRecord);
});

export default router;
