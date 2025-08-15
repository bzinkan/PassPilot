import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import { cookies } from './middleware/auth';
import { notFound, errorHandler } from './middleware/error';
// import { publicRouter } from './routes/public';
import { authRouter } from './routes/auth';
import { adminRouter } from './routes/admin';
import { passesRouter } from './routes/passes';
import { gradesRouter } from './routes/grades';
import { studentsRouter } from './routes/students';
import { kioskRouter } from './routes/kiosk';
import { rosterRouter, myClassRouter } from './routes/roster';
import { pagesRouter } from './routes/pages';

const app = express();
app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookies(process.env.SESSION_SECRET!));

// Core routes
app.use('/', authRouter);
app.use('/', pagesRouter);
app.use('/admin', adminRouter);
app.use('/passes', passesRouter);
app.use('/grades', gradesRouter);
app.use('/students', studentsRouter);
app.use('/kiosk', kioskRouter);
app.use('/', rosterRouter);
app.use('/', myClassRouter);

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env.PORT || 5000);
app.listen(port, () => {
  console.log(`PassPilot (Slim) running on http://localhost:${port}`);
});