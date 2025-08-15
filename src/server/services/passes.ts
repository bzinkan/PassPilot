import { db } from '../db/client';
import { passes, students, grades, users, teacherGradeMap } from '@shared/schema';
import { and, desc, eq, inArray, gte, lte, or } from 'drizzle-orm';

// Enhanced pass creation supporting both structured students and legacy names
export async function createPass(params: {
  studentId?: number;
  studentName?: string;
  reason?: string;
  type?: string;
  customReason?: string;
  issuedByUserId: number;
  schoolId: number;
  issuedVia?: string;
  kioskDeviceId?: number;
}) {
  let finalStudentName = params.studentName;
  
  // If studentId is provided, validate it exists and check for active passes
  if (params.studentId) {
    const [student] = await db.select({ name: students.name })
      .from(students)
      .where(and(
        eq(students.id, params.studentId),
        eq(students.schoolId, params.schoolId)
      ));
    
    if (!student) {
      throw new Error('Student not found');
    }
    
    // Check for existing active pass (the database constraint will also catch this)
    const [existingPass] = await db.select({ id: passes.id })
      .from(passes)
      .where(and(
        eq(passes.studentId, params.studentId),
        eq(passes.status, 'active')
      ));
    
    if (existingPass) {
      throw new Error('Student already has an active pass');
    }
    
    finalStudentName = student.name;
  }
  
  // Ensure we have a student name (required field)
  if (!finalStudentName) {
    throw new Error('Student name is required');
  }
  
  try {
    const [row] = await db.insert(passes).values({
      studentId: params.studentId,
      studentName: finalStudentName,
      reason: params.reason,
      type: params.type || 'general',
      customReason: params.customReason,
      issuedByUserId: params.issuedByUserId,
      schoolId: params.schoolId,
      issuedVia: params.issuedVia || 'general',
      kioskDeviceId: params.kioskDeviceId
    }).returning();
    return row;
  } catch (error: any) {
    // Handle the unique constraint violation
    if (error.message?.includes('uniq_active_pass_per_student')) {
      throw new Error('Student already has an active pass');
    }
    throw error;
  }
}

// List passes with filtering options
export async function listPasses(options: {
  schoolId: number;
  scope: 'mine' | 'school';
  status?: 'active' | 'returned';
  teacherUserId?: number;
  from?: Date;
  to?: Date;
}) {
  let query = db
    .select({
      id: passes.id,
      studentId: passes.studentId,
      studentName: passes.studentName,
      reason: passes.reason,
      type: passes.type,
      customReason: passes.customReason,
      issuedByUserId: passes.issuedByUserId,
      schoolId: passes.schoolId,
      status: passes.status,
      startsAt: passes.startsAt,
      endsAt: passes.endsAt,
      // Student info (if linked to structured student)
      structuredStudentName: students.name,
      studentCode: students.studentCode,
      gradeId: students.gradeId,
      gradeName: grades.name,
      // Issuer info
      issuedByEmail: users.email
    })
    .from(passes)
    .leftJoin(students, eq(passes.studentId, students.id))
    .leftJoin(grades, eq(students.gradeId, grades.id))
    .leftJoin(users, eq(passes.issuedByUserId, users.id));

  // Build conditions array
  const conditions = [eq(passes.schoolId, options.schoolId)];

  // Status filter
  if (options.status) {
    conditions.push(eq(passes.status, options.status));
  }

  // Date range filter
  if (options.from) {
    conditions.push(gte(passes.startsAt, options.from));
  }
  if (options.to) {
    conditions.push(lte(passes.startsAt, options.to));
  }

  // Scope filtering
  if (options.scope === 'mine' && options.teacherUserId) {
    // Get teacher's selected grades
    const teacherGrades = await db
      .select({ gradeId: teacherGradeMap.gradeId })
      .from(teacherGradeMap)
      .where(and(
        eq(teacherGradeMap.userId, options.teacherUserId),
        eq(teacherGradeMap.schoolId, options.schoolId)
      ));

    if (teacherGrades.length > 0) {
      const gradeIds = teacherGrades.map(tg => tg.gradeId);
      // Include passes for students in teacher's grades OR legacy passes issued by this teacher
      conditions.push(
        or(
          inArray(students.gradeId, gradeIds),
          eq(passes.issuedByUserId, options.teacherUserId)
        )
      );
    } else {
      // No grades selected, only show passes issued by this teacher
      conditions.push(eq(passes.issuedByUserId, options.teacherUserId));
    }
  }

  return query
    .where(and(...conditions))
    .orderBy(desc(passes.startsAt));
}

// Legacy function for backwards compatibility
export async function listActivePasses(schoolId: number) {
  return listPasses({ schoolId, scope: 'school', status: 'active' });
}

// Return a pass by ID (idempotent)
export async function returnPass(passId: number, schoolId: number) {
  // First check if pass exists and belongs to school
  const [existingPass] = await db.select()
    .from(passes)
    .where(and(eq(passes.id, passId), eq(passes.schoolId, schoolId)));
  
  if (!existingPass) return null;
  
  // If already returned, return the existing pass (idempotent)
  if (existingPass.status === 'returned') {
    return existingPass;
  }
  
  // Update the pass to returned status
  const [row] = await db
    .update(passes)
    .set({ status: 'returned', endsAt: new Date() })
    .where(eq(passes.id, passId))
    .returning();
  
  return row;
}

// Get all passes (active and returned) with full information
export async function getAllPasses(schoolId: number) {
  return db
    .select({
      id: passes.id,
      studentId: passes.studentId,
      studentName: passes.studentName,
      reason: passes.reason,
      type: passes.type,
      customReason: passes.customReason,
      issuedByUserId: passes.issuedByUserId,
      schoolId: passes.schoolId,
      status: passes.status,
      startsAt: passes.startsAt,
      endsAt: passes.endsAt,
      // Student info (if linked to structured student)
      structuredStudentName: students.name,
      studentCode: students.studentCode,
      gradeId: students.gradeId,
      gradeName: grades.name,
      // Issuer info
      issuedByEmail: users.email
    })
    .from(passes)
    .leftJoin(students, eq(passes.studentId, students.id))
    .leftJoin(grades, eq(students.gradeId, grades.id))
    .leftJoin(users, eq(passes.issuedByUserId, users.id))
    .where(eq(passes.schoolId, schoolId))
    .orderBy(desc(passes.startsAt));
}