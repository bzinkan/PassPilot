import { Router } from 'express';
import type { Request, Response } from 'express';
import { asyncHandler } from '../middleware/asyncHandler';
import { db } from '../db/client';
import { kioskDevices } from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import bcrypt from 'bcryptjs';
import { setKioskSession, clearKioskSession, requireKiosk } from '../middleware/kiosk';

export const kioskAuthRouter = Router();

// POST /kiosk/login { schoolId, room, pin }
kioskAuthRouter.post('/kiosk/login', asyncHandler(async (req: Request, res: Response) => {
  const { schoolId, room, pin } = req.body ?? {};
  if (!schoolId || !room || !pin) return res.status(400).json({ error: 'Missing fields' });

  const [dev] = await db.select().from(kioskDevices)
    .where(and(
      eq(kioskDevices.schoolId, Number(schoolId)),
      eq(kioskDevices.room, String(room)),
      eq(kioskDevices.active, true)
    ))
    .limit(1);
  if (!dev) return res.status(401).json({ error: 'Invalid room or inactive device' });

  const ok = await bcrypt.compare(String(pin), dev.pinHash);
  if (!ok) return res.status(401).json({ error: 'Invalid PIN' });

  setKioskSession(res, { schoolId: Number(schoolId), room: String(room), kioskDeviceId: dev.id });
  res.json({ ok: true });
}));

// POST /kiosk/logout
kioskAuthRouter.post('/kiosk/logout', requireKiosk, asyncHandler(async (_req: Request, res: Response) => {
  clearKioskSession(res);
  res.json({ ok: true });
}));