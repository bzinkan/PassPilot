import { db } from '../db/client';
import { users, type Role } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

export async function createUser(params: { email: string; password: string; role: Role; schoolId: number; active?: boolean; }) {
  const passwordHash = await bcrypt.hash(params.password, 10);
  const [row] = await db.insert(users).values({
    email: params.email.toLowerCase(),
    passwordHash,
    role: params.role,
    schoolId: params.schoolId,
    active: params.active ?? true
  }).returning();
  return row;
}

export async function findUserByEmailSchool(email: string, schoolId: number) {
  const [row] = await db.select({
    id: users.id,
    email: users.email,
    passwordHash: users.passwordHash,
    role: users.role,
    schoolId: users.schoolId,
    active: users.active,
    createdAt: users.createdAt
  }).from(users).where(and(eq(users.email, email.toLowerCase()), eq(users.schoolId, schoolId)));
  return row ?? null;
}