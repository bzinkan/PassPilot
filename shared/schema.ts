import { sql, relations } from 'drizzle-orm';
import {
  index,
  jsonb,
  pgTable,
  timestamp,
  varchar,
  text,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Grade levels table
export const grades = pgTable("grades", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // e.g., "Grade 6th", "Grade 7th"
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Students table
export const students = pgTable("students", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  studentId: varchar("student_id"),
  gradeId: varchar("grade_id").notNull().references(() => grades.id),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pass types
export const passTypes = pgTable("pass_types", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(), // e.g., "Bathroom", "Nurse", "Office"
  icon: varchar("icon").notNull(), // FontAwesome icon class
  color: varchar("color").notNull(), // Tailwind color class
  isDefault: boolean("is_default").default(false),
});

// Passes table for tracking student movements
export const passes = pgTable("passes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentId: varchar("student_id").notNull().references(() => students.id),
  passTypeId: varchar("pass_type_id").notNull().references(() => passTypes.id),
  teacherId: varchar("teacher_id").notNull().references(() => users.id),
  issuedAt: timestamp("issued_at").defaultNow(),
  returnedAt: timestamp("returned_at"),
  duration: integer("duration"), // in minutes
  status: varchar("status").notNull().default("out"), // "out", "returned", "overdue"
  notes: text("notes"),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  grades: many(grades),
  passes: many(passes),
}));

export const gradesRelations = relations(grades, ({ one, many }) => ({
  teacher: one(users, {
    fields: [grades.teacherId],
    references: [users.id],
  }),
  students: many(students),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  grade: one(grades, {
    fields: [students.gradeId],
    references: [grades.id],
  }),
  passes: many(passes),
}));

export const passTypesRelations = relations(passTypes, ({ many }) => ({
  passes: many(passes),
}));

export const passesRelations = relations(passes, ({ one }) => ({
  student: one(students, {
    fields: [passes.studentId],
    references: [students.id],
  }),
  passType: one(passTypes, {
    fields: [passes.passTypeId],
    references: [passTypes.id],
  }),
  teacher: one(users, {
    fields: [passes.teacherId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertGradeSchema = createInsertSchema(grades).omit({
  id: true,
  createdAt: true,
});

export const insertStudentSchema = createInsertSchema(students).omit({
  id: true,
  createdAt: true,
});

export const insertPassTypeSchema = createInsertSchema(passTypes).omit({
  id: true,
});

export const insertPassSchema = createInsertSchema(passes).omit({
  id: true,
  issuedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Grade = typeof grades.$inferSelect;
export type InsertGrade = z.infer<typeof insertGradeSchema>;
export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type PassType = typeof passTypes.$inferSelect;
export type InsertPassType = z.infer<typeof insertPassTypeSchema>;
export type Pass = typeof passes.$inferSelect;
export type InsertPass = z.infer<typeof insertPassSchema>;

// Extended types with relations
export type StudentWithGrade = Student & {
  grade: Grade;
};

export type PassWithDetails = Pass & {
  student: Student;
  passType: PassType;
  teacher: User;
};

export type GradeWithStudents = Grade & {
  students: Student[];
  teacher: User;
};
