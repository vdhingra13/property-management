import { app } from "./app.js";
import { prisma } from "./db/prisma.js";
import { env } from "./config/env.js";

async function start() {
  try {
    await prisma.$connect();
    app.listen(env.port, "0.0.0.0", () => {
      console.log(`Harbor PM API listening on port ${env.port}`);
    });
  } catch (error) {
    console.error("Failed to start API", error);
    process.exit(1);
  }
}

start();
