import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT || 4000),
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET || "development-secret",
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  storageProvider: process.env.STORAGE_PROVIDER || "local",
  localUploadDir: process.env.LOCAL_UPLOAD_DIR || "uploads"
};
