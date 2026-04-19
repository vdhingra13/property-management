import fs from "fs";
import multer from "multer";
import express from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { resolveStoredFilePath, persistUploadedFile } from "../services/storage/index.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } });

async function findDocumentEntity(entityType, entityId, ownerId) {
  if (entityType === "tenant") {
    const tenant = await prisma.tenant.findFirst({
      where: { id: entityId, property: { ownerId } },
      include: { property: true }
    });

    if (!tenant) return null;
    return { tenantId: tenant.id, leaseId: null, label: tenant.name };
  }

  if (entityType === "lease") {
    const lease = await prisma.lease.findFirst({
      where: { id: entityId, property: { ownerId } },
      include: { tenant: true, property: true, unit: true }
    });

    if (!lease) return null;
    return {
      tenantId: null,
      leaseId: lease.id,
      label: `${lease.tenant.name} - ${lease.property.name} ${lease.unit.label}`
    };
  }

  return null;
}

router.get("/", requireAuth, async (request, response) => {
  const { entityType, entityId } = request.query;
  const where = {};

  if (entityType && entityId) {
    const entity = await findDocumentEntity(entityType, entityId, request.user.id);

    if (!entity) {
      return response.status(404).json({ message: "Document entity not found" });
    }

    if (entityType === "tenant") where.tenantId = entity.tenantId;
    if (entityType === "lease") where.leaseId = entity.leaseId;
  } else {
    where.OR = [
      { tenant: { property: { ownerId: request.user.id } } },
      { lease: { property: { ownerId: request.user.id } } }
    ];
  }

  const documents = await prisma.document.findMany({
    where,
    include: {
      tenant: true,
      lease: {
        include: {
          property: true,
          unit: true,
          tenant: true
        }
      }
    },
    orderBy: { createdAt: "desc" }
  });

  return response.json({ documents });
});

router.post("/", requireAuth, upload.single("file"), async (request, response) => {
  const { entityType, entityId, title, documentType } = request.body;

  if (!request.file) {
    return response.status(400).json({ message: "A file is required" });
  }

  const entity = await findDocumentEntity(entityType, entityId, request.user.id);
  if (!entity) {
    return response.status(404).json({ message: "Document entity not found" });
  }

  const storage = await persistUploadedFile(request.file, `${entityType}-${entityId}`);

  const document = await prisma.document.create({
    data: {
      title: String(title || request.file.originalname).trim(),
      documentType:
        [
          "government_id_front",
          "government_id_back",
          "police_verification",
          "address_proof",
          "lease_signed",
          "lease_addendum",
          "move_in_checklist",
          "deposit_receipt",
          "other"
        ].includes(documentType)
          ? documentType
          : "other",
      fileName: request.file.originalname,
      mimeType: request.file.mimetype,
      fileSize: request.file.size,
      storageProvider: storage.storageProvider,
      storageKey: storage.storageKey,
      storageBucket: storage.storageBucket,
      tenantId: entity.tenantId,
      leaseId: entity.leaseId,
      uploadedById: request.user.id
    }
  });

  return response.status(201).json({ document });
});

router.get("/:id/download", requireAuth, async (request, response) => {
  const document = await prisma.document.findFirst({
    where: {
      id: request.params.id,
      OR: [
        { tenant: { property: { ownerId: request.user.id } } },
        { lease: { property: { ownerId: request.user.id } } }
      ]
    }
  });

  if (!document) {
    return response.status(404).json({ message: "Document not found" });
  }

  const filePath = resolveStoredFilePath(document);
  if (!fs.existsSync(filePath)) {
    return response.status(404).json({ message: "Stored file not found" });
  }

  return response.download(filePath, document.fileName);
});

export default router;
