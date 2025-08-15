import type { Request, Response, NextFunction } from 'express';

export function requireTenant(req: Request, res: Response, next: NextFunction) {
  const user = (req as any).user as { schoolId: number } | undefined;
  const target = Number(req.params.schoolId ?? req.body.schoolId ?? req.query.schoolId ?? user?.schoolId);
  if (!user?.schoolId || !target || target !== user.schoolId) return res.status(403).json({ error: 'Wrong tenant' });
  (req as any).tenant = { schoolId: user.schoolId };
  next();
}