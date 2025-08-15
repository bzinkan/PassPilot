import { z } from "zod";

// Common schemas
export const IdParams = z.object({
  id: z.string().uuid(),
});

export const SchoolIdParams = z.object({
  schoolId: z.string().uuid(),
});

// School schemas
export const CreateSchoolBody = z.object({
  name: z.string().min(2).max(100),
  seatsAllowed: z.number().int().min(1).max(10000).optional(),
});

// User schemas  
export const CreateUserBody = z.object({
  email: z.string().email(),
  role: z.enum(["admin", "teacher"]).optional(),
  schoolId: z.string().uuid(),
  firstName: z.string().min(1).max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
});

// Kiosk device schemas
export const CreateKioskDeviceBody = z.object({
  schoolId: z.string().uuid(),
  room: z.string().min(1).max(50),
  pinHash: z.string().optional(),
  token: z.string().min(10),
});

export const KioskDevicesBySchoolParams = z.object({
  schoolId: z.string().uuid(),
});

// Pass schemas
export const CreatePassBody = z.object({
  studentName: z.string().min(1).max(100),
  reason: z.enum(["Bathroom", "Nurse", "Office", "Water", "Other"]),
});

export const ReturnPassParams = z.object({
  id: z.string().uuid(),
});

export const GetPassesQuery = z.object({
  limit: z.string().transform(val => parseInt(val)).pipe(z.number().int().min(1).max(1000)).optional(),
});

// Statistics schemas
export const GetStatisticsQuery = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

// Kiosk pass creation schema
export const CreateKioskPassBody = z.object({
  studentName: z.string().min(1).max(100),
  reason: z.enum(["Bathroom", "Nurse", "Office", "Water", "Other"]),
  kioskToken: z.string().min(10),
});

// Registration schema (for future use)
export const RegisterBody = z.object({
  schoolName: z.string().min(2).max(100),
  adminEmail: z.string().email(),
  plan: z.enum(["TRIAL", "BASIC", "SMALL", "MEDIUM", "LARGE", "UNLIMITED"]).optional(),
});