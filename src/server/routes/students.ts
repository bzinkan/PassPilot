import { Router, Response } from 'express';
import type { AuthenticatedRequest } from '../middleware/auth';
import { requireAuth } from '../middleware/auth';
import { StudentsService } from '../services/students';
import { asyncHandler } from '../middleware/asyncHandler';

export const studentsRouter = Router();

// Get all students for the authenticated user's school
studentsRouter.get('/', requireAuth, asyncHandler(async (req, res) => {
  const schoolId = req.session!.schoolId;
  const students = await StudentsService.getStudentsBySchool(schoolId);
  res.json({ students });
}));

// Get students by grade
studentsRouter.get('/grade/:gradeId', requireAuth, asyncHandler(async (req, res) => {
  const schoolId = req.session!.schoolId;
  const gradeId = parseInt(req.params.gradeId);
  
  if (isNaN(gradeId)) {
    return res.status(400).json({ error: 'Invalid grade ID' });
  }

  const students = await StudentsService.getStudentsByGrade(gradeId, schoolId);
  res.json({ students });
}));

// Create a new student
studentsRouter.post('/', requireAuth, asyncHandler(async (req, res) => {
  const schoolId = req.session!.schoolId;
  const { name, gradeId, studentCode } = req.body;

  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Student name is required' });
  }

  if (!gradeId || typeof gradeId !== 'number') {
    return res.status(400).json({ error: 'Grade ID is required' });
  }

  const student = await StudentsService.createStudent(schoolId, gradeId, name, studentCode);
  res.json({ student });
}));

// Get student by ID
studentsRouter.get('/:id', requireAuth, asyncHandler(async (req, res) => {
  const schoolId = req.session!.schoolId;
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid student ID' });
  }

  const student = await StudentsService.getStudentById(id, schoolId);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  res.json({ student });
}));

// Update student
studentsRouter.put('/:id', requireAuth, asyncHandler(async (req, res) => {
  const schoolId = req.session!.schoolId;
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid student ID' });
  }

  const { name, gradeId, studentCode } = req.body;
  const updates: { name?: string; gradeId?: number; studentCode?: string } = {};

  if (name !== undefined) updates.name = name;
  if (gradeId !== undefined) updates.gradeId = gradeId;
  if (studentCode !== undefined) updates.studentCode = studentCode;

  const student = await StudentsService.updateStudent(id, schoolId, updates);
  if (!student) {
    return res.status(404).json({ error: 'Student not found' });
  }

  res.json({ student });
}));

// Delete student
studentsRouter.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
  const session = req.session!;
  
  // Only admins can delete students
  if (session.role !== 'admin' && session.role !== 'superadmin') {
    return res.status(403).json({ error: 'Requires admin access' });
  }

  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid student ID' });
  }

  await StudentsService.deleteStudent(id, session.schoolId);
  res.json({ ok: true });
}));

// Bulk create students from CSV data
studentsRouter.post('/bulk', requireAuth, asyncHandler(async (req, res) => {
  const schoolId = req.session!.schoolId;
  const { students } = req.body;

  if (!Array.isArray(students)) {
    return res.status(400).json({ error: 'Students array is required' });
  }

  // Validate each student entry
  for (const student of students) {
    if (!student.name || typeof student.name !== 'string') {
      return res.status(400).json({ error: 'Each student must have a name' });
    }
    if (!student.gradeId || typeof student.gradeId !== 'number') {
      return res.status(400).json({ error: 'Each student must have a valid gradeId' });
    }
  }

  const createdStudents = await StudentsService.bulkCreateStudents(schoolId, students);
  res.json({ students: createdStudents, count: createdStudents.length });
}));