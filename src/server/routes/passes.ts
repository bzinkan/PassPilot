import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth, requireRole } from '../middleware/auth';
import { createPass, listPasses, returnPass } from '../services/passes';

export const passesRouter = Router();

passesRouter.use(requireAuth);

passesRouter.get('/', asyncHandler(async (req, res) => {
  const { schoolId, userId, role } = (req as any).session;
  const { scope = 'mine', status, from, to } = req.query;
  
  // Validate scope parameter
  if (scope !== 'mine' && scope !== 'school') {
    return res.status(400).json({ ok: false, error: 'Invalid scope. Must be "mine" or "school"' });
  }
  
  // Only admins can access school-wide scope
  if (scope === 'school' && !['admin', 'superadmin'].includes(role)) {
    return res.status(403).json({ ok: false, error: 'Forbidden. Admin role required for school scope' });
  }
  
  // Validate status parameter
  if (status && status !== 'active' && status !== 'returned') {
    return res.status(400).json({ ok: false, error: 'Invalid status. Must be "active" or "returned"' });
  }
  
  // Parse date parameters
  let fromDate: Date | undefined;
  let toDate: Date | undefined;
  if (from) {
    fromDate = new Date(from as string);
    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({ ok: false, error: 'Invalid from date format' });
    }
  }
  if (to) {
    toDate = new Date(to as string);
    if (isNaN(toDate.getTime())) {
      return res.status(400).json({ ok: false, error: 'Invalid to date format' });
    }
  }
  
  const passes = await listPasses({
    schoolId,
    scope: scope as 'mine' | 'school',
    status: status as 'active' | 'returned' | undefined,
    teacherUserId: scope === 'mine' ? userId : undefined,
    from: fromDate,
    to: toDate
  });
  
  res.json({ ok: true, data: passes });
}));

passesRouter.post('/', asyncHandler(async (req, res) => {
  const { schoolId, userId } = (req as any).session;
  const { studentId, studentName, reason, type, customReason } = req.body ?? {};
  
  // Validate required fields
  if (!studentId && !studentName) {
    return res.status(400).json({ ok: false, error: 'Either studentId or studentName is required' });
  }
  
  if (!type) {
    return res.status(400).json({ ok: false, error: 'Pass type is required' });
  }
  
  try {
    const pass = await createPass({ 
      studentId, 
      studentName, 
      reason, 
      type, 
      customReason, 
      issuedByUserId: userId, 
      schoolId 
    });
    res.json({ ok: true, data: pass });
  } catch (error: any) {
    if (error.message === 'Student already has an active pass' || 
        error.message === 'Student not found') {
      return res.status(400).json({ ok: false, error: error.message });
    }
    throw error;
  }
}));

passesRouter.patch('/:id/return', asyncHandler(async (req, res) => {
  const { schoolId } = (req as any).session;
  const passId = Number(req.params.id);
  
  if (isNaN(passId)) {
    return res.status(400).json({ ok: false, error: 'Invalid pass ID' });
  }
  
  const pass = await returnPass(passId, schoolId);
  
  if (!pass) {
    return res.status(404).json({ ok: false, error: 'Pass not found or does not belong to your school' });
  }
  
  res.json({ ok: true, data: pass });
}));