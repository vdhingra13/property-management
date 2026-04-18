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
          tenant: {
            include: {
              payments: true,
              property: true
            }
          }
        }
      },
      maintenance: {
        include: {
          property: true
        }
      }
    }
  });

  return response.json(serializeDashboard(properties));
});

export default router;
