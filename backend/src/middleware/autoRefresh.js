import { refreshAccessToken } from '../model/spotifyModel.js';

const isDev = (process.env.MODE || process.env.NODE_ENV) !== 'production';

const COOKIE_OPTS_BASE = {
  httpOnly: true,
  sameSite: isDev ? 'lax' : 'none',
  secure: !isDev,
  path: '/',
};

/**
 * Middleware: if the access-token cookie (`at`) is missing but the
 * refresh-token cookie (`rt`) still exists, silently refresh the token
 * and set the new cookies before the request reaches route handlers.
 */
export const autoRefreshToken = async (req, res, next) => {
  const { at, rt } = req.cookies || {};

  // Skip if access token is present or no refresh token available
  // Also skip the login/callback routes to avoid loops
  if (at || !rt || req.path.startsWith('/spotify/auth/')) {
    return next();
  }

  try {
    const data = await refreshAccessToken(rt);

    res.cookie('at', data.access_token, {
      ...COOKIE_OPTS_BASE,
      maxAge: data.expires_in * 1000,
    });

    if (data.refresh_token) {
      res.cookie('rt', data.refresh_token, {
        ...COOKIE_OPTS_BASE,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    // Make the new token available to downstream handlers
    req.cookies.at = data.access_token;
    if (data.refresh_token) {
      req.cookies.rt = data.refresh_token;
    }
  } catch (err) {
    // Refresh failed — clear stale cookies so the user is prompted to re-login
    res.clearCookie('at', { path: '/' });
    res.clearCookie('rt', { path: '/' });
  }

  next();
};
