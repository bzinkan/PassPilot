import { db } from '../db/client';
import { passes, students, grades, users } from '@shared/schema';
import { and, desc, eq } from 'drizzle-orm';

// Enhanced pass creation supporting both structured students and legacy names
export async function createPass(params: {
  studentId?: number;
  studentName?: string;
  reason?: string;
  type?: string;
  customReason?: string;
  issuedByUserId: number;
  schoolId: number;
}) {
  let finalStudentName = params.studentName;
  
  // If studentId is provided but no studentName, look up the student name
  if (params.studentId && !finalStudentName) {
    const [student] = await db.select({ name: students.name })
      .from(students)
      .where(eq(students.id, params.studentId));
    if (student) {
      finalStudentName = student.name;
    }
  }
  
  // Ensure we have a student name (required field)
  if (!finalStudentName) {
    throw new Error('Student name is required');
  }
  
  const [row] = await db.insert(passes).values({
    studentId: params.studentId,
    studentName: finalStudentName,
    reason: params.reason,
    type: params.type || 'general',
    customReason: params.customReason,
    issuedByUserId: params.issuedByUserId,
    schoolId: params.schoolId
  }).returning();
  return row;
}

// List active passes with student and grade information
export async function listActivePasses(schoolId: number) {
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
    .where(
      and(
        eq(passes.schoolId, schoolId),
        eq(passes.status, 'active')
      )
    )
    .orderBy(desc(passes.startsAt));
}

// Return a pass
export async function returnPass(id: number, schoolId: number) {
  const [row] = await db
    .update(passes)
    .set({ status: 'returned', endsAt: new Date() })
    .where(
      and(
        eq(passes.id, id),
        eq(passes.schoolId, schoolId),
        eq(passes.status, 'active')
      )
    )
    .returning();
  return row ?? null; // returns null if already returned or wrong school
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