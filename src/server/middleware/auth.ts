import type { Request, Response, NextFunction } from 'express';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';

// Simple signed cookie session (httpOnly). No JWT/Redis required.
const COOKIE_NAME = 'pp_sess';
const ALGO = 'sha256';

export function cookies(secret: string) {
  return cookieParser(secret);
}

export type Session = {
  userId: number;
  schoolId: number;
  role: 'teacher' | 'admin' | 'superadmin';
  iat: number;
};

export interface AuthenticatedRequest extends Request {
  session?: Session;
}

export function sign(value: string, secret: string) {
  const sig = crypto.createHmac(ALGO, secret).update(value).digest('base64url');
  return `${value}.${sig}`;
}

export function verify(signed: string, secret: string) {
  const [value, sig] = signed.split('.');
  if (!value || !sig) return null;
  const expected = crypto.createHmac(ALGO, secret).update(value).digest('base64url');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected)) ? value : null;
}

export function setSession(res: Response, session: Session) {
  const secret = process.env.SESSION_SECRET!;
  const value = Buffer.from(JSON.stringify(session)).toString('base64url');
  const signed = sign(value, secret);
  res.cookie(COOKIE_NAME, signed, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 8 // 8 hours
  });
}

export function clearSession(res: Response) {
  res.cookie(COOKIE_NAME, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 0 });
}

export function readSession(req: Request): Session | null {
  const secret = process.env.SESSION_SECRET!;
  const raw = req.cookies?.[COOKIE_NAME];
  if (!raw) return null;
  const value = verify(raw, secret);
  if (!value) return null;
  try {
    const json = JSON.parse(Buffer.from(value, 'base64url').toString('utf8')) as Session;
    return json;
  } catch {
    return null;
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction) {
  const s = readSession(req);
  if (!s || !s.userId || !s.schoolId) return res.status(401).json({ error: 'Unauthorized' });
  (req as AuthenticatedRequest).session = s;
  next();
}

export function requireRole(role: 'admin' | 'superadmin') {
  return (req: Request, res: Response, next: NextFunction) => {
    const u = (req as any).user as Session | undefined;
    if (!u) return res.status(401).json({ error: 'Unauthorized' });
    if (role === 'admin' && !['admin', 'superadmin'].includes(u.role)) return res.status(403).json({ error: 'Forbidden' });
    if (role === 'superadmin' && u.role !== 'superadmin') return res.status(403).json({ error: 'Forbidden' });
    next();
  };
}