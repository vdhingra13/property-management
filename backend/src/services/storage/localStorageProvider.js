import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { env } from "../../config/env.js";

function sanitizeSegment(value) {
  return String(value || "file")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80) || "file";
}

export async function saveLocalFile(file, scope) {
  const extension = path.extname(file.originalname || "");
  const directory = path.resolve(process.cwd(), env.localUploadDir, sanitizeSegment(scope));
  const objectName = `${randomUUID()}-${sanitizeSegment(path.basename(file.originalname, extension))}${extension}`;
  const absolutePath = path.join(directory, objectName);

  await fs.mkdir(directory, { recursive: true });
  await fs.writeFile(absolutePath, file.buffer);

  return {
    storageProvider: "local",
    storageKey: path.join(sanitizeSegment(scope), objectName).replace(/\\/g, "/"),
    storageBucket: env.localUploadDir
  };
}

export function getLocalFilePath(storageKey) {
  return path.resolve(process.cwd(), env.localUploadDir, storageKey);
}
