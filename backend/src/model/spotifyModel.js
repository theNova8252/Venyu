import dotenv from 'dotenv';

dotenv.config();

// eslint-disable-next-line import/prefer-default-export
const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } = process.env;

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const AUTH_URL = 'https://accounts.spotify.com/authorize';

const SCOPES = [
  'user-read-email',
  'user-read-private',
  'user-top-read',
  'playlist-read-private',
].join(' ');

export const buildAuthUrl = (state = '') => {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SCOPES,
    state,
  });
  return `${AUTH_URL}?${params.toString()}`;
};

export const exchangeCodeForTokens = async (code) => {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
    client_id: SPOTIFY_CLIENT_ID,
    client_secret: SPOTIFY_CLIENT_SECRET,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`);
  return res.json(); // { access_token, token_type, scope, expires_in, refresh_token }
};

export const refreshAccessToken = async (refreshToken) => {
  const body = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
    client_id: SPOTIFY_CLIENT_ID,
    client_secret: SPOTIFY_CLIENT_SECRET,
  });

  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  if (!res.ok) throw new Error(`Refresh failed: ${res.status}`);
  return res.json(); // { access_token, token_type, scope, expires_in, refresh_token? }
};

export const fetchMe = async (accessToken) => {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Spotify /me failed: ${res.status}`);
  return res.json();
};
