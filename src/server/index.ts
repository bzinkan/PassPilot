import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import { createServer } from 'http';
import { setupVite } from '../../server/vite';
import { cookies } from './middleware/auth';
import { notFound, errorHandler } from './middleware/error';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';
import { passesRouter } from './routes/passes';
import { reportsRouter } from './routes/reports';
import { profileRouter } from './routes/profile';
import { gradesRouter } from './routes/grades';
import { studentsRouter } from './routes/students';
import { kioskRouter } from './routes/kiosk';
import { kioskAuthRouter } from './routes/kiosk_auth';
import { rosterRouter, myClassRouter } from './routes/roster';
import { saRouter } from './routes/sa';

const app = express();
const server = createServer(app);

app.set('trust proxy', 1);
app.use(helmet({
  contentSecurityPolicy: false, // Disable CSP for development to allow Vite's inline scripts
  crossOriginEmbedderPolicy: false
}));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookies(process.env.SESSION_SECRET!));

// API routes only - removed pagesRouter to let Vite handle the frontend
app.use('/api/auth', authRouter);
app.use('/api/profile', profileRouter);
app.use('/api/admin', adminRouter);
app.use('/api/passes', passesRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/grades', gradesRouter);
app.use('/api/students', studentsRouter);
app.use('/api/kiosk-auth', kioskAuthRouter);
app.use('/api/kiosk', kioskRouter);
app.use('/api/roster', rosterRouter);
app.use('/api/myclass', myClassRouter);
app.use('/api/sa', saRouter);

// Setup Vite for serving the React app
setupVite(app, server).then(() => {
  app.use(notFound);
  app.use(errorHandler);

  const port = Number(process.env.PORT || 5000);
  server.listen(port, () => {
    console.log(`PassPilot (Slim) running on http://localhost:${port}`);
  });
});