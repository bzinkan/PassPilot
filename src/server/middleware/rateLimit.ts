import type { Request, Response, NextFunction } from 'express';

const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit({ windowMs = 60_000, max = 30 }: { windowMs?: number; max?: number }) {
  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${req.ip}:${req.path}`;
    const now = Date.now();
    const b = buckets.get(key);
    if (!b || now > b.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return next();
    }
    if (b.count >= max) return res.status(429).json({ error: 'Too many requests' });
    b.count++;
    next();
  };
}