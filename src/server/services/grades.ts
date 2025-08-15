import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import { grades, teacherGradeMap } from '@shared/schema';

export class GradesService {
  // Get all grades for a school
  static async getGradesBySchool(schoolId: number) {
    return await db.select().from(grades).where(eq(grades.schoolId, schoolId));
  }

  // Create a new grade
  static async createGrade(schoolId: number, name: string) {
    const [grade] = await db
      .insert(grades)
      .values({ schoolId, name })
      .returning();
    return grade;
  }

  // Get grades assigned to a teacher
  static async getTeacherGrades(userId: number, schoolId: number) {
    return await db
      .select({
        id: grades.id,
        name: grades.name,
        schoolId: grades.schoolId,
        createdAt: grades.createdAt
      })
      .from(teacherGradeMap)
      .innerJoin(grades, eq(teacherGradeMap.gradeId, grades.id))
      .where(
        and(
          eq(teacherGradeMap.userId, userId),
          eq(teacherGradeMap.schoolId, schoolId)
        )
      );
  }

  // Assign a grade to a teacher
  static async assignGradeToTeacher(userId: number, schoolId: number, gradeId: number) {
    const [assignment] = await db
      .insert(teacherGradeMap)
      .values({ userId, schoolId, gradeId })
      .returning();
    return assignment;
  }

  // Remove grade assignment from teacher
  static async removeGradeFromTeacher(userId: number, schoolId: number, gradeId: number) {
    await db
      .delete(teacherGradeMap)
      .where(
        and(
          eq(teacherGradeMap.userId, userId),
          eq(teacherGradeMap.schoolId, schoolId),
          eq(teacherGradeMap.gradeId, gradeId)
        )
      );
  }
}