import { prisma } from "../db/prisma.js";
import { verifyToken } from "../utils/token.js";

export async function requireAuth(request, response, next) {
  const authHeader = request.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return response.status(401).json({ message: "Authentication required" });
  }

  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = verifyToken(token);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });

    if (!user) {
      return response.status(401).json({ message: "Invalid session" });
    }

    request.user = user;
    next();
  } catch {
    return response.status(401).json({ message: "Invalid token" });
  }
}
