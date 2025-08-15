import { db } from '../db/client';
import { schools } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function createSchool(name: string, seatsAllowed = 50) {
  const [row] = await db.insert(schools).values({ name, seatsAllowed }).returning();
  return row;
}

export async function getSchoolById(id: number) {
  const [row] = await db.select().from(schools).where(eq(schools.id, id));
  return row ?? null;
}