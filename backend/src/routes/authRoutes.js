import bcrypt from "bcryptjs";
import express from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth } from "../middleware/auth.js";
import { signToken } from "../utils/token.js";

const router = express.Router();

router.post("/register", async (request, response) => {
  const { name, email, password } = request.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    return response.status(409).json({ message: "Email already in use" });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { name, email, passwordHash }
  });

  const token = signToken(user);
  return response.status(201).json({
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

router.post("/login", async (request, response) => {
  const { email, password } = request.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    return response.status(401).json({ message: "Invalid email or password" });
  }

  const passwordMatches = await bcrypt.compare(password, user.passwordHash);
  if (!passwordMatches) {
    return response.status(401).json({ message: "Invalid email or password" });
  }

  const token = signToken(user);
  return response.json({
    token,
    user: { id: user.id, name: user.name, email: user.email }
  });
});

router.get("/me", requireAuth, async (request, response) => {
  return response.json({
    user: {
      id: request.user.id,
      name: request.user.name,
      email: request.user.email
    }
  });
});

export default router;
