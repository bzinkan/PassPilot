import { eq, and } from 'drizzle-orm';
import { db } from '../db/client';
import { students, grades } from '@shared/schema';

export class StudentsService {
  // Get all students for a school
  static async getStudentsBySchool(schoolId: number) {
    return await db
      .select({
        id: students.id,
        name: students.name,
        studentCode: students.studentCode,
        schoolId: students.schoolId,
        gradeId: students.gradeId,
        gradeName: grades.name,
        createdAt: students.createdAt
      })
      .from(students)
      .innerJoin(grades, eq(students.gradeId, grades.id))
      .where(eq(students.schoolId, schoolId));
  }

  // Get students by grade
  static async getStudentsByGrade(gradeId: number, schoolId: number) {
    return await db
      .select()
      .from(students)
      .where(
        and(
          eq(students.gradeId, gradeId),
          eq(students.schoolId, schoolId)
        )
      );
  }

  // Create a new student
  static async createStudent(
    schoolId: number, 
    gradeId: number, 
    name: string, 
    studentCode?: string
  ) {
    const [student] = await db
      .insert(students)
      .values({ schoolId, gradeId, name, studentCode })
      .returning();
    return student;
  }

  // Get student by ID
  static async getStudentById(id: number, schoolId: number) {
    const [student] = await db
      .select({
        id: students.id,
        name: students.name,
        studentCode: students.studentCode,
        schoolId: students.schoolId,
        gradeId: students.gradeId,
        gradeName: grades.name,
        createdAt: students.createdAt
      })
      .from(students)
      .innerJoin(grades, eq(students.gradeId, grades.id))
      .where(
        and(
          eq(students.id, id),
          eq(students.schoolId, schoolId)
        )
      );
    return student;
  }

  // Update student
  static async updateStudent(
    id: number, 
    schoolId: number, 
    updates: { name?: string; gradeId?: number; studentCode?: string }
  ) {
    const [student] = await db
      .update(students)
      .set(updates)
      .where(
        and(
          eq(students.id, id),
          eq(students.schoolId, schoolId)
        )
      )
      .returning();
    return student;
  }

  // Delete student
  static async deleteStudent(id: number, schoolId: number) {
    await db
      .delete(students)
      .where(
        and(
          eq(students.id, id),
          eq(students.schoolId, schoolId)
        )
      );
  }

  // Bulk create students from CSV data
  static async bulkCreateStudents(
    schoolId: number,
    studentsData: Array<{ gradeId: number; name: string; studentCode?: string }>
  ) {
    if (studentsData.length === 0) return [];
    
    const studentsToInsert = studentsData.map(student => ({
      ...student,
      schoolId
    }));

    return await db
      .insert(students)
      .values(studentsToInsert)
      .returning();
  }
}