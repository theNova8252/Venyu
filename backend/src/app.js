import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'node:path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { initDb } from './model/db.js';

import spotifyRoutes from './api/routes/spotifyRoutes.js';
import userRoutes from './api/routes/userRoutes.js';

dotenv.config();

const app = express();

// --- middleware
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());

// ✅ CORS: allow frontend + cookies
app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://127.0.0.1:8080',
    credentials: true,
  }),
);

// static
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(express.static(path.join(process.cwd(), 'public')));

// ✅ mount under /api (unify!)
app.use('/api/spotify', spotifyRoutes);
app.use('/api/user', userRoutes);

// handy healthcheck
app.get('/api/health', (_req, res) => res.json({ ok: true }));

const PORT = Number(process.env.PORT) || 5000;
app.listen(PORT, async () => {
  await initDb();
  console.log(`🚀 API listening on :${PORT}`);
});

export default app;
