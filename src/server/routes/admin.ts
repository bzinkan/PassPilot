import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import { createSchool } from '../services/schools';
import { createUser } from '../services/users';

export const adminRouter = Router();

adminRouter.use(requireAuth, requireRole('admin'));

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