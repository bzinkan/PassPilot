import {
  users,
  schools,
  kioskDevices,
  passes,
  type User,
  type UpsertUser,
  type School,
  type InsertSchool,
  type InsertUser,
  type KioskDevice,
  type InsertKioskDevice,
  type Pass,
  type InsertPass,
  type PassWithDetails,
  type UserWithSchool,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, isNull, sql } from "drizzle-orm";

export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

  // School operations
  createSchool(school: InsertSchool): Promise<School>;
  getSchool(id: string): Promise<School | undefined>;
  
  // Kiosk device operations
  createKioskDevice(device: InsertKioskDevice): Promise<KioskDevice>;
  getKioskDeviceByToken(token: string): Promise<KioskDevice | undefined>;
  getKioskDevicesBySchool(schoolId: string): Promise<KioskDevice[]>;

  // Pass operations
  createPass(pass: InsertPass): Promise<Pass>;
  getActivePassesBySchool(schoolId: string): Promise<PassWithDetails[]>;
  getPassesBySchool(schoolId: string, limit?: number): Promise<PassWithDetails[]>;
  markPassReturned(passId: string): Promise<Pass>;
  getPassStatistics(schoolId: string, dateRange?: { from: Date; to: Date }): Promise<{
    totalPasses: number;
    avgDuration: number;
    activeCount: number;
    reasonBreakdown: { reason: string; count: number }[];
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
    if (!user) {
      throw new Error("Failed to create/update user");
    }
    return user;
  }

  // School operations
  async createSchool(school: InsertSchool): Promise<School> {
    const [newSchool] = await db.insert(schools).values(school).returning();
    if (!newSchool) {
      throw new Error("Failed to create school");
    }
    return newSchool;
  }

  async getSchool(id: string): Promise<School | undefined> {
    const [school] = await db.select().from(schools).where(eq(schools.id, id));
    return school;
  }

  // Kiosk device operations
  async createKioskDevice(device: InsertKioskDevice): Promise<KioskDevice> {
    const [newDevice] = await db.insert(kioskDevices).values(device).returning();
    if (!newDevice) {
      throw new Error("Failed to create kiosk device");
    }
    return newDevice;
  }

  async getKioskDeviceByToken(token: string): Promise<KioskDevice | undefined> {
    const [device] = await db
      .select()
      .from(kioskDevices)
      .where(and(eq(kioskDevices.token, token), eq(kioskDevices.active, true)));
    return device;
  }

  async getKioskDevicesBySchool(schoolId: string): Promise<KioskDevice[]> {
    return await db
      .select()
      .from(kioskDevices)
      .where(and(eq(kioskDevices.schoolId, schoolId), eq(kioskDevices.active, true)));
  }

  // Pass operations
  async createPass(pass: InsertPass): Promise<Pass> {
    const [newPass] = await db.insert(passes).values(pass).returning();
    if (!newPass) {
      throw new Error("Failed to create pass");
    }
    return newPass;
  }

  async getActivePassesBySchool(schoolId: string): Promise<PassWithDetails[]> {
    const result = await db
      .select()
      .from(passes)
      .innerJoin(users, eq(passes.issuedByUserId, users.id))
      .innerJoin(schools, eq(passes.schoolId, schools.id))
      .where(
        and(
          eq(passes.schoolId, schoolId),
          eq(passes.status, "active")
        )
      )
      .orderBy(desc(passes.startsAt));

    return result.map(row => ({
      ...row.passes,
      issuedByUser: row.users,
      school: row.schools,
    }));
  }

  async getPassesBySchool(schoolId: string, limit = 50): Promise<PassWithDetails[]> {
    const result = await db
      .select()
      .from(passes)
      .innerJoin(users, eq(passes.issuedByUserId, users.id))
      .innerJoin(schools, eq(passes.schoolId, schools.id))
      .where(eq(passes.schoolId, schoolId))
      .orderBy(desc(passes.startsAt))
      .limit(limit);

    return result.map(row => ({
      ...row.passes,
      issuedByUser: row.users,
      school: row.schools,
    }));
  }

  async markPassReturned(passId: string): Promise<Pass> {
    const [updatedPass] = await db
      .update(passes)
      .set({ 
        status: "returned",
        endsAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(passes.id, passId))
      .returning();
      
    if (!updatedPass) {
      throw new Error("Failed to mark pass as returned");
    }
    return updatedPass;
  }

  async getPassStatistics(schoolId: string, dateRange?: { from: Date; to: Date }) {
    const allPasses = await db
      .select()
      .from(passes)
      .where(
        and(
          eq(passes.schoolId, schoolId),
          dateRange ? sql`${passes.startsAt} >= ${dateRange.from}` : undefined,
          dateRange ? sql`${passes.startsAt} <= ${dateRange.to}` : undefined
        )
      );
    
    const totalPasses = allPasses.length;
    
    // Calculate average duration
    const passesWithDuration = allPasses.filter(p => p.endsAt && p.startsAt);
    const avgDuration = passesWithDuration.length > 0 
      ? Math.floor(passesWithDuration.reduce((sum, p) => {
          const duration = (p.endsAt!.getTime() - p.startsAt.getTime()) / (1000 * 60);
          return sum + duration;
        }, 0) / passesWithDuration.length)
      : 0;

    // Count active passes
    const activeCount = allPasses.filter(p => p.status === "active").length;

    // Reason breakdown
    const reasonBreakdown = allPasses.reduce((acc, p) => {
      const existing = acc.find(item => item.reason === p.reason);
      if (existing) {
        existing.count++;
      } else {
        acc.push({ reason: p.reason, count: 1 });
      }
      return acc;
    }, [] as { reason: string; count: number }[]);

    return {
      totalPasses,
      avgDuration,
      activeCount,
      reasonBreakdown,
    };
  }
}

export const storage = new DatabaseStorage();
