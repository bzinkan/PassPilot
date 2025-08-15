import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { createPass, listActivePasses, returnPass } from '../services/passes';

export const passesRouter = Router();

passesRouter.use(requireAuth);

passesRouter.get('/', asyncHandler(async (req, res) => {
  const { schoolId, userId } = (req as any).user;
  const list = await listActivePasses(schoolId);
  res.json({ passes: list });
}));

passesRouter.post('/', asyncHandler(async (req, res) => {
  const { schoolId, userId } = (req as any).user;
  const { studentName, reason } = req.body ?? {};
  if (!studentName || !reason) return res.status(400).json({ error: 'Missing fields' });
  const p = await createPass({ studentName, reason, issuedByUserId: userId, schoolId });
  res.json({ pass: p });
}));

passesRouter.patch('/:id/return', asyncHandler(async (req, res) => {
  const { schoolId } = (req as any).user;
  const p = await returnPass(Number(req.params.id), schoolId);
  res.json({ pass: p, ok: !!p });
}));