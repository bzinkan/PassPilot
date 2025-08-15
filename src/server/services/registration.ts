import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db/client';
import { users, registrationTokens } from '@shared/schema';
import { eq, and, isNull, gt } from 'drizzle-orm';

export interface CreateInviteOptions {
  email: string;
  role: 'teacher' | 'admin';
  schoolId: number;
  createdByUserId: number;
  expiresInMinutes?: number;
}

export async function createInvite(options: CreateInviteOptions) {
  const code = crypto.randomBytes(3).toString('hex').toUpperCase(); // 6 char code
  const codeHash = await bcrypt.hash(code, 10);
  const expiresAt = new Date(Date.now() + (options.expiresInMinutes || 1440) * 60 * 1000);
  
  const [token] = await db.insert(registrationTokens).values({
    email: options.email.toLowerCase(),
    schoolId: options.schoolId,
    role: options.role,
    codeHash,
    createdByUserId: options.createdByUserId,
    expiresAt
  }).returning();
  
  return {
    token,
    code
  };
}

export async function verifyCode(code: string, codeHash: string): Promise<boolean> {
  try {
    return await bcrypt.compare(code, codeHash);
  } catch {
    return false;
  }
}

export function getInviteToken(tokenId: string): InviteToken | null {
  const token = inviteTokens.get(tokenId);
  if (!token || token.used || token.expiresAt < new Date()) {
    return null;
  }
  return token;
}

export function useInviteToken(tokenId: string): boolean {
  const token = inviteTokens.get(tokenId);
  if (!token || token.used || token.expiresAt < new Date()) {
    return false;
  }
  token.used = true;
  return true;
}

export async function validateInviteEmail(email: string, schoolId: number): Promise<boolean> {
  // Check if user already exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  
  return existingUser.length === 0;
}