import express from 'express';
import morgan from 'morgan';
import dotenv from 'dotenv';
import path from 'node:path';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { Op } from 'sequelize';

import http from 'http';
import { WebSocketServer } from 'ws';
import cookie from 'cookie';
import { initDb } from './model/db.js';

import spotifyRoutes from './api/routes/spotifyRoutes.js';
import userRoutes from './api/routes/userRoutes.js';
import chatRoutes from './api/routes/chatRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import eventRoutes from './api/routes/eventRoutes.js';
import eventRsvpRoutes from './api/routes/eventRSVProutes.js';
import searchRoutes from './api/routes/searchRoutes.js';
import autoRefreshToken from './middleware/autoRefresh.js';

// Modelle
import User from './model/User.js';
import SpotifyData from './model/SpotifyData.js';
import ChatMessage from './model/ChatMessage.js';
import Like from './model/Like.js';
import { fetchMe } from './model/spotifyModel.js';

import EventRsvp from './model/eventRSVP.js';

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

// ---------- Helpers ----------
async function getCurrentUser(req) {
  const { at } = req.cookies || {};
  if (!at) {
    const err = new Error('no_access_token');
    err.status = 401;
    throw err;
  }

  const sp = await fetchMe(at);
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

function toArray(value) {
  if (Array.isArray(value)) return value;

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean);
    }
  }

  return [];
}

function getArtistName(artist) {
  if (typeof artist === 'string') return artist;
  if (artist && typeof artist.name === 'string') return artist.name;
  return null;
}

function getArtistId(artist) {
  if (artist && typeof artist === 'object' && typeof artist.id === 'string') return artist.id;
  return null;
}

// ── Genre normalizer: map Spotify micro-genres to basic parent genres ──
const GENRE_MAP = [
  { parent: 'Pop', keywords: ['pop'] },
  { parent: 'Hip Hop', keywords: ['hip hop', 'rap', 'trap', 'drill'] },
  { parent: 'R&B', keywords: ['r&b', 'rnb', 'rhythm and blues', 'neo soul', 'urban contemporary'] },
  { parent: 'EDM', keywords: ['edm', 'electronic', 'house', 'techno', 'trance', 'dubstep', 'drum and bass', 'dnb', 'electro', 'hardstyle', 'bass music'] },
  { parent: 'Rock', keywords: ['rock', 'grunge', 'alternative', 'garage'] },
  { parent: 'Metal', keywords: ['metal', 'metalcore', 'deathcore', 'hardcore'] },
  { parent: 'Indie', keywords: ['indie'] },
  { parent: 'Jazz', keywords: ['jazz', 'bebop', 'swing'] },
  { parent: 'Classical', keywords: ['classical', 'orchestra', 'symphony', 'opera', 'baroque', 'chamber'] },
  { parent: 'Country', keywords: ['country', 'bluegrass', 'americana'] },
  { parent: 'Latin', keywords: ['latin', 'reggaeton', 'salsa', 'bachata', 'cumbia', 'dembow', 'banda', 'corrido', 'norteno', 'mariachi'] },
  { parent: 'Soul', keywords: ['soul', 'motown'] },
  { parent: 'Funk', keywords: ['funk', 'boogie'] },
  { parent: 'Reggae', keywords: ['reggae', 'dancehall', 'dub', 'ska'] },
  { parent: 'Blues', keywords: ['blues'] },
  { parent: 'Folk', keywords: ['folk', 'singer-songwriter'] },
  { parent: 'Punk', keywords: ['punk', 'emo', 'screamo'] },
  { parent: 'K-Pop', keywords: ['k-pop', 'kpop'] },
  { parent: 'Afrobeats', keywords: ['afrobeat', 'afropop', 'afro'] },
];

function normalizeGenre(raw) {
  const lower = raw.toLowerCase();
  for (const { parent, keywords } of GENRE_MAP) {
    if (keywords.some((kw) => lower.includes(kw))) return parent;
  }
  return null; // drop unrecognizable micro-genres
}

function normalizeGenres(genreList) {
  const seen = new Set();
  const result = [];
  for (const raw of genreList) {
    const normalized = normalizeGenre(String(raw));
    if (normalized && !seen.has(normalized)) {
      seen.add(normalized);
      result.push(normalized);
    }
  }
  return result;
}

// stored when server boots so HTTP routes can broadcast
let wssRef = null;

// Send a message to a specific user via any open presence WS connection
function sendToUser(userId, payload) {
  if (!wssRef) return;
  const id = String(userId);
  const json = JSON.stringify(payload);
  for (const client of wssRef.clients) {
    if (client.readyState === client.OPEN && String(client.userId) === id) {
      client.send(json);
    }
  }
}

// ---------- Auto-refresh expired tokens ----------
app.use('/api', autoRefreshToken);

// ---------- API-Routen ----------
app.use('/api/spotify', spotifyRoutes);
app.use('/api/user', userRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/events', eventRsvpRoutes);
app.use('/api/search', searchRoutes);

// === Matches: Kandidaten für Discover ===
app.get('/api/matches/candidates', async (req, res, next) => {
  try {
    const me = await getCurrentUser(req);

    // My music data from spotify_data table (cap at top 6 genres, top 4 artists)
    const mySpotifyData = await SpotifyData.findByPk(me.id);
    const myTopArtists = toArray(mySpotifyData?.topArtists).slice(0, 4);
    const myArtistIds = new Set(myTopArtists.map(getArtistId).filter(Boolean));
    const myArtistNames = new Set(
      myTopArtists.map(getArtistName).filter(Boolean).map((n) => n.toLowerCase()),
    );
    const myGenresNormalized = normalizeGenres(toArray(mySpotifyData?.genres));
    const myGenres = new Set(myGenresNormalized.slice(0, 6).map((g) => g.toLowerCase()));

    // Filter out already liked users
    const myLikes = await Like.findAll({
      where: { fromUserId: me.id },
      attributes: ['toUserId'],
    });
    const likedIds = new Set(myLikes.map((l) => String(l.toUserId)));

    // My event RSVPs
    const myRsvps = await EventRsvp.findAll({
      where: { userId: me.id, interested: true },
      attributes: ['eventId'],
    });
    const myEventIds = new Set(myRsvps.map((r) => r.eventId));

    const others = await User.findAll({
      where: {
        id: {
          [Op.and]: [
            { [Op.ne]: me.id },
            ...(likedIds.size > 0 ? [{ [Op.notIn]: Array.from(likedIds) }] : []),
          ],
        },
        isVisible: true,
      },
    });

    // Fetch event RSVPs for all candidates
    const otherIds = others.map((u) => u.id);
    const allRsvps = otherIds.length
      ? await EventRsvp.findAll({
        where: { userId: { [Op.in]: otherIds }, interested: true },
        attributes: ['userId', 'eventId', 'interested', 'going'],
      })
      : [];

    const rsvpsByUser = {};
    for (const r of allRsvps) {
      if (!rsvpsByUser[r.userId]) rsvpsByUser[r.userId] = [];
      rsvpsByUser[r.userId].push({ eventId: r.eventId, interested: r.interested, going: r.going });
    }

    // Fetch SpotifyData for all candidates
    const allSpotifyData = otherIds.length
      ? await SpotifyData.findAll({ where: { userId: { [Op.in]: otherIds } } })
      : [];
    const spotifyDataByUser = {};
    for (const sd of allSpotifyData) spotifyDataByUser[sd.userId] = sd;

    const result = others.map((u, index) => {
      const uSpotify = spotifyDataByUser[u.id];
      const candidateTopArtists = toArray(uSpotify?.topArtists);
      const candidateGenresRaw = toArray(uSpotify?.genres).map((genre) => String(genre));
      const candidateGenres = normalizeGenres(candidateGenresRaw);

      // Cap at top 6 genres and top 4 artists for matching
      const myGenresCapped = [...myGenres].slice(0, 6);
      const uGenresCapped = candidateGenres.slice(0, 6).map((g) => g.toLowerCase());
      const uGenreSet = new Set(uGenresCapped);
      const sharedGenresList = myGenresCapped.filter((g) => uGenreSet.has(g));

      // Artist matching by id OR name (top 4)
      const uArtistsCapped = candidateTopArtists.slice(0, 4);
      const uArtistIds = new Set(uArtistsCapped.map(getArtistId).filter(Boolean));
      const uArtistNames = new Set(
        uArtistsCapped.map(getArtistName).filter(Boolean).map((n) => n.toLowerCase()),
      );
      const myArtistNamesCapped = [...myArtistNames].slice(0, 4);
      const myArtistIdsCapped = [...myArtistIds].slice(0, 4);
      const sharedById = myArtistIdsCapped.filter((id) => uArtistIds.has(id)).length;
      const sharedByName = myArtistNamesCapped.filter((n) => uArtistNames.has(n)).length;
      const sharedArtistCount = Math.max(sharedById, sharedByName);

      // Each shared item = 10% (6 genres + 4 artists = 10 items = 100%)
      const totalScore = Math.min(100, (sharedGenresList.length + sharedArtistCount) * 10);
      console.log(`🎯 ${u.displayName}: ${sharedGenresList.length} shared genres, ${sharedArtistCount} shared artists → ${totalScore}%`);

      // Event overlap (display only, not in score)
      const userEventIds = (rsvpsByUser[u.id] || []).map((r) => r.eventId);
      const sharedEventsList = userEventIds.filter((eid) => myEventIds.has(eid));

      return {
        id: u.id,
        userId: u.id,
        name: u.displayName || 'Unknown',
        age: Number.isFinite(Number(u.age)) ? Number(u.age) : null,
        avatar: u.avatarUrl || `https://i.pravatar.cc/400?img=${(index + 10) % 70}`,
        bio: u.bio || 'Music lover',
        distance: 'Nearby',
        topArtists: candidateTopArtists
          .map((a) => (typeof a === 'string' ? { name: a, image: null } : { name: a?.name, image: a?.image || null }))
          .filter((a) => a.name),
        topTracks: toArray(uSpotify?.topTracks)
          .map((t) => ({
            name: typeof t === 'string' ? t : t?.name,
            artist: typeof t === 'string' ? '' : t?.artists?.[0]?.name || '',
            albumImage: typeof t === 'string' ? null : t?.album?.image || null,
          }))
          .filter((t) => t.name),
        recentlyPlayed: toArray(uSpotify?.recentlyPlayed)
          .slice(0, 5)
          .map((item) => ({
            name: item?.track?.name || (typeof item === 'string' ? item : null),
            artist: item?.track?.artists?.[0]?.name || '',
            albumImage: item?.track?.album?.image || null,
            playedAt: item?.playedAt || null,
          }))
          .filter((t) => t.name),
        genres: candidateGenres,
        audioFeatures: uSpotify?.audioFeatures ?? null,
        eventRsvps: rsvpsByUser[u.id] || [],
        matchScore: totalScore,
        matchBreakdown: {
          genreScore: sharedGenresList.length,
          genreMax: 6,
          sharedGenres: sharedGenresList,
          artistScore: sharedArtistCount,
          artistMax: 4,
          sharedArtists: sharedArtistCount,
          total: totalScore,
        },
      };
    });

    // Sort by score descending
    result.sort((a, b) => b.matchScore - a.matchScore);

    return res.json(result);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    return next(e);
  }
});

// === Matches: Like & Match-Logik ===
app.post('/api/matches/:otherUserId/like', async (req, res, next) => {
  try {
    const me = await getCurrentUser(req);
    const { otherUserId } = req.params;

    if (!otherUserId) return res.status(400).json({ error: 'missing_other_user_id' });
    if (otherUserId === String(me.id)) return res.status(400).json({ error: 'cannot_like_self' });

    const other = await User.findByPk(otherUserId);
    if (!other) return res.status(404).json({ error: 'user_not_found' });

    await Like.findOrCreate({
      where: { fromUserId: me.id, toUserId: otherUserId },
    });

    const reciprocal = await Like.findOne({
      where: { fromUserId: otherUserId, toUserId: me.id },
    });

    if (reciprocal) {
      const roomId = makeRoomId(me.id, otherUserId);

      // Notify the OTHER user about the match via presence WS
      sendToUser(otherUserId, {
        type: 'match',
        roomId,
        user: {
          id: me.id,
          name: me.displayName || 'Someone',
          avatar: me.avatarUrl || null,
        },
      });

      // Also notify the current user (in case they have other tabs)
      sendToUser(me.id, {
        type: 'match',
        roomId,
        user: {
          id: other.id,
          name: other.displayName || 'Someone',
          avatar: other.avatarUrl || null,
        },
      });

      return res.json({ isMatch: true, roomId });
    }

    return res.json({ isMatch: false });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    return next(e);
  }
});

// === Chat: Liste meiner Matches / Chat-Räume ===
app.get('/api/chat/rooms', async (req, res, next) => {
  try {
    const me = await getCurrentUser(req);

    const iLiked = await Like.findAll({ where: { fromUserId: me.id } });
    const likedMe = await Like.findAll({ where: { toUserId: me.id } });

    const matches = iLiked
      .filter((l1) => likedMe.some((l2) => l2.fromUserId === l1.toUserId))
      .map((m) => m.toUserId);

    const users = await User.findAll({ where: { id: matches } });
    const spotifyDataRows = matches.length
      ? await SpotifyData.findAll({ where: { userId: { [Op.in]: matches } } })
      : [];
    const spotifyDataByUserId = {};
    for (const row of spotifyDataRows) {
      spotifyDataByUserId[String(row.userId)] = row;
    }

    const result = users.map((u) => ({
      roomId: [u.id, me.id].sort().join('__'),
      user: {
        id: u.id,
        name: u.displayName || 'Unknown',
        age: Number.isFinite(Number(u.age)) ? Number(u.age) : null,
        avatar: u.avatarUrl || `https://i.pravatar.cc/150?u=${u.id}`,
        bio: u.bio || '',
        genres: toArray(spotifyDataByUserId[String(u.id)]?.genres).slice(0, 6),
        audioFeatures: spotifyDataByUserId[String(u.id)]?.audioFeatures ?? null,
      },
    })).sort((a, b) => a.user.name.localeCompare(b.user.name));

    return res.json(result);
  } catch (e) {
    return next(e);
  }
});

// health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// error handling
app.use(notFoundHandler);
app.use(errorHandler);

const PORT = Number(process.env.PORT) || 5000;

// ---- WebSocket Raumverwaltung ----
const rooms = new Map(); // roomId -> { chat: Set<WebSocket>, spotify: Set<WebSocket> }
const onlineUsers = new Map(); // userId -> Anzahl Verbindungen
const lastSeenAt = new Map(); // userId -> ISO timestamp (letztes offline)
const roomSongStates = new Map(); // roomId -> current song state
const roomSongReadyUsers = new Map(); // roomId -> Set<userId>
const BOTH_ONLINE_REQUIRED_MESSAGE = 'Beide muessen online sein, um gemeinsam zu hoeren.';

function getRoomEntry(roomId) {
  let entry = rooms.get(roomId);
  if (!entry) {
    entry = {
      chat: new Set(),
      spotify: new Set(),
    };
    rooms.set(roomId, entry);
  }
  return entry;
}

function getRoomSet(roomId, channel = 'chat') {
  const entry = rooms.get(roomId);
  return entry?.[channel] || null;
}

function addClientToRoom(roomId, ws, channel = 'chat') {
  const entry = getRoomEntry(roomId);
  entry[channel].add(ws);
}

function removeClientFromRoom(roomId, ws, channel = 'chat') {
  const entry = rooms.get(roomId);
  if (!entry?.[channel]) return;

  entry[channel].delete(ws);
  if (!entry.chat.size && !entry.spotify.size) {
    rooms.delete(roomId);
  }
}

function broadcastToRoom(roomId, payload, channel = 'chat') {
  const set = getRoomSet(roomId, channel);
  if (!set) return;

  const json = JSON.stringify(payload);
  for (const client of set) {
    if (client.readyState === client.OPEN) {
      client.send(json);
    }
  }
}

function broadcastToRoomExcept(roomId, payload, exceptWs, channel = 'chat') {
  const set = getRoomSet(roomId, channel);
  if (!set) return;

  const json = JSON.stringify(payload);
  for (const client of set) {
    if (client !== exceptWs && client.readyState === client.OPEN) {
      client.send(json);
    }
  }
}

function getRoomParticipantIds(roomId) {
  return String(roomId)
    .split('__')
    .map((part) => part.trim())
    .filter(Boolean);
}

function areAllRoomParticipantsOnline(roomId) {
  const participantIds = getRoomParticipantIds(roomId);
  return participantIds.length > 1
    && participantIds.every((participantId) => (onlineUsers.get(String(participantId)) || 0) > 0);
}

function getRoomSongReadySet(roomId) {
  let readySet = roomSongReadyUsers.get(roomId);
  if (!readySet) {
    readySet = new Set();
    roomSongReadyUsers.set(roomId, readySet);
  }
  return readySet;
}

function getRoomSongReadyIds(roomId) {
  const readySet = roomSongReadyUsers.get(roomId);
  return readySet ? Array.from(readySet).map(String) : [];
}

function resetRoomSongReady(roomId) {
  roomSongReadyUsers.delete(roomId);
}

function clampSongPosition(songState, positionMs) {
  const durationMs = Number(songState?.durationMs) || 0;
  const safePosition = Math.max(0, Number(positionMs) || 0);

  if (durationMs > 0) {
    return Math.min(safePosition, durationMs);
  }

  return safePosition;
}

function normalizeSongStartPosition(songState, positionMs) {
  const durationMs = Number(songState?.durationMs) || 0;
  const safePosition = clampSongPosition(songState, positionMs);
  if (durationMs > 0 && safePosition >= durationMs) {
    return 0;
  }
  return safePosition;
}

function getCurrentSongPosition(songState, serverNow = Date.now()) {
  if (!songState) return 0;

  const basePosition = clampSongPosition(songState, songState.positionMs);
  if (!songState.isPlaying || !Number.isFinite(Number(songState.startedAtServerTime))) {
    return basePosition;
  }

  const deltaMs = Math.max(0, serverNow - Number(songState.startedAtServerTime));
  return clampSongPosition(songState, basePosition + deltaMs);
}

function buildSongState(roomId, payload, userId, previousState = null) {
  let artists = [];
  if (Array.isArray(payload?.artists)) {
    artists = payload.artists.map((artist) => String(artist).trim()).filter(Boolean);
  } else if (Array.isArray(previousState?.artists)) {
    artists = previousState.artists;
  }

  const nextState = {
    chatId: roomId,
    trackUri: payload?.trackUri ?? previousState?.trackUri ?? null,
    trackName: payload?.trackName ?? previousState?.trackName ?? null,
    artists,
    albumImage: payload?.albumImage ?? previousState?.albumImage ?? null,
    durationMs: Number(payload?.durationMs ?? previousState?.durationMs) || 0,
    isPlaying: Boolean(payload?.isPlaying ?? previousState?.isPlaying ?? false),
    startedAtServerTime: payload?.startedAtServerTime ?? previousState?.startedAtServerTime ?? null,
    positionMs: Math.max(0, Number(payload?.positionMs ?? previousState?.positionMs) || 0),
    selectedByUserId: String(
      payload?.selectedByUserId ?? previousState?.selectedByUserId ?? userId,
    ),
  };

  nextState.positionMs = clampSongPosition(nextState, nextState.positionMs);
  return nextState;
}

function setRoomSongState(
  roomId,
  payload,
  userId,
  previousState = roomSongStates.get(roomId) || null,
) {
  const nextState = buildSongState(roomId, payload, userId, previousState);
  roomSongStates.set(roomId, nextState);
  return nextState;
}

function buildSongPayload(type, roomId, extra = {}) {
  return {
    type,
    state: roomSongStates.get(roomId) || null,
    readyUserIds: getRoomSongReadyIds(roomId),
    serverNow: Date.now(),
    ...extra,
  };
}

function sendSongSyncToClient(ws, roomId) {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(buildSongPayload('song:sync', roomId)));
}

function sendSongError(ws, roomId, message, code = 'both_online_required') {
  if (ws.readyState !== ws.OPEN) return;
  ws.send(JSON.stringify(buildSongPayload('song:error', roomId, { message, code })));
}

function broadcastSongEvent(roomId, type, extra = {}) {
  broadcastToRoom(roomId, buildSongPayload(type, roomId, extra), 'chat');
}

function scheduleRoomSongStart(roomId, {
  countdownMs = 3000,
  positionMs = null,
  initiatedByUserId = null,
  eventType = 'song:start',
} = {}) {
  const currentState = roomSongStates.get(roomId);
  if (!currentState?.trackUri) return null;

  const serverNow = Date.now();
  const nextPosition = normalizeSongStartPosition(
    currentState,
    positionMs == null ? getCurrentSongPosition(currentState, serverNow) : positionMs,
  );

  const nextState = setRoomSongState(roomId, {
    isPlaying: true,
    startedAtServerTime: serverNow + Number(countdownMs || 0),
    positionMs: nextPosition,
  }, initiatedByUserId || currentState.selectedByUserId, currentState);

  broadcastSongEvent(roomId, eventType, {
    countdownMs: Number(countdownMs || 0),
    initiatedByUserId: initiatedByUserId ? String(initiatedByUserId) : null,
  });

  return nextState;
}

function broadcastPresenceUpdate(userId, isOnline, wss, extra = {}) {
  const payload = JSON.stringify({
    type: 'presence',
    userId,
    isOnline,
    ...extra, // z.B. lastSeenAt
  });

  for (const client of wss.clients) {
    if (client.readyState === client.OPEN) client.send(payload);
  }
}

// Serverstart + DB-Init + WebSocket
(async () => {
  try {
    await initDb();

    const server = http.createServer(app);
    const wss = new WebSocketServer({ server });
    wssRef = wss;

    wss.on('connection', async (ws, req) => {
      try {
        const url = new URL(req.url, `http://${req.headers.host}`);
        const { pathname } = url;

        // ----------------- CHAT (E2EE) -----------------
        if (pathname === '/ws/chat') {
          const roomId = url.searchParams.get('roomId');
          if (!roomId) {
            ws.close(1008, 'Missing roomId');
            return;
          }

          const cookies = cookie.parse(req.headers.cookie || '');
          const { at } = cookies;
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

          // eslint-disable-next-line no-param-reassign
          ws.userId = user.id;
          // eslint-disable-next-line no-param-reassign
          ws.roomId = roomId;

          addClientToRoom(roomId, ws, 'chat');
          console.log(`WS connected (chat): user ${user.id} room ${roomId}`);
          sendSongSyncToClient(ws, roomId);

          ws.on('message', async (data) => {
            try {
              const msg = JSON.parse(data.toString());

              // Key exchange: relay only (an andere Clients im Room)
              if (msg.type === 'key_exchange') {
                broadcastToRoomExcept(
                  roomId,
                  {
                    type: 'key_exchange',
                    fromUserId: ws.userId,
                    publicKeyJwk: msg.publicKeyJwk,
                  },
                  ws,
                );
                return;
              }

              // typing indicator (nur an andere)
              if (msg.type === 'typing') {
                broadcastToRoomExcept(
                  roomId,
                  {
                    type: 'typing',
                    fromUserId: ws.userId,
                    isTyping: !!msg.isTyping,
                  },
                  ws,
                );
                return;
              }

              // ✅ read receipt (vereinheitlicht auf lastReadMessageId)
              if (msg.type === 'song:sync') {
                sendSongSyncToClient(ws, roomId);
                return;
              }

              if (msg.type === 'song:select') {
                const trackUri = typeof msg.trackUri === 'string' ? msg.trackUri.trim() : '';
                if (!trackUri) return;
                if (!areAllRoomParticipantsOnline(roomId)) {
                  sendSongError(ws, roomId, BOTH_ONLINE_REQUIRED_MESSAGE);
                  return;
                }

                resetRoomSongReady(roomId);
                setRoomSongState(roomId, {
                  trackUri,
                  trackName: typeof msg.trackName === 'string' ? msg.trackName.trim() : null,
                  artists: Array.isArray(msg.artists) ? msg.artists : [],
                  albumImage: typeof msg.albumImage === 'string' ? msg.albumImage : null,
                  durationMs: Number(msg.durationMs) || 0,
                  isPlaying: false,
                  startedAtServerTime: null,
                  positionMs: 0,
                  selectedByUserId: String(ws.userId),
                }, ws.userId, null);

                broadcastSongEvent(roomId, 'song:select', {
                  selectedByUserId: String(ws.userId),
                });
                return;
              }

              if (msg.type === 'song:ready') {
                const currentSong = roomSongStates.get(roomId);
                if (!currentSong?.trackUri) return;
                if (msg.trackUri && String(msg.trackUri) !== String(currentSong.trackUri)) return;
                if (!areAllRoomParticipantsOnline(roomId)) {
                  sendSongError(ws, roomId, BOTH_ONLINE_REQUIRED_MESSAGE);
                  return;
                }

                const readySet = getRoomSongReadySet(roomId);
                readySet.add(String(ws.userId));

                broadcastSongEvent(roomId, 'song:ready', {
                  readyUserId: String(ws.userId),
                });

                const participantIds = getRoomParticipantIds(roomId);
                const everyoneReady = participantIds.length > 0
                  && participantIds.every((participantId) => readySet.has(String(participantId)));

                if (everyoneReady && !currentSong.isPlaying) {
                  scheduleRoomSongStart(roomId, {
                    countdownMs: 3000,
                    positionMs: currentSong.positionMs ?? 0,
                    initiatedByUserId: ws.userId,
                    eventType: 'song:start',
                  });
                }
                return;
              }

              if (msg.type === 'song:pause') {
                const currentSong = roomSongStates.get(roomId);
                if (!currentSong?.trackUri) return;

                const pausedPosition = clampSongPosition(
                  currentSong,
                  msg.positionMs == null ? getCurrentSongPosition(currentSong) : msg.positionMs,
                );

                setRoomSongState(roomId, {
                  isPlaying: false,
                  startedAtServerTime: null,
                  positionMs: pausedPosition,
                }, ws.userId, currentSong);

                broadcastSongEvent(roomId, 'song:pause', {
                  initiatedByUserId: String(ws.userId),
                });
                return;
              }

              if (msg.type === 'song:resume') {
                const currentSong = roomSongStates.get(roomId);
                if (!currentSong?.trackUri) return;
                if (!areAllRoomParticipantsOnline(roomId)) {
                  sendSongError(ws, roomId, BOTH_ONLINE_REQUIRED_MESSAGE);
                  return;
                }

                scheduleRoomSongStart(roomId, {
                  countdownMs: 1500,
                  positionMs: msg.positionMs ?? currentSong.positionMs,
                  initiatedByUserId: ws.userId,
                  eventType: 'song:resume',
                });
                return;
              }

              if (msg.type === 'song:seek') {
                const currentSong = roomSongStates.get(roomId);
                if (!currentSong?.trackUri) return;
                if (!areAllRoomParticipantsOnline(roomId)) {
                  sendSongError(ws, roomId, BOTH_ONLINE_REQUIRED_MESSAGE);
                  return;
                }

                const targetPosition = clampSongPosition(
                  currentSong,
                  msg.positionMs == null ? currentSong.positionMs : msg.positionMs,
                );
                const shouldKeepPlaying = typeof msg.isPlaying === 'boolean'
                  ? msg.isPlaying
                  : currentSong.isPlaying;

                if (shouldKeepPlaying) {
                  scheduleRoomSongStart(roomId, {
                    countdownMs: 1000,
                    positionMs: targetPosition,
                    initiatedByUserId: ws.userId,
                    eventType: 'song:seek',
                  });
                } else {
                  setRoomSongState(roomId, {
                    isPlaying: false,
                    startedAtServerTime: null,
                    positionMs: targetPosition,
                  }, ws.userId, currentSong);

                  broadcastSongEvent(roomId, 'song:seek', {
                    initiatedByUserId: String(ws.userId),
                  });
                }
                return;
              }

              if (msg.type === 'read') {
                const { lastReadMessageId } = msg;
                if (!lastReadMessageId) return;

                const last = await ChatMessage.findByPk(String(lastReadMessageId));
                if (last && String(last.roomId) === String(roomId)) {
                  await ChatMessage.update(
                    {
                      readAt: new Date(),
                      readBy: String(ws.userId),
                    },
                    {
                      where: {
                        roomId,
                        senderId: { [Op.ne]: String(ws.userId) },
                        readAt: null,
                        createdAt: { [Op.lte]: last.createdAt },
                      },
                    },
                  );
                }

                broadcastToRoom(roomId, {
                  type: 'read',
                  fromUserId: ws.userId,
                  lastReadMessageId: String(lastReadMessageId),
                });
                return;
              }

              // encrypted message
              if (msg.type === 'chat_message') {
                const { ciphertext, iv, version } = msg;
                if (!ciphertext || !iv) return;

                const saved = await ChatMessage.create({
                  roomId,
                  senderId: String(ws.userId),
                  ciphertext,
                  iv,
                  plaintext: null,
                  version: version || 'aes-gcm-v1',
                  readAt: null,
                  readBy: null,
                });

                broadcastToRoom(roomId, {
                  type: 'chat_message',
                  message: saved.toJSON(),
                });
              }
            } catch (err) {
              console.error('WS chat message error', err);
            }
          });

          ws.on('close', () => {
            console.log(`WS closed (chat): user ${ws.userId} room ${ws.roomId}`);
            removeClientFromRoom(ws.roomId, ws, 'chat');

            const readySet = roomSongReadyUsers.get(ws.roomId);
            if (readySet) {
              readySet.delete(String(ws.userId));
              if (!readySet.size) {
                roomSongReadyUsers.delete(ws.roomId);
              } else {
                const currentSong = roomSongStates.get(ws.roomId);
                if (currentSong && !currentSong.isPlaying) {
                  broadcastSongEvent(ws.roomId, 'song:sync');
                }
              }
            }
          });

          return;
        }

        // ----------------- SPOTIFY SYNC -----------------
        if (pathname === '/ws/spotify') {
          const roomId = url.searchParams.get('roomId');
          if (!roomId) {
            ws.close(1008, 'Missing roomId');
            return;
          }

          const cookies = cookie.parse(req.headers.cookie || '');
          const { at } = cookies;
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

          // eslint-disable-next-line no-param-reassign
          ws.userId = user.id;
          // eslint-disable-next-line no-param-reassign
          ws.roomId = roomId;

          addClientToRoom(roomId, ws, 'spotify');
          console.log(`WS connected (spotify): user ${user.id} room ${roomId}`);

          ws.on('message', (data) => {
            try {
              const msg = JSON.parse(data.toString());

              // time sync ping/pong
              if (msg.type === 'time_ping') {
                ws.send(
                  JSON.stringify({
                    type: 'time_pong',
                    clientSentAt: msg.clientSentAt,
                    serverNow: Date.now(),
                  }),
                );
                return;
              }

              // host triggers synced start
              if (msg.type === 'spotify_start') {
                const { trackUri, countdownMs = 3000 } = msg;
                if (!trackUri) return;

                const startAt = Date.now() + Number(countdownMs);

                broadcastToRoom(roomId, {
                  type: 'spotify_sync_start',
                  trackUri,
                  startAt,
                  hostId: ws.userId,
                }, 'spotify');
              }
            } catch (e) {
              console.error('WS spotify error', e);
            }
          });

          ws.on('close', () => {
            console.log(`WS closed (spotify): user ${ws.userId} room ${ws.roomId}`);
            removeClientFromRoom(ws.roomId, ws, 'spotify');
          });

          return;
        }

        // --------------- PRESENCE ---------------
        // --------------- PRESENCE ---------------
        if (pathname === '/ws/presence') {
          const cookies = cookie.parse(req.headers.cookie || '');
          const { at } = cookies;
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

          // eslint-disable-next-line no-param-reassign
          ws.userId = user.id;

          // online count erhöhen
          const currentCount = onlineUsers.get(user.id) || 0;
          onlineUsers.set(user.id, currentCount + 1);

          // ✅ Snapshot enthält online users + lastSeen map
          // lastSeen: { [userId]: iso }
          const lastSeenObj = {};
          for (const [uid, iso] of lastSeenAt.entries()) {
            lastSeenObj[String(uid)] = iso;
          }

          ws.send(
            JSON.stringify({
              type: 'presence_snapshot',
              users: Array.from(onlineUsers.keys()).map(String),
              lastSeen: lastSeenObj,
            }),
          );

          // ✅ Online broadcast
          broadcastPresenceUpdate(String(user.id), true, wss);

          ws.on('close', () => {
            const prev = onlineUsers.get(user.id) || 1;
            const next = prev - 1;

            if (next <= 0) {
              onlineUsers.delete(user.id);

              // ✅ lastSeen timestamp setzen (offline seit jetzt)
              const iso = new Date().toISOString();
              lastSeenAt.set(String(user.id), iso);

              // ✅ Offline broadcast mit lastSeenAt
              broadcastPresenceUpdate(String(user.id), false, wss, { lastSeenAt: iso });
            } else {
              onlineUsers.set(user.id, next);
            }
          });

          return;
        }

        // Unknown WS path
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
})();

export default app;
