import { Router } from 'express';
import type { Request, Response } from 'express';
import { readSession, requireAuth } from '../middleware/auth';

export const pagesRouter = Router();

// Root: send logged-out users to /login, logged-in to /dashboard
pagesRouter.get('/', (req: Request, res: Response) => {
  const s = readSession(req);
  res.redirect(s ? '/dashboard' : '/login');
});

// Simple login form
pagesRouter.get('/login', (req: Request, res: Response) => {
  const s = readSession(req);
  if (s) return res.redirect('/dashboard');
  res.setHeader('Content-Type','text/html');
  res.end(`<!doctype html><meta charset="utf-8">
  <style>body{font-family:system-ui;margin:2rem;max-width:420px}</style>
  <h1>PassPilot — Sign in</h1>
  <form method="post" action="/login">
    <label>Email<br/><input name="email" type="email" required /></label><br/><br/>
    <label>Password<br/><input name="password" type="password" required /></label><br/><br/>
    <label>School ID<br/><input name="schoolId" type="number" required /></label><br/><br/>
    <button>Sign in</button>
  </form>`);
});

// Bare-bones dashboard
pagesRouter.get('/dashboard', requireAuth, (req: Request, res: Response) => {
  const { userId, role, schoolId } = (req as any).session;
  res.setHeader('Content-Type','text/html');
  res.end(`<!doctype html><meta charset="utf-8">
  <style>body{font-family:system-ui;margin:2rem;max-width:720px}</style>
  <h1>PassPilot</h1>
  <p>Signed in as <b>${userId}</b> — role <b>${role}</b> — school <b>${schoolId}</b></p>
  <nav>
    <a href="/roster">Roster (API JSON)</a> · 
    <a href="/myclass">MyClass (API JSON)</a>
  </nav>
  <hr/>
  <form method="post" action="/logout"><button>Logout</button></form>`);
});