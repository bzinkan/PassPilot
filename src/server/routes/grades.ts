import { Router, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { requireAuth } from '../middleware/auth';
import { GradesService } from '../services/grades';
import { asyncHandler } from '../middleware/asyncHandler';

export const gradesRouter = Router();

// Get all grades for the authenticated user's school
gradesRouter.get('/', requireAuth, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  const schoolId = req.session!.schoolId;
  const grades = await GradesService.getGradesBySchool(schoolId);
  res.json({ grades });
}));

// Create a new grade (admin only)
gradesRouter.post('/', requireAuth, asyncHandler(async (req, res) => {
  const session = req.session!;
  
  if (session.role !== 'admin' && session.role !== 'superadmin') {
    return res.status(403).json({ error: 'Requires admin access' });
  }

  const { name } = req.body;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Grade name is required' });
  }

  const grade = await GradesService.createGrade(session.schoolId, name);
  res.json({ grade });
}));

// Get grades assigned to a teacher
gradesRouter.get('/teacher/:userId', requireAuth, asyncHandler(async (req, res) => {
  const session = req.session!;
  const userId = parseInt(req.params.userId);
  
  if (isNaN(userId)) {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  // Users can only view their own assignments unless they're admin
  if (session.userId !== userId && session.role !== 'admin' && session.role !== 'superadmin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const grades = await GradesService.getTeacherGrades(userId, session.schoolId);
  res.json({ grades });
}));

// Assign a grade to a teacher (admin only)
gradesRouter.post('/assign', requireAuth, asyncHandler(async (req, res) => {
  const session = req.session!;
  
  if (session.role !== 'admin' && session.role !== 'superadmin') {
    return res.status(403).json({ error: 'Requires admin access' });
  }

  const { userId, gradeId } = req.body;
  if (!userId || !gradeId || typeof userId !== 'number' || typeof gradeId !== 'number') {
    return res.status(400).json({ error: 'userId and gradeId are required' });
  }

  const assignment = await GradesService.assignGradeToTeacher(userId, session.schoolId, gradeId);
  res.json({ assignment });
}));

// Remove grade assignment from teacher (admin only)
gradesRouter.delete('/assign', requireAuth, asyncHandler(async (req, res) => {
  const session = req.session!;
  
  if (session.role !== 'admin' && session.role !== 'superadmin') {
    return res.status(403).json({ error: 'Requires admin access' });
  }

  const { userId, gradeId } = req.body;
  if (!userId || !gradeId || typeof userId !== 'number' || typeof gradeId !== 'number') {
    return res.status(400).json({ error: 'userId and gradeId are required' });
  }

  await GradesService.removeGradeFromTeacher(userId, session.schoolId, gradeId);
  res.json({ ok: true });
}));