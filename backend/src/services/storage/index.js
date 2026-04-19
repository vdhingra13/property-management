import { env } from "../../config/env.js";
import { getLocalFilePath, saveLocalFile } from "./localStorageProvider.js";

export async function persistUploadedFile(file, scope) {
  if (env.storageProvider === "gcs") {
    throw new Error("Google Cloud Storage is not configured yet. Switch STORAGE_PROVIDER to local until GCS is set up.");
  }

  return saveLocalFile(file, scope);
}

export function resolveStoredFilePath(document) {
  if (document.storageProvider !== "local") {
    throw new Error("Remote document downloads are not configured yet.");
  }

  return getLocalFilePath(document.storageKey);
}
