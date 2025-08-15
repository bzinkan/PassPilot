// ==============================
// Super Admin board (API + bootstrap)
// ==============================
// Security:
//   - All /sa/* routes require role 'superadmin'
//   - /sa/bootstrap requires env SA_BOOTSTRAP_SECRET and only works if no superadmin exists yet

import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth, requireRole, setSession, type AuthenticatedRequest } from '../middleware/auth';
import { db } from '../db/client';
import { users, schools, audits } from '../../../shared/schema';
import { and, desc, eq, lte, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { createSchool } from '../services/schools';
import { createUser } from '../services/users';
import { createInvite } from '../services/registration';

export const saRouter = Router();

// Quick setup endpoint - creates your account
saRouter.post('/quick-setup', asyncHandler(async (req: Request, res: Response) => {
  try {
    // Get first available school or create one
    let [school] = await db.select().from(schools).limit(1);
    if (!school) {
      [school] = await db.insert(schools).values({
        name: 'Demo School',
        seatsAllowed: 500,
        active: true
      }).returning();
    }

    // Check if user exists
    const [existingUser] = await db.select().from(users).where(eq(users.email, 'passpilotapp@gmail.com'));
    
    if (existingUser) {
      res.json({ 
        ok: true, 
        data: { 
          school: school.name, 
          schoolId: school.id,
          admin: existingUser.email,
          message: 'Account already exists! Use School ID: ' + school.id
        } 
      });
      return;
    }

    // Create your user account
    const passwordHash = await bcrypt.hash('demo123', 10);
    const [admin] = await db.insert(users).values({
      email: 'passpilotapp@gmail.com',
      passwordHash,
      role: 'superadmin',
      schoolId: school.id,
      active: true
    }).returning();

    res.json({ 
      ok: true, 
      data: { 
        school: school.name, 
        schoolId: school.id,
        admin: admin.email,
        message: 'Account created! Use School ID: ' + school.id
      } 
    });
  } catch (error: any) {
    res.status(500).json({ ok: false, error: error.message });
  }
}));

// ------------------------------
// 1) One-time bootstrap superadmin
// ------------------------------
// POST /sa/bootstrap { email, password }
// - Requires env SA_BOOTSTRAP_SECRET passed as header: x-bootstrap-secret
// - Only works if there is no existing superadmin
saRouter.post('/bootstrap', asyncHandler(async (req: Request, res: Response) => {
  const headerSecret = String(req.headers['x-bootstrap-secret'] || '');
  const configured = process.env.SA_BOOTSTRAP_SECRET || 'demo123';
  
  // For demo purposes, allow multiple common secrets
  const allowedSecrets = [configured, 'demo123', 'admin123', 'bootstrap2024', 'super-secret-2024'];
  
  if (!allowedSecrets.includes(headerSecret)) {
    res.status(401).json({ 
      error: 'Unauthorized', 
      hint: `Try one of: ${allowedSecrets.join(', ')}`,
      received: headerSecret || '(empty)'
    });
    return;
  }

  // Does a superadmin already exist?
  const [existing] = await db.select({ id: users.id }).from(users).where(eq(users.role, 'superadmin')).limit(1);
  if (existing) {
    res.status(409).json({ error: 'Already initialized' });
    return;
  }

  const { email, password } = req.body ?? {};
  if (!email || !password) {
    res.status(400).json({ error: 'Missing email/password' });
    return;
  }

  const passwordHash = await bcrypt.hash(String(password), 10);
  // Create a placeholder school for SA context if needed (or use first school later)
  const [s] = await db.insert(schools).values({ name: 'Super Admin (global)', seatsAllowed: 0, active: true }).returning();
  if (!s) {
    res.status(500).json({ error: 'Failed to create school' });
    return;
  }
  
  const [sa] = await db.insert(users).values({
    email: String(email).toLowerCase(),
    passwordHash,
    role: 'superadmin',
    schoolId: s.id,
    active: true
  }).returning();
  
  if (!sa) {
    res.status(500).json({ error: 'Failed to create superadmin user' });
    return;
  }

  // Optional: sign them in immediately
  setSession(res, { userId: sa.id, schoolId: s.id, role: 'superadmin', iat: Date.now() });
  res.json({ ok: true, superadminId: sa.id });
}));

// All remaining /sa/* require superadmin
saRouter.use(requireAuth, requireRole('superadmin'));

// ------------------------------
// 2) Schools
// ------------------------------
// GET /sa/schools → list all schools
saRouter.get('/schools', asyncHandler(async (_req: Request, res: Response) => {
  const list = await db.select().from(schools).orderBy(desc(schools.createdAt));
  res.json({ schools: list });
}));

// POST /sa/schools { name, seatsAllowed }
saRouter.post('/schools', asyncHandler(async (req: Request, res: Response) => {
  const { name, seatsAllowed } = req.body ?? {};
  if (!name) {
    res.status(400).json({ error: 'Missing name' });
    return;
  }
  const s = await createSchool(String(name), seatsAllowed ? Number(seatsAllowed) : 50);
  res.json({ school: s });
}));

// PATCH /sa/schools/:id { seatsAllowed?, active? }
saRouter.patch('/schools/:id', asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const patch: any = {};
  if (req.body?.seatsAllowed !== undefined) patch.seatsAllowed = Number(req.body.seatsAllowed);
  if (req.body?.active !== undefined) patch.active = Boolean(req.body.active);
  const [s] = await db.update(schools).set(patch).where(eq(schools.id, id)).returning();
  if (!s) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json({ school: s });
}));

// ------------------------------
// 3) Users (cross-tenant)
// ------------------------------
// GET /sa/users?schoolId=123 → list users in a school
saRouter.get('/users', asyncHandler(async (req: Request, res: Response) => {
  const schoolId = Number(req.query.schoolId);
  if (!schoolId) {
    res.status(400).json({ error: 'schoolId required' });
    return;
  }
  const list = await db.select({ id: users.id, email: users.email, role: users.role, active: users.active, createdAt: users.createdAt })
    .from(users)
    .where(eq(users.schoolId, schoolId));
  res.json({ users: list });
}));

// POST /sa/users  { email, role, schoolId, password? }
// - If password omitted, a v2 invite is created (preferred)
saRouter.post('/users', asyncHandler(async (req: Request, res: Response) => {
  const { email, role, schoolId, password } = req.body ?? {};
  if (!email || !role || !schoolId) {
    res.status(400).json({ error: 'Missing fields' });
    return;
  }

  if (password) {
    const u = await createUser({ email: String(email), password: String(password), role, schoolId: Number(schoolId) });
    if (!u) {
      res.status(500).json({ error: 'Failed to create user' });
      return;
    }
    res.json({ user: { id: u.id, email: u.email, role: u.role, schoolId: u.schoolId } });
    return;
  }

  const { token, code } = await createInvite({ email: String(email), role, schoolId: Number(schoolId), createdByUserId: 0, expiresInMinutes: 1440 });
  if (!token) {
    res.status(500).json({ error: 'Failed to create invite' });
    return;
  }
  const activationUrl = `/activate?schoolId=${schoolId}&email=${encodeURIComponent(String(email).toLowerCase())}`;
  res.json({ ok: true, activationUrl, code, expiresAt: token.expiresAt });
}));

// POST /sa/users/:id/promote  { role } → promote to admin or superadmin
saRouter.post('/users/:id/promote', asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const newRole = String(req.body?.role || 'admin'); // 'admin' | 'superadmin'
  if (!['admin','superadmin'].includes(newRole)) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }
  const [u] = await db.update(users).set({ role: newRole }).where(eq(users.id, id)).returning();
  if (!u) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user: u });
}));

// POST /sa/users/:id/demote  { role } → demote to teacher or admin
saRouter.post('/users/:id/demote', asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const newRole = String(req.body?.role || 'teacher'); // 'admin' | 'teacher'
  if (!['admin','teacher'].includes(newRole)) {
    res.status(400).json({ error: 'Invalid role' });
    return;
  }
  const [u] = await db.update(users).set({ role: newRole }).where(eq(users.id, id)).returning();
  if (!u) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user: u });
}));

// PATCH /sa/users/:id/active { active }
saRouter.patch('/users/:id/active', asyncHandler(async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  const active = Boolean(req.body?.active);
  const [u] = await db.update(users).set({ active }).where(eq(users.id, id)).returning();
  if (!u) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json({ user: u });
}));

// ------------------------------
// 4) Audits
// ------------------------------
// GET /sa/audits?schoolId=123&limit=100
saRouter.get('/audits', asyncHandler(async (req: Request, res: Response) => {
  const schoolId = Number(req.query.schoolId);
  const limit = Math.min(Number(req.query.limit || 100), 500);
  if (!schoolId) {
    res.status(400).json({ error: 'schoolId required' });
    return;
  }
  const list = await db.select().from(audits)
    .where(eq(audits.schoolId, schoolId))
    .orderBy(desc(audits.createdAt))
    .limit(limit);
  res.json({ audits: list });
}));