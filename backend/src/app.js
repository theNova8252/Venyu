import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'path';
import cors from 'cors';
import debug from 'debug';
import { initDb } from './model/db.js';

import spotifyRoute from './api/routes/spotifyRoutes.js';

dotenv.config();
debug.enable(process.env.DEBUG); // enable DEBUG from .env

const dirname = path.resolve();

const app = express();

app.use(morgan('dev'));
app.use(cors());

app.use(express.static(path.join(dirname, '/public')));
app.use(express.json());

app.use('/spotify', spotifyRoute);

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  await initDb();
  console.log(`🚀 API listening on :${PORT}`);
});

export default app;
