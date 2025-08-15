import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { db } from '../db/client';
import { students, grades } from '@shared/schema';
import { eq } from 'drizzle-orm';

export const uploadRouter = Router();
uploadRouter.use(requireAuth);

// Upload students CSV (multipart/csv)
uploadRouter.post('/students', asyncHandler(async (req, res) => {
  const { schoolId } = (req as any).session;
  
  // This would typically use multer for file uploads
  // For now, accepting JSON data that represents CSV content
  const { csvData, gradeId } = req.body ?? {};
  
  if (!csvData || !gradeId) {
    return res.status(400).json({ ok: false, error: 'CSV data and grade ID required' });
  }

  // Validate grade belongs to school
  const [grade] = await db.select().from(grades).where(eq(grades.id, gradeId));
  if (!grade || grade.schoolId !== schoolId) {
    return res.status(400).json({ ok: false, error: 'Invalid grade for this school' });
  }

  try {
    // Parse CSV data (assuming it's array of student objects)
    const studentsToInsert = csvData.map((row: any) => ({
      schoolId,
      gradeId: gradeId,
      name: row.name || row.studentName,
      studentCode: row.code || row.studentCode || null,
    }));

    // Insert students
    const insertedStudents = await db.insert(students).values(studentsToInsert).returning();

    res.json({ 
      ok: true, 
      data: {
        inserted: insertedStudents.length,
        students: insertedStudents
      }
    });
  } catch (error: any) {
    res.status(500).json({ 
      ok: false, 
      error: 'Failed to process CSV data: ' + error.message 
    });
  }
}));

// Get upload template (CSV headers)
uploadRouter.get('/template', asyncHandler(async (req, res) => {
  res.json({
    ok: true,
    data: {
      headers: ['name', 'studentCode'],
      example: [
        { name: 'John Doe', studentCode: 'JD001' },
        { name: 'Jane Smith', studentCode: 'JS002' }
      ]
    }
  });
}));