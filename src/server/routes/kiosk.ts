import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { rateLimit } from '../middleware/rateLimit';
import { createPass, returnPass, listActivePasses } from '../services/passes';

// Minimal kiosk cookie using same session shape but flagged as kiosk
import { setSession, readSession } from '../middleware/auth';

export const kioskRouter = Router();

kioskRouter.post('/login', rateLimit({ windowMs: 60_000, max: 30 }), asyncHandler(async (req, res) => {
  const { schoolId, room, pin } = req.body ?? {};
  if (!schoolId || !room || !pin) return res.status(400).json({ error: 'Missing fields' });
  // TODO: verify pin against kioskDevices (pinHash) for that school/room
  // For starter, accept any non-empty PIN (replace when schema seeded)
  setSession(res, { userId: 0, schoolId: Number(schoolId), role: 'teacher', iat: Date.now() });
  res.json({ ok: true });
}));

kioskRouter.post('/passes', rateLimit({ windowMs: 10_000, max: 12 }), asyncHandler(async (req, res) => {
  const s = readSession(req);
  if (!s) return res.status(401).json({ error: 'Unauthorized' });
  const { studentName, reason, issuedByUserId } = req.body ?? {};
  if (!studentName || !reason || !issuedByUserId) return res.status(400).json({ error: 'Missing fields' });
  const p = await createPass({ studentName, reason, issuedByUserId: Number(issuedByUserId), schoolId: s.schoolId });
  res.json({ pass: p });
}));

kioskRouter.patch('/passes/:id/return', asyncHandler(async (req, res) => {
  const s = readSession(req);
  if (!s) return res.status(401).json({ error: 'Unauthorized' });
  const p = await returnPass(Number(req.params.id), s.schoolId);
  res.json({ pass: p, ok: !!p });
}));

kioskRouter.get('/passes/active', asyncHandler(async (req, res) => {
  const s = readSession(req);
  if (!s) return res.status(401).json({ error: 'Unauthorized' });
  const list = await listActivePasses(s.schoolId);
  res.json({ passes: list });
}));