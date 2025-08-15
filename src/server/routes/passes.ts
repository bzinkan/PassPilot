import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { createPass, listActivePasses, returnPass } from '../services/passes';

export const passesRouter = Router();

passesRouter.use(requireAuth);

passesRouter.get('/', asyncHandler(async (req, res) => {
  const { schoolId, userId } = (req as any).session;
  const list = await listActivePasses(schoolId);
  res.json({ passes: list });
}));

passesRouter.post('/', asyncHandler(async (req, res) => {
  const { schoolId, userId } = (req as any).session;
  const { studentId, studentName, reason, type, customReason } = req.body ?? {};
  
  // Support both structured (studentId) and legacy (studentName) approaches
  if (!studentId && !studentName) {
    return res.status(400).json({ error: 'Either studentId or studentName is required' });
  }
  
  const p = await createPass({ 
    studentId, 
    studentName, 
    reason, 
    type, 
    customReason, 
    issuedByUserId: userId, 
    schoolId 
  });
  res.json({ pass: p });
}));

passesRouter.patch('/:id/return', asyncHandler(async (req, res) => {
  const { schoolId } = (req as any).session;
  const p = await returnPass(Number(req.params.id), schoolId);
  res.json({ pass: p, ok: !!p });
}));