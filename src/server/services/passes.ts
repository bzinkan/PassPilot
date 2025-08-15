import { db } from '../db/client';
import { passes } from '../db/schema';
import { and, desc, eq } from 'drizzle-orm';

export async function createPass(params: { studentName: string; reason: string; issuedByUserId: number; schoolId: number; }) {
  const [row] = await db.insert(passes).values(params).returning();
  return row;
}

export async function listActivePasses(schoolId: number) {
  return db.select().from(passes).where(and(eq(passes.schoolId, schoolId), eq(passes.status, 'active'))).orderBy(desc(passes.startsAt));
}

export async function returnPass(id: number, schoolId: number) {
  const [row] = await db.update(passes).set({ status: 'returned', endsAt: new Date() }).where(and(eq(passes.id, id), eq(passes.schoolId, schoolId), eq(passes.status, 'active'))).returning();
  return row ?? null; // idempotent-ish: returns null if already returned or wrong school
}