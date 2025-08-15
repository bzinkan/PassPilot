import type { Request, Response, NextFunction } from 'express';

export function requireTenant(req: Request, res: Response, next: NextFunction) {
  const session = (req as any).session as { schoolId: number } | undefined;
  const target = Number(req.params.schoolId ?? req.body.schoolId ?? req.query.schoolId ?? session?.schoolId);
  if (!session?.schoolId || !target || target !== session.schoolId) return res.status(403).json({ error: 'Wrong tenant' });
  (req as any).tenant = { schoolId: session.schoolId };
  next();
}