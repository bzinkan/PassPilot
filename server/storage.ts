import {
  users,
  grades,
  students,
  passTypes,
  passes,
  type User,
  type UpsertUser,
  type Grade,
  type InsertGrade,
  type Student,
  type InsertStudent,
  type PassType,
  type InsertPassType,
  type Pass,
  type InsertPass,
  type StudentWithGrade,
  type PassWithDetails,
  type GradeWithStudents,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Grade operations
  createGrade(grade: InsertGrade): Promise<Grade>;
  getGradesByTeacher(teacherId: string): Promise<GradeWithStudents[]>;
  updateGrade(id: string, grade: Partial<InsertGrade>): Promise<Grade>;
  deleteGrade(id: string): Promise<void>;

  // Student operations
  createStudent(student: InsertStudent): Promise<Student>;
  getStudentsByGrade(gradeId: string): Promise<StudentWithGrade[]>;
  getStudentByIdOrName(gradeId: string, idOrName: string): Promise<Student | undefined>;
  createStudentsBulk(students: InsertStudent[]): Promise<Student[]>;
  deleteStudent(id: string): Promise<void>;

  // Pass type operations
  getPassTypes(): Promise<PassType[]>;
  createPassType(passType: InsertPassType): Promise<PassType>;

  // Pass operations
  createPass(pass: InsertPass): Promise<Pass>;
  getActivePassesByTeacher(teacherId: string): Promise<PassWithDetails[]>;
  getPassesByTeacher(teacherId: string, limit?: number): Promise<PassWithDetails[]>;
  markPassReturned(passId: string): Promise<Pass>;
  getPassStatistics(teacherId: string, dateRange?: { from: Date; to: Date }): Promise<{
    totalPasses: number;
    avgDuration: number;
    peakHour: number;
    activeStudents: number;
    passTypeBreakdown: { type: string; count: number }[];
  }>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Grade operations
  async createGrade(grade: InsertGrade): Promise<Grade> {
    const [newGrade] = await db.insert(grades).values(grade).returning();
    return newGrade;
  }

  async getGradesByTeacher(teacherId: string): Promise<GradeWithStudents[]> {
    const result = await db
      .select()
      .from(grades)
      .leftJoin(students, eq(grades.id, students.gradeId))
      .leftJoin(users, eq(grades.teacherId, users.id))
      .where(and(eq(grades.teacherId, teacherId), eq(grades.isActive, true)));

    const gradesMap = new Map<string, GradeWithStudents>();
    
    result.forEach((row) => {
      const grade = row.grades;
      const student = row.students;
      const teacher = row.users;

      if (!gradesMap.has(grade.id)) {
        gradesMap.set(grade.id, {
          ...grade,
          students: [],
          teacher: teacher!,
        });
      }

      if (student && student.isActive) {
        gradesMap.get(grade.id)!.students.push(student);
      }
    });

    return Array.from(gradesMap.values());
  }

  async updateGrade(id: string, grade: Partial<InsertGrade>): Promise<Grade> {
    const [updatedGrade] = await db
      .update(grades)
      .set(grade)
      .where(eq(grades.id, id))
      .returning();
    return updatedGrade;
  }

  async deleteGrade(id: string): Promise<void> {
    await db.update(grades).set({ isActive: false }).where(eq(grades.id, id));
  }

  // Student operations
  async createStudent(student: InsertStudent): Promise<Student> {
    const [newStudent] = await db.insert(students).values(student).returning();
    return newStudent;
  }

  async getStudentsByGrade(gradeId: string): Promise<StudentWithGrade[]> {
    const result = await db
      .select()
      .from(students)
      .innerJoin(grades, eq(students.gradeId, grades.id))
      .where(and(eq(students.gradeId, gradeId), eq(students.isActive, true)));

    return result.map(row => ({
      ...row.students,
      grade: row.grades,
    }));
  }

  async getStudentByIdOrName(gradeId: string, idOrName: string): Promise<Student | undefined> {
    const [student] = await db
      .select()
      .from(students)
      .where(
        and(
          eq(students.gradeId, gradeId),
          eq(students.isActive, true),
          sql`(${students.studentId} = ${idOrName} OR LOWER(${students.name}) LIKE LOWER(${'%' + idOrName + '%'}))`
        )
      );
    return student;
  }

  async createStudentsBulk(studentData: InsertStudent[]): Promise<Student[]> {
    const newStudents = await db.insert(students).values(studentData).returning();
    return newStudents;
  }

  async deleteStudent(id: string): Promise<void> {
    await db.update(students).set({ isActive: false }).where(eq(students.id, id));
  }

  // Pass type operations
  async getPassTypes(): Promise<PassType[]> {
    return await db.select().from(passTypes);
  }

  async createPassType(passType: InsertPassType): Promise<PassType> {
    const [newPassType] = await db.insert(passTypes).values(passType).returning();
    return newPassType;
  }

  // Pass operations
  async createPass(pass: InsertPass): Promise<Pass> {
    const [newPass] = await db.insert(passes).values(pass).returning();
    return newPass;
  }

  async getActivePassesByTeacher(teacherId: string): Promise<PassWithDetails[]> {
    const result = await db
      .select()
      .from(passes)
      .innerJoin(students, eq(passes.studentId, students.id))
      .innerJoin(passTypes, eq(passes.passTypeId, passTypes.id))
      .innerJoin(users, eq(passes.teacherId, users.id))
      .innerJoin(grades, eq(students.gradeId, grades.id))
      .where(
        and(
          eq(passes.teacherId, teacherId),
          isNull(passes.returnedAt),
          eq(grades.teacherId, teacherId)
        )
      )
      .orderBy(desc(passes.issuedAt));

    return result.map(row => ({
      ...row.passes,
      student: row.students,
      passType: row.pass_types,
      teacher: row.users,
    }));
  }

  async getPassesByTeacher(teacherId: string, limit = 50): Promise<PassWithDetails[]> {
    const result = await db
      .select()
      .from(passes)
      .innerJoin(students, eq(passes.studentId, students.id))
      .innerJoin(passTypes, eq(passes.passTypeId, passTypes.id))
      .innerJoin(users, eq(passes.teacherId, users.id))
      .innerJoin(grades, eq(students.gradeId, grades.id))
      .where(
        and(
          eq(passes.teacherId, teacherId),
          eq(grades.teacherId, teacherId)
        )
      )
      .orderBy(desc(passes.issuedAt))
      .limit(limit);

    return result.map(row => ({
      ...row.passes,
      student: row.students,
      passType: row.pass_types,
      teacher: row.users,
    }));
  }

  async markPassReturned(passId: string): Promise<Pass> {
    const returnedAt = new Date();
    const [pass] = await db.select().from(passes).where(eq(passes.id, passId));
    
    const duration = Math.floor((returnedAt.getTime() - pass.issuedAt.getTime()) / (1000 * 60));
    
    const [updatedPass] = await db
      .update(passes)
      .set({ 
        returnedAt, 
        duration, 
        status: "returned" 
      })
      .where(eq(passes.id, passId))
      .returning();
      
    return updatedPass;
  }

  async getPassStatistics(teacherId: string, dateRange?: { from: Date; to: Date }) {
    const baseQuery = db
      .select()
      .from(passes)
      .innerJoin(students, eq(passes.studentId, students.id))
      .innerJoin(passTypes, eq(passes.passTypeId, passTypes.id))
      .innerJoin(grades, eq(students.gradeId, grades.id))
      .where(
        and(
          eq(passes.teacherId, teacherId),
          eq(grades.teacherId, teacherId),
          dateRange ? sql`${passes.issuedAt} >= ${dateRange.from}` : undefined,
          dateRange ? sql`${passes.issuedAt} <= ${dateRange.to}` : undefined
        )
      );

    const allPasses = await baseQuery;
    
    const totalPasses = allPasses.length;
    const avgDuration = totalPasses > 0 
      ? Math.floor(allPasses.reduce((sum, p) => sum + (p.passes.duration || 0), 0) / totalPasses)
      : 0;

    // Calculate peak hour
    const hourCounts = new Array(24).fill(0);
    allPasses.forEach(p => {
      const hour = p.passes.issuedAt.getHours();
      hourCounts[hour]++;
    });
    const peakHour = hourCounts.indexOf(Math.max(...hourCounts));

    // Get active students count
    const activeStudentsResult = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${students.id})` })
      .from(students)
      .innerJoin(grades, eq(students.gradeId, grades.id))
      .where(
        and(
          eq(grades.teacherId, teacherId),
          eq(students.isActive, true)
        )
      );

    // Pass type breakdown
    const passTypeBreakdown = allPasses.reduce((acc, p) => {
      const typeName = p.pass_types.name;
      const existing = acc.find(item => item.type === typeName);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ type: typeName, count: 1 });
      }
      return acc;
    }, [] as { type: string; count: number }[]);

    return {
      totalPasses,
      avgDuration,
      peakHour,
      activeStudents: activeStudentsResult[0].count,
      passTypeBreakdown,
    };
  }
}

export const storage = new DatabaseStorage();
