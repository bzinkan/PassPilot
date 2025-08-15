import crypto from 'crypto';
import { db } from '../db/client';
import { users } from '@shared/schema';
import { eq } from 'drizzle-orm';

// Simplified invite token storage (in production, use a proper tokens table)
interface InviteToken {
  id: string;
  email: string;
  role: 'teacher' | 'admin';
  schoolId: number;
  createdByUserId: number;
  expiresAt: Date;
  used: boolean;
}

// In-memory token storage (replace with database table in production)
const inviteTokens = new Map<string, InviteToken>();

export interface CreateInviteOptions {
  email: string;
  role: 'teacher' | 'admin';
  schoolId: number;
  createdByUserId: number;
  expiresInMinutes?: number;
}

export function createInvite(options: CreateInviteOptions) {
  const tokenId = crypto.randomUUID();
  const code = crypto.randomBytes(16).toString('hex').toUpperCase();
  const expiresAt = new Date(Date.now() + (options.expiresInMinutes || 1440) * 60 * 1000);
  
  const token: InviteToken = {
    id: tokenId,
    email: options.email.toLowerCase(),
    role: options.role,
    schoolId: options.schoolId,
    createdByUserId: options.createdByUserId,
    expiresAt,
    used: false
  };
  
  inviteTokens.set(tokenId, token);
  
  return {
    token,
    code
  };
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