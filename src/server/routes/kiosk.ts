import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { rateLimit } from '../middleware/rateLimit';
import { createPass, returnPass, listActivePasses } from '../services/passes';
import { requireKiosk } from '../middleware/kiosk';

export const kioskRouter = Router();

// Apply kiosk authentication to all routes
kioskRouter.use(requireKiosk);

kioskRouter.post('/passes', rateLimit({ windowMs: 10_000, max: 12 }), asyncHandler(async (req, res) => {
  const kiosk = (req as any).kiosk;
  const { studentName, reason, issuedByUserId } = req.body ?? {};
  if (!studentName || !reason || !issuedByUserId) return res.status(400).json({ error: 'Missing fields' });
  const p = await createPass({ 
    studentName, 
    reason, 
    issuedByUserId: Number(issuedByUserId), 
    schoolId: kiosk.schoolId,
    issuedVia: 'kiosk',
    kioskDeviceId: (req as any).kiosk.kioskDeviceId
  });
  res.json({ pass: p });
}));

kioskRouter.patch('/passes/:id/return', asyncHandler(async (req, res) => {
  const kiosk = (req as any).kiosk;
  const p = await returnPass(Number(req.params.id), kiosk.schoolId);
  res.json({ pass: p, ok: !!p });
}));

kioskRouter.get('/passes/active', asyncHandler(async (req, res) => {
  const kiosk = (req as any).kiosk;
  const list = await listActivePasses(kiosk.schoolId);
  res.json({ passes: list });
}));