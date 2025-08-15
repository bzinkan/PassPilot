import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { setSession, clearSession, readSession } from '../middleware/auth';
import { findUserByEmailSchool } from '../services/users';
import bcrypt from 'bcryptjs';
import { rateLimit } from '../middleware/rateLimit';

export const authRouter = Router();

authRouter.post('/login', rateLimit({ windowMs: 60_000, max: 20 }), asyncHandler(async (req, res) => {
  const { email, password, schoolId } = req.body ?? {};
  if (!email || !password || !schoolId) return res.status(400).json({ error: 'Missing fields' });
  const user = await findUserByEmailSchool(String(email), Number(schoolId));
  if (!user || !user.active) return res.status(401).json({ error: 'Invalid credentials' });
  const ok = await bcrypt.compare(String(password), user.passwordHash);
  if (!ok) return res.status(401).json({ error: 'Invalid credentials' });
  setSession(res, { userId: user.id, schoolId: user.schoolId, role: user.role as any, iat: Date.now() });
  res.json({ ok: true });
}));

authRouter.post('/logout', asyncHandler(async (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
}));

authRouter.get('/me', asyncHandler(async (req, res) => {
  const session = readSession(req);
  res.json({ user: session });
}));