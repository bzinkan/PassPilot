import { Router } from "express";
import type { Request, Response } from "express";
import { asyncHandler } from "../middleware/asyncHandler";
import { requireAuth, type AuthenticatedRequest } from "../middleware/auth";
import { db } from "../db/client";
import { users } from "../../../shared/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const profileRouter = Router();

// Get current user profile
profileRouter.get("/me", requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const [user] = await db.select({
    id: users.id,
    email: users.email,
    role: users.role,
    schoolId: users.schoolId,
    active: users.active,
    displayName: users.displayName,
    createdAt: users.createdAt
  }).from(users).where(eq(users.id, userId));

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json({ ok: true, data: user });
}));

// Update user profile (email and display name)
profileRouter.patch("/me", requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { email, displayName } = req.body ?? {};
  if (!email) {
    res.status(400).json({ error: "Email is required" });
    return;
  }

  // Check if email is already taken by another user
  const [existingUser] = await db.select({ id: users.id })
    .from(users)
    .where(eq(users.email, email.toLowerCase()));

  if (existingUser && existingUser.id !== userId) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const [updatedUser] = await db.update(users)
    .set({ 
      email: email.toLowerCase(),
      displayName: displayName || null
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      email: users.email,
      role: users.role,
      schoolId: users.schoolId,
      active: users.active,
      displayName: users.displayName,
      createdAt: users.createdAt
    });

  if (!updatedUser) {
    res.status(500).json({ error: "Failed to update profile" });
    return;
  }

  res.json({ ok: true, data: updatedUser });
}));

// Change password
profileRouter.post("/me/password", requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) {
    res.status(400).json({ error: "Current password and new password are required" });
    return;
  }

  if (newPassword.length < 8) {
    res.status(400).json({ error: "New password must be at least 8 characters long" });
    return;
  }

  // Get current user with password hash
  const [user] = await db.select({
    id: users.id,
    passwordHash: users.passwordHash
  }).from(users).where(eq(users.id, userId));

  if (!user || !user.passwordHash) {
    res.status(404).json({ error: "User not found or no password set" });
    return;
  }

  // Verify current password
  const isCurrentValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!isCurrentValid) {
    res.status(401).json({ error: "Current password is incorrect" });
    return;
  }

  // Hash new password
  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  // Update password
  await db.update(users)
    .set({ 
      passwordHash: newPasswordHash
    })
    .where(eq(users.id, userId));

  res.json({ ok: true, message: "Password updated successfully" });
}));