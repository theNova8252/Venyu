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
import eventRsvpRoutes from './api/routes/eventRSVProutes.js';

import http from 'http';                 
import { WebSocketServer } from 'ws';    
import cookie from 'cookie';             


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
app.use('/api/events', eventRsvpRoutes);

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

// ---- WebSocket Raumverwaltung ----
const rooms = new Map();           // roomId -> Set<WebSocket>
const onlineUsers = new Map();     // userId -> Anzahl Verbindungen

function addClientToRoom(roomId, ws) {
  let set = rooms.get(roomId);
  if (!set) {
    set = new Set();
    rooms.set(roomId, set);
  }
  set.add(ws);
}

function removeClientFromRoom(roomId, ws) {
  const set = rooms.get(roomId);
  if (!set) return;
  set.delete(ws);
  if (!set.size) {
    rooms.delete(roomId);
  }
}

function broadcastToRoom(roomId, messageObj, senderWs) {
  const set = rooms.get(roomId);
  if (!set) return;

  for (const client of set) {
    if (client.readyState !== client.OPEN) continue;

    const msgForClient = {
      ...messageObj,
      isMine: client === senderWs || client.userId === messageObj.senderId,
    };

    client.send(
      JSON.stringify({
        type: 'chat_message',
        message: msgForClient,
      }),
    );
  }
}

function broadcastPresenceUpdate(userId, isOnline, wss) {
  const payload = JSON.stringify({
    type: 'presence',
    userId,
    isOnline,
  });

  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) {
      client.send(payload);
    }
  }
}

// Serverstart + DB-Init + WebSocket
(async () => {
  try {
    await initDb();

    const server = http.createServer(app);

    // *** EIN gemeinsamer WebSocketServer ***
    const wss = new WebSocketServer({ server });

    wss.on('connection', async (ws, req) => {
      try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const pathname = url.pathname;

        // ----------------- CHAT -----------------
        if (pathname === '/ws/chat') {
          const roomId = url.searchParams.get('roomId');
          if (!roomId) {
            ws.close(1008, 'Missing roomId');
            return;
          }

          const cookies = cookie.parse(req.headers.cookie || '');
          const at = cookies.at;
          if (!at) {
            ws.close(1008, 'No auth cookie');
            return;
          }

          const sp = await fetchMe(at);
          const user = await User.findOne({ where: { spotifyId: sp.id } });
          if (!user) {
            ws.close(1008, 'user_not_found');
            return;
          }

          ws.userId = user.id;
          ws.roomId = roomId;

          addClientToRoom(roomId, ws);
          console.log(`WS connected (chat): user ${user.id} room ${roomId}`);

          ws.on('message', async (data) => {
            try {
              const msg = JSON.parse(data.toString());
              if (msg.type !== 'chat_message') return;

              const text = (msg.text || '').trim();
              if (!text) return;

              const saved = await ChatMessage.create({
                roomId,
                senderId: ws.userId,
                text,
              });

              const obj = saved.toJSON();
              broadcastToRoom(roomId, obj, ws);
            } catch (err) {
              console.error('WS chat message error', err);
            }
          });

          ws.on('close', () => {
            console.log(
              `WS closed (chat): user ${ws.userId} room ${ws.roomId}`,
            );
            removeClientFromRoom(ws.roomId, ws);
          });

          return;
        }

        // --------------- PRESENCE ---------------
        if (pathname === '/ws/presence') {
          const cookies = cookie.parse(req.headers.cookie || '');
          const at = cookies.at;
          if (!at) {
            ws.close(1008, 'No auth cookie');
            return;
          }

          const sp = await fetchMe(at);
          const user = await User.findOne({ where: { spotifyId: sp.id } });
          if (!user) {
            ws.close(1008, 'user_not_found');
            return;
          }

          ws.userId = user.id;

          const currentCount = onlineUsers.get(user.id) || 0;
          onlineUsers.set(user.id, currentCount + 1);

          console.log('Presence WS connected:', user.id);

          // Snapshot aller aktuell online User
          ws.send(
            JSON.stringify({
              type: 'presence_snapshot',
              users: Array.from(onlineUsers.keys()),
            }),
          );

          // allen sagen: dieser User ist online
          broadcastPresenceUpdate(user.id, true, wss);

          ws.on('close', () => {
            const prev = onlineUsers.get(user.id) || 1;
            const next = prev - 1;

            if (next <= 0) {
              onlineUsers.delete(user.id);
              console.log('Presence WS offline:', user.id);
              broadcastPresenceUpdate(user.id, false, wss);
            } else {
              onlineUsers.set(user.id, next);
            }
          });

          return;
        }

        // Unbekannter Pfad
        ws.close(1008, 'Unknown WebSocket path');
      } catch (err) {
        console.error('WS connection error', err);
        ws.close(1011, 'Unexpected error');
      }
    });

    server.listen(PORT, () => {
      console.log(`API & WS listening on :${PORT}`);
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

