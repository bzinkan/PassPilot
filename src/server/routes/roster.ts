import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { requireAuth } from '../middleware/auth';
import { db } from '../db/client';
import { grades, students, teacherGradeMap, passes, userSettings } from '../../../shared/schema';
import { and, eq, inArray } from 'drizzle-orm';

export const rosterRouter = Router();
rosterRouter.use(requireAuth);

// GET /roster
rosterRouter.get('/roster', asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, userId } = (req as any).session;
  const [allGrades, allStudents, selected] = await Promise.all([
    db.select().from(grades).where(eq(grades.schoolId, schoolId)),
    db.select().from(students).where(eq(students.schoolId, schoolId)),
    db.select({ gradeId: teacherGradeMap.gradeId }).from(teacherGradeMap)
      .where(and(eq(teacherGradeMap.schoolId, schoolId), eq(teacherGradeMap.userId, userId)))
  ]);
  res.json({ grades: allGrades, students: allStudents, selectedGradeIds: selected.map(s => s.gradeId) });
}));

// POST /grades
rosterRouter.post('/grades', asyncHandler(async (req: Request, res: Response) => {
  const { name } = req.body ?? {};
  const { schoolId } = (req as any).session;
  if (!name) return res.status(400).json({ error: 'Missing name' });
  const [g] = await db.insert(grades).values({ name: String(name), schoolId }).returning();
  res.json({ grade: g });
}));

// POST /students
rosterRouter.post('/students', asyncHandler(async (req: Request, res: Response) => {
  const { name, gradeId, studentCode } = req.body ?? {};
  const { schoolId } = (req as any).session;
  if (!name || !gradeId) return res.status(400).json({ error: 'Missing fields' });
  const [s] = await db.insert(students).values({
    name: String(name),
    gradeId: Number(gradeId),
    studentCode: studentCode ? String(studentCode) : null,
    schoolId
  }).returning();
  res.json({ student: s });
}));

// POST /roster/select
rosterRouter.post('/roster/select', asyncHandler(async (req: Request, res: Response) => {
  const { gradeIds } = req.body ?? {};
  const { schoolId, userId } = (req as any).session;
  if (!Array.isArray(gradeIds)) return res.status(400).json({ error: 'gradeIds must be an array' });
  await db.delete(teacherGradeMap).where(and(eq(teacherGradeMap.schoolId, schoolId), eq(teacherGradeMap.userId, userId)));
  if (gradeIds.length) {
    await db.insert(teacherGradeMap).values(gradeIds.map((gid: number) => ({ userId, schoolId, gradeId: Number(gid) })));
  }
  res.json({ ok: true, selectedGradeIds: gradeIds.map(Number) });
}));

// POST /roster/toggle { gradeId, selected }
rosterRouter.post('/roster/toggle', asyncHandler(async (req: Request, res: Response) => {
  const { gradeId, selected } = req.body ?? {};
  const { schoolId, userId } = (req as any).session;
  if (!gradeId || typeof selected !== 'boolean') return res.status(400).json({ error: 'Missing gradeId/selected' });

  if (selected) {
    await db.insert(teacherGradeMap)
      .values({ userId, schoolId, gradeId: Number(gradeId) })
      .onConflictDoNothing(); // if already selected, no error
  } else {
    await db.delete(teacherGradeMap)
      .where(and(
        eq(teacherGradeMap.userId, userId),
        eq(teacherGradeMap.schoolId, schoolId),
        eq(teacherGradeMap.gradeId, Number(gradeId))
      ));
  }
  res.json({ ok: true });
}));

// POST /students/bulk  Body: [{ name, gradeId, studentCode? }, ...]
rosterRouter.post('/students/bulk', asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = (req as any).session;
  const items = Array.isArray(req.body) ? req.body : [];
  if (!items.length) return res.status(400).json({ error: 'Expected an array' });

  const values = items.map((it: any) => ({
    name: String(it.name),
    gradeId: Number(it.gradeId),
    studentCode: it.studentCode ? String(it.studentCode) : null,
    schoolId
  }));

  const inserted = await db.insert(students).values(values).returning();
  res.json({ inserted: inserted.length });
}));

export const myClassRouter = Router();
myClassRouter.use(requireAuth);

// GET /myclass
myClassRouter.get('/myclass', asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, userId } = (req as any).session;
  const selected = await db.select({ gradeId: teacherGradeMap.gradeId }).from(teacherGradeMap)
    .where(and(eq(teacherGradeMap.schoolId, schoolId), eq(teacherGradeMap.userId, userId)));
  const selectedIds = selected.map(x => x.gradeId);
  if (!selectedIds.length) return res.json({ gradesActive: [], stats: { total: 0, out: 0, available: 0 }, students: [] });

  const all = await db.select().from(students)
    .where(and(eq(students.schoolId, schoolId), inArray(students.gradeId, selectedIds)))
    .orderBy(students.name);

  const active = await db.select({ id: passes.id, studentId: passes.studentId, type: passes.type, startsAt: passes.startsAt })
    .from(passes)
    .where(and(eq(passes.schoolId, schoolId), eq(passes.status, 'active')));

  const activeByStudent = new Map<number, { id: number; type: string; startsAt: Date }>();
  for (const p of active) if (p.studentId) activeByStudent.set(p.studentId, { id: p.id, type: p.type as any, startsAt: p.startsAt as any });

  const rows = all.map(s => ({
    id: s.id,
    name: s.name,
    gradeId: s.gradeId,
    isOut: activeByStudent.has(s.id),
    since: activeByStudent.get(s.id)?.startsAt ?? null,
    lastType: activeByStudent.get(s.id)?.type ?? null,
    activePassId: activeByStudent.get(s.id)?.id ?? null,
  }));

  const stats = { total: rows.length, out: rows.filter(r => r.isOut).length, available: 0 };
  stats.available = stats.total - stats.out;

  // Include current grade from user settings
  const [settings] = await db.select().from(userSettings).where(eq(userSettings.userId, userId)).limit(1);
  const currentGrade = settings?.lastActiveGradeId && selectedIds.includes(settings.lastActiveGradeId)
    ? settings.lastActiveGradeId
    : selectedIds[0] ?? null;

  res.json({ gradesActive: selectedIds, currentGrade, stats, students: rows });
}));

// POST /myclass/pass
myClassRouter.post('/myclass/pass', asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, userId } = (req as any).session;
  const { studentId, type, customReason } = req.body ?? {};
  if (!studentId || !type) return res.status(400).json({ error: 'Missing fields' });
  if (String(type) === 'custom' && !customReason) return res.status(400).json({ error: 'customReason required for type=custom' });

  const existing = await db.select({ id: passes.id }).from(passes)
    .where(and(eq(passes.schoolId, schoolId), eq(passes.status, 'active'), eq(passes.studentId, Number(studentId))))
    .limit(1);
  if (existing.length) return res.status(409).json({ error: 'Student already has an active pass', passId: existing[0].id });

  const [p] = await db.insert(passes).values({
    studentId: Number(studentId),
    issuedByUserId: userId,
    schoolId,
    status: 'active',
    type: String(type),
    customReason: customReason ? String(customReason) : null,
  }).returning();

  res.json({ pass: p });
}));

// POST /myclass/switch { gradeId }
myClassRouter.post('/myclass/switch', asyncHandler(async (req: Request, res: Response) => {
  const { userId } = (req as any).session;
  const gradeId = Number(req.body?.gradeId);
  if (!gradeId) return res.status(400).json({ error: 'gradeId required' });

  await db.insert(userSettings)
    .values({ userId, lastActiveGradeId: gradeId })
    .onConflictDoUpdate({ target: userSettings.userId, set: { lastActiveGradeId: gradeId } });

  res.json({ ok: true });
}));

// PATCH /myclass/pass/:id/return
myClassRouter.patch('/myclass/pass/:id/return', asyncHandler(async (req: Request, res: Response) => {
  const { schoolId } = (req as any).session;
  const id = Number(req.params.id);
  const [p] = await db.update(passes).set({ status: 'returned', endsAt: new Date() })
    .where(and(eq(passes.id, id), eq(passes.schoolId, schoolId), eq(passes.status, 'active')))
    .returning();
  res.json({ ok: !!p, pass: p ?? null });
}));