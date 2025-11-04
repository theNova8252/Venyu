import dotenv from 'dotenv';
import asyncHandler from 'express-async-handler';
import {
  buildAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  fetchMe,
} from '../model/spotifyModel.js';

dotenv.config();

const COOKIE_OPTS_BASE = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
};

export const login = asyncHandler(async (req, res) => {
  const state = req.query.state || '';
  return res.redirect(buildAuthUrl(state));
});

export const callback = asyncHandler(async (req, res) => {
  const { code, error } = req.query;
  if (error) return res.status(400).json({ error });

  const tokens = await exchangeCodeForTokens(code);
  const { access_token: accessToken, refresh_token: refreshToken, expires_in: expiresIn } = tokens;

  // set httpOnly cookies
  res.cookie('rt', refreshToken, {
    ...COOKIE_OPTS_BASE,
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });
  res.cookie('at', accessToken, {
    ...COOKIE_OPTS_BASE,
    maxAge: expiresIn * 1000, // ~1 hour
  });

  // send them to onboarding
  const redirectTo = `${process.env.FRONTEND_URL}/onboarding`;
  return res.redirect(302, redirectTo);
});

export const refresh = asyncHandler(async (req, res) => {
  // allow either body refresh_token OR cookie
  const refreshToken = req.body?.refresh_token || req.cookies?.rt;
  if (!refreshToken) {
    return res.status(400).json({ error: 'refresh_token required' });
  }

  const refreshed = await refreshAccessToken(refreshToken);
  const {
    access_token: accessToken,
    refresh_token: newRefreshToken,
    expires_in: expiresIn,
  } = refreshed;

  // rotate cookies if we got a new refresh token
  if (newRefreshToken) {
    res.cookie('rt', newRefreshToken, {
      ...COOKIE_OPTS_BASE,
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });
  }

  res.cookie('at', accessToken, {
    ...COOKIE_OPTS_BASE,
    maxAge: expiresIn * 1000,
  });

  return res.status(200).json({
    accessToken,
    expiresIn,
  });
});

export const me = asyncHandler(async (req, res) => {
  // 1) try Authorization: Bearer ...
  const auth = req.headers.authorization || '';
  let token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

  // 2) else try to mint from refresh cookie transparently
  if (!token && req.cookies?.rt) {
    const minted = await refreshAccessToken(req.cookies.rt);
    const { access_token: accessToken, expires_in: expiresIn } = minted;

    token = accessToken;
    res.cookie('at', accessToken, {
      ...COOKIE_OPTS_BASE,
      maxAge: expiresIn * 1000,
    });
  }

  if (!token) return res.status(401).json({ error: 'Not authenticated' });

  const profile = await fetchMe(token);
  return res.status(200).json(profile);
});

export const logout = asyncHandler(async (req, res) => {
  res.clearCookie('rt', COOKIE_OPTS_BASE);
  res.clearCookie('at', COOKIE_OPTS_BASE);
  return res.status(204).end();
});
