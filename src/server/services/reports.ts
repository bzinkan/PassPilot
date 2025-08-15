import { db } from '../db/client';
import { passes, students, grades, users, teacherGradeMap } from '@shared/schema';
import { and, desc, eq, inArray, gte, lte, or, sql, isNotNull } from 'drizzle-orm';

export interface ReportOptions {
  schoolId: number;
  from?: Date;
  to?: Date;
  gradeId?: number;
  teacherId?: number;
  type?: string;
  scope: 'mine' | 'school';
  requestingUserId?: number;
}

export interface ReportSummary {
  totals: {
    passes: number;
    students: number;
    avgMinutes: number;
    peakHour: string;
  };
  byType: Record<string, number>;
  byTeacher: Array<{
    teacherId: number;
    name: string;
    count: number;
    avgMinutes: number;
  }>;
  byGrade: Array<{
    gradeId: number;
    name: string;
    count: number;
  }>;
}

export interface PassExportRow {
  id: number;
  studentName: string;
  studentCode?: string;
  gradeName?: string;
  type: string;
  customReason?: string;
  issuedBy: string;
  startsAt: Date;
  endsAt?: Date;
  durationMinutes?: number;
  status: string;
}

// Get teacher's accessible grade IDs based on scope
async function getAccessibleGradeIds(options: ReportOptions): Promise<number[] | null> {
  if (options.scope === 'school') {
    // Admin can see all grades - return null to indicate no filtering
    return null;
  }
  
  if (options.scope === 'mine' && options.requestingUserId) {
    // Teacher can only see their assigned grades
    const teacherGrades = await db
      .select({ gradeId: teacherGradeMap.gradeId })
      .from(teacherGradeMap)
      .where(and(
        eq(teacherGradeMap.userId, options.requestingUserId),
        eq(teacherGradeMap.schoolId, options.schoolId)
      ));
    
    return teacherGrades.map(tg => tg.gradeId);
  }
  
  return [];
}

// Build base query conditions
function buildBaseConditions(options: ReportOptions, accessibleGradeIds: number[] | null) {
  const conditions = [eq(passes.schoolId, options.schoolId)];
  
  // Date range filters
  if (options.from) {
    conditions.push(gte(passes.startsAt, options.from));
  }
  if (options.to) {
    conditions.push(lte(passes.startsAt, options.to));
  }
  
  // Grade filter
  if (options.gradeId) {
    conditions.push(eq(students.gradeId, options.gradeId));
  } else if (accessibleGradeIds !== null && accessibleGradeIds.length > 0) {
    // Apply teacher's grade restrictions
    conditions.push(
      or(
        inArray(students.gradeId, accessibleGradeIds),
        eq(passes.issuedByUserId, options.requestingUserId!)
      )
    );
  } else if (accessibleGradeIds !== null && accessibleGradeIds.length === 0) {
    // Teacher has no grades assigned, only show passes they issued
    conditions.push(eq(passes.issuedByUserId, options.requestingUserId!));
  }
  
  // Teacher filter
  if (options.teacherId) {
    conditions.push(eq(passes.issuedByUserId, options.teacherId));
  }
  
  // Type filter
  if (options.type) {
    conditions.push(eq(passes.type, options.type));
  }
  
  return conditions;
}

export async function generateReportSummary(options: ReportOptions): Promise<ReportSummary> {
  const accessibleGradeIds = await getAccessibleGradeIds(options);
  const conditions = buildBaseConditions(options, accessibleGradeIds);
  
  // Get all passes for the period
  const passesData = await db
    .select({
      id: passes.id,
      type: passes.type,
      issuedByUserId: passes.issuedByUserId,
      startsAt: passes.startsAt,
      endsAt: passes.endsAt,
      status: passes.status,
      studentId: passes.studentId,
      gradeId: students.gradeId,
      issuedByEmail: users.email,
    })
    .from(passes)
    .leftJoin(students, eq(passes.studentId, students.id))
    .leftJoin(users, eq(passes.issuedByUserId, users.id))
    .where(and(...conditions));
  
  // Calculate totals
  const totalPasses = passesData.length;
  const uniqueStudents = new Set(passesData.filter(p => p.studentId).map(p => p.studentId)).size;
  
  // Calculate average duration in minutes
  const durations = passesData.map(p => {
    const end = p.endsAt || new Date();
    const start = p.startsAt;
    return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
  });
  const avgMinutes = durations.length > 0 
    ? Math.round((durations.reduce((a, b) => a + b, 0) / durations.length) * 10) / 10
    : 0;
  
  // Calculate peak hour
  const hourCounts: Record<string, number> = {};
  passesData.forEach(p => {
    const hour = p.startsAt.getHours().toString().padStart(2, '0') + ':00';
    hourCounts[hour] = (hourCounts[hour] || 0) + 1;
  });
  const peakHour = Object.entries(hourCounts).reduce((a, b) => 
    hourCounts[a[0]] > hourCounts[b[0]] ? a : b, ['00:00', 0])[0] || '00:00';
  
  // Group by type
  const byType: Record<string, number> = {};
  passesData.forEach(p => {
    byType[p.type] = (byType[p.type] || 0) + 1;
  });
  
  // Group by teacher
  const teacherStats: Record<number, { name: string; count: number; totalMinutes: number }> = {};
  passesData.forEach(p => {
    if (p.issuedByUserId) {
      if (!teacherStats[p.issuedByUserId]) {
        teacherStats[p.issuedByUserId] = {
          name: p.issuedByEmail || 'Unknown Teacher',
          count: 0,
          totalMinutes: 0
        };
      }
      teacherStats[p.issuedByUserId].count++;
      
      const end = p.endsAt || new Date();
      const start = p.startsAt;
      const minutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
      teacherStats[p.issuedByUserId].totalMinutes += minutes;
    }
  });
  
  const byTeacher = Object.entries(teacherStats).map(([teacherId, stats]) => ({
    teacherId: parseInt(teacherId),
    name: stats.name,
    count: stats.count,
    avgMinutes: Math.round((stats.totalMinutes / stats.count) * 10) / 10
  }));
  
  // Group by grade
  const gradeStats: Record<number, { name: string; count: number }> = {};
  
  // Get grade names for the accessible grades
  const gradeNames = await db
    .select({ id: grades.id, name: grades.name })
    .from(grades)
    .where(
      and(
        eq(grades.schoolId, options.schoolId),
        accessibleGradeIds ? inArray(grades.id, accessibleGradeIds) : undefined
      )
    );
  
  const gradeNameMap = new Map(gradeNames.map(g => [g.id, g.name]));
  
  passesData.forEach(p => {
    if (p.gradeId && gradeNameMap.has(p.gradeId)) {
      if (!gradeStats[p.gradeId]) {
        gradeStats[p.gradeId] = {
          name: gradeNameMap.get(p.gradeId)!,
          count: 0
        };
      }
      gradeStats[p.gradeId].count++;
    }
  });
  
  const byGrade = Object.entries(gradeStats).map(([gradeId, stats]) => ({
    gradeId: parseInt(gradeId),
    name: stats.name,
    count: stats.count
  }));
  
  return {
    totals: {
      passes: totalPasses,
      students: uniqueStudents,
      avgMinutes,
      peakHour
    },
    byType,
    byTeacher,
    byGrade
  };
}

export async function generatePassExportData(options: ReportOptions): Promise<PassExportRow[]> {
  const accessibleGradeIds = await getAccessibleGradeIds(options);
  const conditions = buildBaseConditions(options, accessibleGradeIds);
  
  const passesData = await db
    .select({
      id: passes.id,
      studentName: passes.studentName,
      studentCode: students.studentCode,
      gradeName: grades.name,
      type: passes.type,
      customReason: passes.customReason,
      issuedByEmail: users.email,
      startsAt: passes.startsAt,
      endsAt: passes.endsAt,
      status: passes.status,
    })
    .from(passes)
    .leftJoin(students, eq(passes.studentId, students.id))
    .leftJoin(grades, eq(students.gradeId, grades.id))
    .leftJoin(users, eq(passes.issuedByUserId, users.id))
    .where(and(...conditions))
    .orderBy(desc(passes.startsAt));
  
  return passesData.map(p => {
    const end = p.endsAt || new Date();
    const start = p.startsAt;
    const durationMinutes = Math.round((end.getTime() - start.getTime()) / (1000 * 60));
    
    return {
      id: p.id,
      studentName: p.studentName,
      studentCode: p.studentCode || undefined,
      gradeName: p.gradeName || undefined,
      type: p.type,
      customReason: p.customReason || undefined,
      issuedBy: p.issuedByEmail || 'Unknown',
      startsAt: p.startsAt,
      endsAt: p.endsAt || undefined,
      durationMinutes,
      status: p.status
    };
  });
}