import dotenv from 'dotenv';

dotenv.config();

const { SPOTIFY_CLIENT_ID, SPOTIFY_CLIENT_SECRET, SPOTIFY_REDIRECT_URI } = process.env;

const TOKEN_URL = 'https://accounts.spotify.com/api/token';
const AUTH_URL = 'https://accounts.spotify.com/authorize';

const SCOPES = [
  'user-read-email',
  'user-read-private',
  'user-top-read',
  'playlist-read-private',
].join(' ');

// -------- Helpers --------
function basicAuthHeader() {
  const b64 = Buffer.from(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`).toString('base64');
  return `Basic ${b64}`;
}

async function postToken(params) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(params),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Spotify token request failed: ${res.status} ${text}`);
  }
  return res.json();
}

// -------- Public API --------
export const buildAuthUrl = (state = '') => {
  const params = new URLSearchParams({
    client_id: SPOTIFY_CLIENT_ID,
    response_type: 'code',
    redirect_uri: SPOTIFY_REDIRECT_URI,
    scope: SCOPES,
    state,
    show_dialog: 'false',
  });
  return `${AUTH_URL}?${params.toString()}`;
};

export const exchangeCodeForTokens = async (code) =>
  postToken({
    grant_type: 'authorization_code',
    code,
    redirect_uri: SPOTIFY_REDIRECT_URI,
  });

export const refreshAccessToken = async (refreshToken) =>
  postToken({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

export const fetchMe = async (accessToken) => {
  const res = await fetch('https://api.spotify.com/v1/me', {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Spotify /me failed: ${res.status} ${text}`);
  }
  return res.json();
};
