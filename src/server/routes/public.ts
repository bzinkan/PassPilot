import { Router } from 'express';

export const publicRouter = Router();

publicRouter.get('/health', (_req, res) => {
  res.json({ ok: true, ts: Date.now() });
});

