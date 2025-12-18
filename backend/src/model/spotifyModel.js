// backend/src/model/spotifyModel.js
import dotenv from 'dotenv';

dotenv.config();

const SPOTIFY_AUTH = 'https://accounts.spotify.com';
const SPOTIFY_API = 'https://api.spotify.com/v1';

function assertEnv(name) {
  if (!process.env[name]) throw new Error(`Missing env: ${name}`);
}

function basicAuthHeader() {
  assertEnv('SPOTIFY_CLIENT_ID');
  assertEnv('SPOTIFY_CLIENT_SECRET');
  const raw = `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`;
  const b64 = Buffer.from(raw).toString('base64');
  return `Basic ${b64}`;
}

async function spotifyFetch(url, accessToken, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (res.status === 204) return null;

  const text = await res.text().catch(() => '');
  if (!res.ok) {
    throw new Error(text || `Spotify API error ${res.status}`);
  }

  return text ? JSON.parse(text) : null;
}

// ================= AUTH =================
export function buildAuthUrl(state = '') {
  assertEnv('SPOTIFY_CLIENT_ID');
  assertEnv('SPOTIFY_REDIRECT_URI');

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
    scope: [
      'user-read-email',
      'user-read-private',
      'user-top-read',
      'user-read-playback-state',
      'user-modify-playback-state',
      'user-read-currently-playing',
      'streaming',
    ].join(' '),
    state,
    show_dialog: 'true',
  });

  return `${SPOTIFY_AUTH}/authorize?${params.toString()}`;
}

export async function exchangeCodeForTokens(code) {
  assertEnv('SPOTIFY_REDIRECT_URI');

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI,
  });

  const res = await fetch(`${SPOTIFY_AUTH}/api/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) throw new Error(text || `token exchange failed ${res.status}`);
  return JSON.parse(text);
}

export async function refreshAccessToken(refreshToken) {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const res = await fetch(`${SPOTIFY_AUTH}/api/token`, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body,
  });

  const text = await res.text().catch(() => '');
  if (!res.ok) throw new Error(text || `token refresh failed ${res.status}`);
  return JSON.parse(text);
}

// ================= PROFILE / TOP =================
export async function fetchMe(accessToken) {
  return spotifyFetch(`${SPOTIFY_API}/me`, accessToken);
}

export async function fetchTopArtists(accessToken, { time_range = 'medium_term', limit = 20 } = {}) {
  const qs = new URLSearchParams({ time_range, limit: String(limit) });
  return spotifyFetch(`${SPOTIFY_API}/me/top/artists?${qs.toString()}`, accessToken);
}

export async function fetchTopTracks(accessToken, { time_range = 'medium_term', limit = 20 } = {}) {
  const qs = new URLSearchParams({ time_range, limit: String(limit) });
  return spotifyFetch(`${SPOTIFY_API}/me/top/tracks?${qs.toString()}`, accessToken);
}

// ================= CURRENTLY PLAYING =================
export async function fetchCurrentlyPlaying(accessToken) {
  // Spotify returns 204 if nothing playing
  const res = await fetch(`${SPOTIFY_API}/me/player/currently-playing`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (res.status === 204) return null;

  const text = await res.text().catch(() => '');
  if (!res.ok) throw new Error(text || `currently-playing failed ${res.status}`);
  return text ? JSON.parse(text) : null;
}

// ================= DEVICES / PLAYBACK =================
export async function fetchDevices(accessToken) {
  return spotifyFetch(`${SPOTIFY_API}/me/player/devices`, accessToken);
}

export async function startPlayback(
  accessToken,
  { deviceId = null, uris = [], positionMs = 0 } = {},
) {
  const url = deviceId
    ? `${SPOTIFY_API}/me/player/play?device_id=${encodeURIComponent(deviceId)}`
    : `${SPOTIFY_API}/me/player/play`;

  // Spotify erwartet: { uris: [...] , position_ms: ... }
  await spotifyFetch(url, accessToken, {
    method: 'PUT',
    body: JSON.stringify({
      uris,
      position_ms: positionMs,
    }),
  });

  return { ok: true };
}
