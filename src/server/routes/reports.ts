import { Router } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { generateReportSummary, generatePassExportData } from '../services/reports';

export const reportsRouter = Router();

reportsRouter.use(requireAuth);

reportsRouter.get('/summary', asyncHandler(async (req, res) => {
  const { schoolId, userId, role } = (req as any).session;
  const { from, to, gradeId, teacherId, type } = req.query;
  
  // Parse and validate date parameters
  let fromDate: Date | undefined;
  let toDate: Date | undefined;
  
  if (from) {
    fromDate = new Date(from as string);
    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({ ok: false, error: 'Invalid from date format. Use YYYY-MM-DD' });
    }
  }
  
  if (to) {
    toDate = new Date(to as string);
    if (isNaN(toDate.getTime())) {
      return res.status(400).json({ ok: false, error: 'Invalid to date format. Use YYYY-MM-DD' });
    }
  }
  
  // Parse optional filters
  let gradeIdNum: number | undefined;
  let teacherIdNum: number | undefined;
  
  if (gradeId) {
    gradeIdNum = parseInt(gradeId as string);
    if (isNaN(gradeIdNum)) {
      return res.status(400).json({ ok: false, error: 'Invalid gradeId. Must be a number' });
    }
  }
  
  if (teacherId) {
    teacherIdNum = parseInt(teacherId as string);
    if (isNaN(teacherIdNum)) {
      return res.status(400).json({ ok: false, error: 'Invalid teacherId. Must be a number' });
    }
  }
  
  // Determine scope based on role
  const scope = ['admin', 'superadmin'].includes(role) ? 'school' : 'mine';
  
  try {
    const summary = await generateReportSummary({
      schoolId,
      from: fromDate,
      to: toDate,
      gradeId: gradeIdNum,
      teacherId: teacherIdNum,
      type: type as string,
      scope,
      requestingUserId: scope === 'mine' ? userId : undefined
    });
    
    res.json({ ok: true, data: summary });
  } catch (error: any) {
    console.error('Error generating report summary:', error);
    res.status(500).json({ ok: false, error: 'Failed to generate report summary' });
  }
}));

reportsRouter.get('/export.csv', asyncHandler(async (req, res) => {
  const { schoolId, userId, role } = (req as any).session;
  const { from, to, gradeId, teacherId, type } = req.query;
  
  // Parse and validate date parameters
  let fromDate: Date | undefined;
  let toDate: Date | undefined;
  
  if (from) {
    fromDate = new Date(from as string);
    if (isNaN(fromDate.getTime())) {
      return res.status(400).json({ ok: false, error: 'Invalid from date format. Use YYYY-MM-DD' });
    }
  }
  
  if (to) {
    toDate = new Date(to as string);
    if (isNaN(toDate.getTime())) {
      return res.status(400).json({ ok: false, error: 'Invalid to date format. Use YYYY-MM-DD' });
    }
  }
  
  // Parse optional filters
  let gradeIdNum: number | undefined;
  let teacherIdNum: number | undefined;
  
  if (gradeId) {
    gradeIdNum = parseInt(gradeId as string);
    if (isNaN(gradeIdNum)) {
      return res.status(400).json({ ok: false, error: 'Invalid gradeId. Must be a number' });
    }
  }
  
  if (teacherId) {
    teacherIdNum = parseInt(teacherId as string);
    if (isNaN(teacherIdNum)) {
      return res.status(400).json({ ok: false, error: 'Invalid teacherId. Must be a number' });
    }
  }
  
  // Determine scope based on role
  const scope = ['admin', 'superadmin'].includes(role) ? 'school' : 'mine';
  
  try {
    const data = await generatePassExportData({
      schoolId,
      from: fromDate,
      to: toDate,
      gradeId: gradeIdNum,
      teacherId: teacherIdNum,
      type: type as string,
      scope,
      requestingUserId: scope === 'mine' ? userId : undefined
    });
    
    // Set CSV headers
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="passes_report.csv"');
    
    // Write CSV headers
    const headers = [
      'ID',
      'Student Name',
      'Student Code',
      'Grade',
      'Pass Type',
      'Custom Reason',
      'Issued By',
      'Start Time',
      'End Time',
      'Duration (Minutes)',
      'Status'
    ];
    res.write(headers.join(',') + '\n');
    
    // Write CSV data
    for (const row of data) {
      const csvRow = [
        row.id,
        `"${row.studentName.replace(/"/g, '""')}"`, // Escape quotes in student names
        row.studentCode || '',
        row.gradeName || '',
        row.type,
        row.customReason ? `"${row.customReason.replace(/"/g, '""')}"` : '',
        `"${row.issuedBy.replace(/"/g, '""')}"`,
        row.startsAt.toISOString(),
        row.endsAt ? row.endsAt.toISOString() : '',
        row.durationMinutes,
        row.status
      ];
      res.write(csvRow.join(',') + '\n');
    }
    
    res.end();
  } catch (error: any) {
    console.error('Error generating CSV export:', error);
    if (!res.headersSent) {
      res.status(500).json({ ok: false, error: 'Failed to generate CSV export' });
    }
  }
}));