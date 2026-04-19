import express from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { serializeDashboard } from "../services/dashboardService.js";

const router = express.Router();

router.get("/", requireAuth, async (request, response) => {
  const properties = await prisma.property.findMany({
    where: { ownerId: request.user.id },
    include: {
      units: {
        include: {
          tenant: true
        },
        orderBy: { label: "asc" }
      },
      leases: true
    }
  });

  const tenants = await prisma.tenant.findMany({
    where: {
      property: {
        ownerId: request.user.id
      }
    },
    include: {
      property: true,
      unit: true,
      documents: true
    },
    orderBy: { createdAt: "desc" }
  });

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
      documents: true
    },
    orderBy: { createdAt: "desc" }
  });

  const documents = await prisma.document.findMany({
    where: {
      OR: [
        { tenant: { property: { ownerId: request.user.id } } },
        { lease: { property: { ownerId: request.user.id } } }
      ]
    },
    include: {
      tenant: true,
      lease: {
        include: {
          property: true,
          tenant: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return response.json(serializeDashboard({ properties, tenants, leases, documents }));
});

export default router;
