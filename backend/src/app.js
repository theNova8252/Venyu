// backend/src/app.js
import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'node:path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Op } from 'sequelize';

import { initDb } from './model/db.js';

import spotifyRoutes from './api/routes/spotifyRoutes.js';
import userRoutes from './api/routes/userRoutes.js';
import chatRoutes from './api/routes/chatRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import eventRoutes from './api/routes/eventRoutes.js';

// Modelle
import User from './model/User.js';
import ChatMessage from './model/ChatMessage.js';
import Like from './model/Like.js';
import { fetchMe } from './model/spotifyModel.js';

dotenv.config();

const app = express();

// middleware
app.use(morgan('dev'));
app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://127.0.0.1:8080',
    credentials: true,
  }),
);

// static
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(express.static(path.join(process.cwd(), 'public')));

// ---------- Hilfsfunktionen für Matches / Chat ----------
async function getCurrentUser(req) {
  const { at } = req.cookies || {};
  if (!at) {
    const err = new Error('no_access_token');
    err.status = 401;
    throw err;
  }

  const sp = await fetchMe(at); // Spotify /me
  const user = await User.findOne({ where: { spotifyId: sp.id } });

  if (!user) {
    const err = new Error('user_not_found');
    err.status = 404;
    throw err;
  }

  return user;
}

function makeRoomId(a, b) {
  return [a, b].sort().join('__');
}

// ---------- API-Routen ----------
app.use('/api/spotify', spotifyRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/events', eventRoutes);

// === Matches: Kandidaten für Discover ===
app.get('/api/matches/candidates', async (req, res, next) => {
  try {
    const me = await getCurrentUser(req);

    const others = await User.findAll({
      where: {
        id: { [Op.ne]: me.id },
        isVisible: true,
      },
    });

    const result = others.map((u, index) => ({
      id: u.id,
      userId: u.id,
      name: u.displayName || 'Unknown',
      avatar:
        u.avatarUrl || `https://i.pravatar.cc/400?img=${(index + 10) % 70}`,
      bio: u.bio || 'Music lover 🎵',
      distance: 'Nearby',
      topArtists: [],
      genres: [],
      matchScore: 80,
    }));

    return res.json(result);
  } catch (e) {
    if (e.status) {
      return res.status(e.status).json({ error: e.message });
    }
    next(e);
  }
});

// === Matches: Like & Match-Logik ===
app.post('/api/matches/:otherUserId/like', async (req, res, next) => {
  try {
    const me = await getCurrentUser(req);
    const { otherUserId } = req.params;

    if (!otherUserId) {
      return res.status(400).json({ error: 'missing_other_user_id' });
    }
    if (otherUserId === String(me.id)) {
      return res.status(400).json({ error: 'cannot_like_self' });
    }

    const other = await User.findByPk(otherUserId);
    if (!other) {
      return res.status(404).json({ error: 'user_not_found' });
    }

    // Like eintragen
    await Like.findOrCreate({
      where: {
        fromUserId: me.id,
        toUserId: otherUserId,
      },
    });

    // Hat der andere dich auch schon geliked?
    const reciprocal = await Like.findOne({
      where: {
        fromUserId: otherUserId,
        toUserId: me.id,
      },
    });

    if (reciprocal) {
      const roomId = makeRoomId(me.id, otherUserId);
      return res.json({ isMatch: true, roomId });
    }

    return res.json({ isMatch: false });
  } catch (e) {
    if (e.status) {
      return res.status(e.status).json({ error: e.message });
    }
    next(e);
  }
});

// === Chat: Liste meiner Matches / Chat-Räume ===
app.get('/api/chat/rooms', async (req, res, next) => {
  try {
    const me = await getCurrentUser(req);

    // Likes, die ich gegeben habe
    const iLiked = await Like.findAll({
      where: { fromUserId: me.id }
    });

    // Likes, die ich bekommen habe
    const likedMe = await Like.findAll({
      where: { toUserId: me.id }
    });

    // Finde Matches ( beide Richtungen existieren )
    const matches = iLiked
      .filter(l1 => likedMe.some(l2 => l2.fromUserId === l1.toUserId))
      .map(m => m.toUserId);

    // Hole Userdaten
    const users = await User.findAll({
      where: { id: matches }
    });

    const result = users.map(u => ({
      roomId: [u.id, me.id].sort().join("__"),
      user: {
        id: u.id,
        name: u.displayName || "Unknown",
        avatar: u.avatarUrl || "https://i.pravatar.cc/150?u=" + u.id,
        bio: u.bio || ""
      }
    }));

    return res.json(result);
  } catch (e) {
    next(e);
  }
});

// health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

// Serverstart + DB-Init
(async () => {
  try {
    await initDb();
    app.listen(PORT, () => {
      console.log(`API listening on :${PORT}`);
    });
  } catch (err) {
    console.error('Failed to init DB:', err);
    process.exit(1);
  }
  // === Chat: Liste meiner Matches / Chat-Räume ===
app.get('/api/chat/rooms', async (req, res, next) => {
  try {
    const me = await getCurrentUser(req);

    // Likes, die ich gegeben habe
    const iLiked = await Like.findAll({
      where: { fromUserId: me.id }
    });

    // Likes, die ich bekommen habe
    const likedMe = await Like.findAll({
      where: { toUserId: me.id }
    });

    // Finde Matches (beide Richtungen existieren)
    const matches = iLiked
      .filter(l1 => likedMe.some(l2 => l2.fromUserId === l1.toUserId))
      .map(m => m.toUserId);

    // Daten der Match-User holen
    const users = await User.findAll({
      where: { id: matches }
    });

    const result = users.map(u => ({
      roomId: [u.id, me.id].sort().join("__"),
      user: {
        id: u.id,
        name: u.displayName || "Unknown",
        avatar: u.avatarUrl || "https://i.pravatar.cc/150?u=" + u.id,
        bio: u.bio || ""
      }
    }));

    return res.json(result);
  } catch (e) {
    next(e);
  }
});

})();

export default app;
