import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { LoginBody, RegisterBody } from "@workspace/api-zod";
import crypto from "crypto";

const router: IRouter = Router();

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function generateToken(userId: number, username: string): string {
  return Buffer.from(`${userId}:${username}:${Date.now()}`).toString("base64");
}

router.post("/auth/login", async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password } = parsed.data;
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (!user || user.password !== hashPassword(password)) {
    res.status(401).json({ error: "Invalid credentials", message: "Username or password is incorrect" });
    return;
  }

  const token = generateToken(user.id, user.username);
  res.json({
    user: { id: user.id, username: user.username, role: user.role },
    token,
  });
});

router.post("/auth/register", async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { username, password, role } = parsed.data;

  const [existing] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.username, username));

  if (existing) {
    res.status(400).json({ error: "Username already taken", message: "Please choose a different username" });
    return;
  }

  const [user] = await db
    .insert(usersTable)
    .values({ username, password: hashPassword(password), role: role ?? "USER" })
    .returning();

  const token = generateToken(user.id, user.username);
  res.status(201).json({
    user: { id: user.id, username: user.username, role: user.role },
    token,
  });
});

router.get("/auth/me", async (req, res): Promise<void> => {
  const userIdHeader = req.headers["x-user-id"];
  if (!userIdHeader) {
    res.status(401).json({ error: "Not authenticated" });
    return;
  }

  const userId = parseInt(String(userIdHeader), 10);
  if (isNaN(userId)) {
    res.status(401).json({ error: "Invalid user ID" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({ id: user.id, username: user.username, role: user.role });
});

export default router;
