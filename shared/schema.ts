import { pgTable, serial, varchar, boolean, integer, timestamp, text } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

export const schools = pgTable('schools', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 120 }).notNull(),
  seatsAllowed: integer('seats_allowed').notNull().default(50),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export type Role = 'teacher' | 'admin' | 'superadmin';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  schoolId: integer('school_id').references(() => schools.id).notNull(),
  displayName: varchar('display_name', { length: 120 }),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const kioskDevices = pgTable('kiosk_devices', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').references(() => schools.id).notNull(),
  room: varchar('room', { length: 80 }).notNull(),
  pinHash: varchar('pin_hash', { length: 255 }).notNull(),
  token: varchar('token', { length: 255 }).notNull().unique(),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

// === Grades (per school) ===
export const grades = pgTable('grades', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').references(() => schools.id).notNull(),
  name: varchar('name', { length: 80 }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// === Students (belong to a grade & school) ===
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  schoolId: integer('school_id').references(() => schools.id).notNull(),
  gradeId: integer('grade_id').references(() => grades.id).notNull(),
  name: varchar('name', { length: 140 }).notNull(),
  studentCode: varchar('student_code', { length: 80 }), // optional external ID
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

// === Teacher ↔ Grade selections (Roster tabs a teacher has chosen) ===
export const teacherGradeMap = pgTable('teacher_grade_map', {
  userId: integer('user_id').references(() => users.id).notNull(),
  schoolId: integer('school_id').references(() => schools.id).notNull(),
  gradeId: integer('grade_id').references(() => grades.id).notNull(),
});

// === Passes table (enhanced with backward compatibility) ===
export const passes = pgTable('passes', {
  id: serial('id').primaryKey(),
  // Enhanced fields (to be added)
  studentId: integer('student_id').references(() => students.id),
  // Legacy fields (current database) - now nullable for enhanced pass creation
  studentName: varchar('student_name', { length: 140 }),
  reason: varchar('reason', { length: 200 }),
  // New structured fields (to be added)
  type: varchar('type', { length: 20 }).default('general'), // 'general'|'nurse'|'discipline'|'custom'
  customReason: varchar('custom_reason', { length: 200 }),
  // Common fields
  issuedByUserId: integer('issued_by_user_id').references(() => users.id).notNull(),
  schoolId: integer('school_id').references(() => schools.id).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  // Kiosk integration fields
  issuedVia: varchar('issued_via', { length: 20 }).default('general'), // 'general'|'kiosk'
  kioskDeviceId: integer('kiosk_device_id').references(() => kioskDevices.id),
  startsAt: timestamp('starts_at', { withTimezone: true }).defaultNow().notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true }),
});

export const audits = pgTable('audits', {
  id: serial('id').primaryKey(),
  actorUserId: integer('actor_user_id').references(() => users.id),
  schoolId: integer('school_id'),
  action: varchar('action', { length: 80 }).notNull(),
  targetType: varchar('target_type', { length: 40 }).notNull(),
  targetId: integer('target_id'),
  data: text('data'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
});

export const userSettings = pgTable('user_settings', {
  userId: integer('user_id').primaryKey().references(() => users.id),
  lastActiveGradeId: integer('last_active_grade_id'),
  defaultPassType: varchar('default_pass_type', { length: 20 }).default('general'),
  theme: varchar('theme', { length: 20 }).default('light')
});

// Registration tokens table for secure user invitation flow
export const registrationTokens = pgTable('registration_tokens', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull(),
  schoolId: integer('school_id').references(() => schools.id).notNull(),
  role: varchar('role', { length: 20 }).notNull(),
  codeHash: varchar('code_hash', { length: 255 }).notNull(),
  createdByUserId: integer('created_by_user_id').references(() => users.id).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
  usedAt: timestamp('used_at', { withTimezone: true })
});

// Relations
export const schoolsRelations = relations(schools, ({ many }) => ({
  users: many(users),
  grades: many(grades),
  students: many(students),
  kioskDevices: many(kioskDevices),
  passes: many(passes),
  registrationTokens: many(registrationTokens)
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  school: one(schools, { fields: [users.schoolId], references: [schools.id] }),
  passesIssued: many(passes)
}));

export const gradesRelations = relations(grades, ({ one, many }) => ({
  school: one(schools, { fields: [grades.schoolId], references: [schools.id] }),
  students: many(students)
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  school: one(schools, { fields: [students.schoolId], references: [schools.id] }),
  grade: one(grades, { fields: [students.gradeId], references: [grades.id] }),
  passes: many(passes)
}));

export const passesRelations = relations(passes, ({ one }) => ({
  school: one(schools, { fields: [passes.schoolId], references: [schools.id] }),
  issuedBy: one(users, { fields: [passes.issuedByUserId], references: [users.id] }),
  student: one(students, { fields: [passes.studentId], references: [students.id] })
}));

export const teacherGradeMapRelations = relations(teacherGradeMap, ({ one }) => ({
  user: one(users, { fields: [teacherGradeMap.userId], references: [users.id] }),
  school: one(schools, { fields: [teacherGradeMap.schoolId], references: [schools.id] }),
  grade: one(grades, { fields: [teacherGradeMap.gradeId], references: [grades.id] })
}));

export const registrationTokensRelations = relations(registrationTokens, ({ one }) => ({
  school: one(schools, { fields: [registrationTokens.schoolId], references: [schools.id] }),
  createdBy: one(users, { fields: [registrationTokens.createdByUserId], references: [users.id] })
}));

// Type exports
export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type School = typeof schools.$inferSelect;
export type Pass = typeof passes.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Grade = typeof grades.$inferSelect;