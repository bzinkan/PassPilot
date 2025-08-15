import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth, requireRole, type AuthenticatedRequest } from '../middleware/auth';
import { requireTenant } from '../middleware/tenant';
import { db } from '../db/client';
import { users, audits, schools } from '@shared/schema';
import { and, count, eq } from 'drizzle-orm';
import { createInvite } from '../services/registration';
import { createSchool } from '../services/schools';
import { createUser } from '../services/users';
import bcrypt from 'bcryptjs';

export const adminRouter = Router();
adminRouter.use(requireAuth, requireRole('admin'));

// School admin overview - KPI cards and quick actions
adminRouter.get('/overview', asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const { schoolId } = req.session!;
  
  // Get counts for KPI cards
  const [usersCount] = await db.select({ count: count() }).from(users).where(eq(users.schoolId, schoolId));
  const [activePassesCount] = await db.select({ count: count() }).from(audits).where(
    and(eq(audits.schoolId, schoolId), eq(audits.action, 'pass_created'))
  );
  
  res.json({ 
    ok: true, 
    data: {
      totalUsers: usersCount?.count || 0,
      activePasses: activePassesCount?.count || 0,
      schoolId: schoolId
    }
  });
}));

// School settings management
adminRouter.get('/settings', asyncHandler(async (req, res) => {
  const { schoolId } = (req as any).session;
  const [school] = await db.select().from(schools).where(eq(schools.id, schoolId));
  res.json({ ok: true, data: school });
}));

adminRouter.patch('/settings', asyncHandler(async (req, res) => {
  const { schoolId } = (req as any).session;
  const { name, seatsAllowed } = req.body ?? {};
  
  const [school] = await db.update(schools)
    .set({ name, seatsAllowed })
    .where(eq(schools.id, schoolId))
    .returning();
    
  res.json({ ok: true, data: school });
}));

// Original superadmin-only routes for school management
adminRouter.post('/schools', asyncHandler(async (req, res) => {
  const { name, seatsAllowed } = req.body ?? {};
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const s = await createSchool(String(name), seatsAllowed ? Number(seatsAllowed) : 50);
  res.json({ school: s });
}));

adminRouter.post('/users', asyncHandler(async (req, res) => {
  const { email, password, role, schoolId } = req.body ?? {};
  if (!email || !password || !role || !schoolId) return res.status(400).json({ error: 'Missing fields' });
  const u = await createUser({ email, password, role, schoolId: Number(schoolId) });
  res.json({ user: { id: u.id, email: u.email, role: u.role, schoolId: u.schoolId } });
}));

// Enhanced admin routes for user management within a school

// 1) List users in my school
adminRouter.get('/users', asyncHandler(async (req, res) => {
  const { schoolId } = (req as any).session;
  const list = await db.select({ 
    id: users.id, 
    email: users.email, 
    role: users.role, 
    active: users.active, 
    createdAt: users.createdAt 
  })
    .from(users)
    .where(eq(users.schoolId, schoolId));
  res.json({ users: list });
}));

// 2) Invite a user (v2 registration)
adminRouter.post('/users/invite', requireTenant, asyncHandler(async (req, res) => {
  const { email, role, expiresInMinutes } = req.body ?? {};
  const { schoolId, userId } = (req as any).session;
  if (!email || !['teacher','admin'].includes(String(role))) {
    return res.status(400).json({ error: 'email+role required' });
  }

  const { token, code } = await createInvite({
    email: String(email),
    role: role as 'teacher'|'admin',
    schoolId,
    createdByUserId: userId,
    expiresInMinutes: expiresInMinutes ? Number(expiresInMinutes) : 1440
  });

  await db.insert(audits).values({
    actorUserId: userId, 
    schoolId, 
    action: 'INVITE_CREATE',
    targetType: 'user', 
    targetId: Number(token.id), 
    data: JSON.stringify({ email, role })
  });

  res.json({ 
    ok: true, 
    activationUrl: `/activate?schoolId=${schoolId}&email=${encodeURIComponent(String(email).toLowerCase())}`, 
    code, 
    expiresAt: token.expiresAt 
  });
}));

async function countAdmins(schoolId: number) {
  const [row] = await db.select({ c: count() }).from(users)
    .where(and(eq(users.schoolId, schoolId), eq(users.role, 'admin'), eq(users.active, true)));
  return Number(row?.c ?? 0);
}

// 3) Activate/Deactivate user
adminRouter.patch('/users/:id/active', requireTenant, asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);
  const { schoolId, userId: actorId } = (req as any).session;
  const active = Boolean(req.body?.active);

  const [u] = await db.select().from(users).where(and(eq(users.id, targetId), eq(users.schoolId, schoolId)));
  if (!u) return res.status(404).json({ error: 'User not found' });
  
  if (!active && u.role === 'admin') {
    const admins = await countAdmins(schoolId);
    if (admins <= 1) return res.status(409).json({ error: 'Cannot deactivate the last admin' });
  }

  const [upd] = await db.update(users).set({ active }).where(and(eq(users.id, targetId), eq(users.schoolId, schoolId))).returning();
  await db.insert(audits).values({ 
    actorUserId: actorId, 
    schoolId, 
    action: active ? 'USER_ACTIVATE':'USER_DEACTIVATE', 
    targetType:'user', 
    targetId: targetId 
  });
  res.json({ user: upd });
}));

// 4) Promote to admin
adminRouter.post('/users/:id/promote', requireTenant, asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);
  const { schoolId, userId: actorId } = (req as any).session;
  const [u] = await db.update(users).set({ role: 'admin' }).where(and(eq(users.id, targetId), eq(users.schoolId, schoolId))).returning();
  if (!u) return res.status(404).json({ error: 'User not found' });
  await db.insert(audits).values({ 
    actorUserId: actorId, 
    schoolId, 
    action:'USER_PROMOTE_ADMIN', 
    targetType:'user', 
    targetId: targetId 
  });
  res.json({ user: u });
}));

// 5) Demote admin to teacher (safely)
adminRouter.post('/users/:id/demote', requireTenant, asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);
  const { schoolId, userId: actorId } = (req as any).session;

  const [u] = await db.select().from(users).where(and(eq(users.id, targetId), eq(users.schoolId, schoolId)));
  if (!u) return res.status(404).json({ error: 'User not found' });
  if (u.role !== 'admin') return res.status(400).json({ error: 'User is not an admin' });

  const admins = await countAdmins(schoolId);
  if (admins <= 1) return res.status(409).json({ error: 'Cannot demote the last admin' });

  const [upd] = await db.update(users).set({ role: 'teacher' }).where(eq(users.id, targetId)).returning();
  await db.insert(audits).values({ 
    actorUserId: actorId, 
    schoolId, 
    action:'USER_DEMOTE_TEACHER', 
    targetType:'user', 
    targetId: targetId 
  });
  res.json({ user: upd });
}));

// 6) Reset password (simple immediate reset)
adminRouter.post('/users/:id/reset-password', requireTenant, asyncHandler(async (req, res) => {
  const targetId = Number(req.params.id);
  const { schoolId, userId: actorId } = (req as any).session;
  const { newPassword } = req.body ?? {};
  if (!newPassword) return res.status(400).json({ error: 'newPassword required' });

  const hash = await bcrypt.hash(String(newPassword), 10);
  const [upd] = await db.update(users).set({ passwordHash: hash }).where(and(eq(users.id, targetId), eq(users.schoolId, schoolId))).returning();
  if (!upd) return res.status(404).json({ error: 'User not found' });

  await db.insert(audits).values({ 
    actorUserId: actorId, 
    schoolId, 
    action:'USER_PASSWORD_RESET', 
    targetType:'user', 
    targetId: targetId 
  });
  res.json({ ok: true });
}));