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

// Schools table
export const schools = pgTable("schools", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: varchar("name").notNull(),
  seatsAllowed: integer("seats_allowed").notNull().default(100),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Users table (updated for multi-school support)
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"), // For local auth if needed, nullable for OIDC users
  role: varchar("role").notNull().default("teacher"), // "admin", "teacher"
  schoolId: varchar("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"), 
  profileImageUrl: varchar("profile_image_url"),
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Kiosk devices table
export const kioskDevices = pgTable("kiosk_devices", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  schoolId: varchar("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  room: varchar("room").notNull(),
  pinHash: varchar("pin_hash"), // Hashed PIN for kiosk access, nullable if PIN not required
  token: varchar("token").notNull().unique(), // Unique token for device authentication
  active: boolean("active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Passes table (simplified as per requirements)
export const passes = pgTable("passes", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  studentName: varchar("student_name").notNull(),
  reason: varchar("reason").notNull(), // e.g., "Bathroom", "Nurse", "Office"
  issuedByUserId: varchar("issued_by_user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  schoolId: varchar("school_id").notNull().references(() => schools.id, { onDelete: "cascade" }),
  status: varchar("status").notNull().default("active"), // "active", "returned", "expired"
  startsAt: timestamp("starts_at").notNull().defaultNow(),
  endsAt: timestamp("ends_at"), // nullable - passes can be open-ended
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Relations
export const schoolsRelations = relations(schools, ({ many }) => ({
  users: many(users),
  kioskDevices: many(kioskDevices),
  passes: many(passes),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  school: one(schools, {
    fields: [users.schoolId],
    references: [schools.id],
  }),
  passes: many(passes),
}));

export const kioskDevicesRelations = relations(kioskDevices, ({ one }) => ({
  school: one(schools, {
    fields: [kioskDevices.schoolId],
    references: [schools.id],
  }),
}));

export const passesRelations = relations(passes, ({ one }) => ({
  issuedByUser: one(users, {
    fields: [passes.issuedByUserId],
    references: [users.id],
  }),
  school: one(schools, {
    fields: [passes.schoolId],
    references: [schools.id],
  }),
}));

// Insert schemas
export const insertSchoolSchema = createInsertSchema(schools).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertKioskDeviceSchema = createInsertSchema(kioskDevices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPassSchema = createInsertSchema(passes).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  startsAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type School = typeof schools.$inferSelect;
export type InsertSchool = z.infer<typeof insertSchoolSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type KioskDevice = typeof kioskDevices.$inferSelect;
export type InsertKioskDevice = z.infer<typeof insertKioskDeviceSchema>;
export type Pass = typeof passes.$inferSelect;
export type InsertPass = z.infer<typeof insertPassSchema>;

// Extended types with relations
export type PassWithDetails = Pass & {
  issuedByUser: User;
  school: School;
};

export type UserWithSchool = User & {
  school: School;
};
