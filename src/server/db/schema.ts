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

export const passes = pgTable('passes', {
  id: serial('id').primaryKey(),
  studentName: varchar('student_name', { length: 140 }).notNull(),
  reason: varchar('reason', { length: 200 }).notNull(),
  issuedByUserId: integer('issued_by_user_id').references(() => users.id).notNull(),
  schoolId: integer('school_id').references(() => schools.id).notNull(),
  status: varchar('status', { length: 20 }).notNull().default('active'),
  startsAt: timestamp('starts_at', { withTimezone: true }).defaultNow().notNull(),
  endsAt: timestamp('ends_at', { withTimezone: true })
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

export const usersRelations = relations(users, ({ one }) => ({
  school: one(schools, { fields: [users.schoolId], references: [schools.id] })
}));