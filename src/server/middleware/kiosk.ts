import type { Request, Response, NextFunction } from 'express';
import cookie from 'cookie';
import crypto from 'crypto';

const KIOSK_COOKIE = 'pp_kiosk';
const ALGO = 'sha256';

function sign(val: string, secret: string) {
  const sig = crypto.createHmac(ALGO, secret).update(val).digest('base64url');
  return `${val}.${sig}`;
}

function verify(signed: string, secret: string) {
  const [v, sig] = signed.split('.');
  if (!v || !sig) return null;
  const expect = crypto.createHmac(ALGO, secret).update(v).digest('base64url');
  return crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expect)) ? v : null;
}

export type KioskSession = { schoolId: number; room: string; kioskDeviceId?: number };

export function setKioskSession(res: Response, sess: KioskSession) {
  const secret = process.env.SESSION_SECRET!;
  const value = Buffer.from(JSON.stringify(sess)).toString('base64url');
  res.setHeader('Set-Cookie', cookie.serialize(KIOSK_COOKIE, sign(value, secret), {
    httpOnly: true,
    sameSite: 'lax',
    secure: 'auto',
    path: '/',
    maxAge: 60 * 60 * 8 // 8h
  }));
}

export function clearKioskSession(res: Response) {
  res.setHeader('Set-Cookie', cookie.serialize(KIOSK_COOKIE, '', {
    httpOnly: true, sameSite: 'lax', secure: 'auto', path: '/', maxAge: 0
  }));
}

export function readKioskSession(req: Request): KioskSession | null {
  const secret = process.env.SESSION_SECRET!;
  const rawCookie = (req.headers.cookie || '').split('; ').find(c => c.startsWith(KIOSK_COOKIE + '='));
  if (!rawCookie) return null;
  const signed = rawCookie.split('=')[1];
  if (!signed) return null;
  const v = verify(signed, secret);
  if (!v) return null;
  try { return JSON.parse(Buffer.from(v, 'base64url').toString('utf8')) as KioskSession; }
  catch { return null; }
}

export function requireKiosk(req: Request, res: Response, next: NextFunction): void {
  const s = readKioskSession(req);
  if (!s) {
    res.status(401).json({ error: 'Kiosk unauthorized' });
    return;
  }
  (req as any).kiosk = s;
  next();
}