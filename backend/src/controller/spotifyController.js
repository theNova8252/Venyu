import asyncHandler from 'express-async-handler';
import {
  buildAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  fetchMe,
} from '../model/spotifyModel.js';

export const login = asyncHandler(async (req, res) => {
  const state = req.query.state || '';
  const url = buildAuthUrl(state);
  return res.redirect(url);
});

export const callback = asyncHandler(async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.status(400).json({ error });

  const tokens = await exchangeCodeForTokens(code);
  return res.status(200).json({
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresIn: tokens.expires_in,
  });
});

export const refresh = asyncHandler(async (req, res) => {
  const { refresh_token: refreshToken } = req.body ?? {};
  if (!refreshToken) {
    return res.status(400).json({ error: 'refresh_token required' });
  }

  const tokens = await refreshAccessToken(refreshToken);
  return res.status(200).json({
    accessToken: tokens.access_token,
    expiresIn: tokens.expires_in,
    // Spotify may or may not return a new refresh_token; fall back to the one we have
    refreshToken: tokens.refresh_token ?? refreshToken,
  });
});

export const me = asyncHandler(async (req, res) => {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing Bearer token' });

  const profile = await fetchMe(token);
  return res.status(200).json(profile);
});
