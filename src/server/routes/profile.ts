import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { db } from '../db/client';
import { users, userSettings } from '@shared/schema';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export const profileRouter = Router();
profileRouter.use(requireAuth);

// GET /profile -> basic info + settings
profileRouter.get('/profile', asyncHandler(async (req, res) => {
  const { userId } = (req as any).session as { userId: number };
  const [u] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  const [s] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  if (!u) return res.status(404).json({ error: 'User not found' });
  res.json({
    id: u.id,
    email: u.email,
    role: u.role,
    schoolId: u.schoolId,
    displayName: u.displayName ?? null,
    settings: s ?? null
  });
}));

// PUT /profile { displayName?, theme?, defaultPassType? }
profileRouter.put('/profile', asyncHandler(async (req, res) => {
  const { userId } = (req as any).session as { userId: number };
  const { displayName, theme, defaultPassType } = req.body ?? {};

  if (displayName !== undefined) {
    await db.update(users).set({ displayName: String(displayName) }).where(eq(users.id, userId));
  }

  if (theme !== undefined || defaultPassType !== undefined) {
    // upsert settings row
    const updateData: any = {};
    if (theme !== undefined) updateData.theme = String(theme);
    if (defaultPassType !== undefined) updateData.defaultPassType = String(defaultPassType);

    await db.insert(userSettings).values({
      userId,
      ...updateData
    }).onConflictDoUpdate({
      target: userSettings.userId,
      set: updateData
    });
  }

  res.json({ ok: true });
}));

// PUT /profile/password { currentPassword, newPassword }
profileRouter.put('/profile/password', asyncHandler(async (req, res) => {
  const { userId } = (req as any).session as { userId: number };
  const { currentPassword, newPassword } = req.body ?? {};
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'Missing currentPassword/newPassword' });

  const [u] = await db.select({ id: users.id, passwordHash: users.passwordHash }).from(users).where(eq(users.id, userId)).limit(1);
  if (!u) return res.status(404).json({ error: 'User not found' });

  const ok = await bcrypt.compare(String(currentPassword), u.passwordHash);
  if (!ok) return res.status(400).json({ error: 'Current password incorrect' });

  const newHash = await bcrypt.hash(String(newPassword), 10);
  await db.update(users).set({ passwordHash: newHash }).where(eq(users.id, userId));
  res.json({ ok: true });
}));