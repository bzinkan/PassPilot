import type { ErrorRequestHandler, RequestHandler } from 'express';

export const notFound: RequestHandler = (req, res) => {
  res.status(404).json({ error: 'Not Found' });
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const status = (err as any).status || 500;
  if (process.env.NODE_ENV !== 'production') {
    console.error(err);
  }
  res.status(status).json({ error: 'Server Error', detail: process.env.NODE_ENV === 'production' ? undefined : String(err) });
};