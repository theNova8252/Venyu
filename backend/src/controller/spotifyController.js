// backend/src/controller/spotifyController.js
import dotenv from 'dotenv';
import {
  buildAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  fetchMe,
} from '../model/spotifyModel.js';
import User from '../model/User.js';

dotenv.config();

const COOKIE_OPTS_BASE = {
  httpOnly: true,
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/',
};

// ======================= LOGIN =======================
export const login = (req, res) => {
  const state = req.query.state || '';
  return res.redirect(buildAuthUrl(state));
};

// ======================= CALLBACK ====================
export const callback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send('Missing code');

    const tokens = await exchangeCodeForTokens(code);
    const me = await fetchMe(tokens.access_token);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    // ⚠ Wichtig: spotifyId (JS-Name), nicht spotify_id
    let user = await User.findOne({ where: { spotifyId: me.id } });

    if (user) {
      await user.update({
        displayName: me.display_name ?? null,
        email: me.email ?? null,
        avatarUrl: me.images?.[0]?.url ?? null,
        country: me.country ?? null,
        product: me.product ?? null,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? user.refreshToken,
        tokenExpiresAt: expiresAt,
      });
    } else {
      user = await User.create({
        spotifyId: me.id,
        displayName: me.display_name ?? null,
        email: me.email ?? null,
        avatarUrl: me.images?.[0]?.url ?? null,
        country: me.country ?? null,
        product: me.product ?? null,
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token ?? null,
        tokenExpiresAt: expiresAt,
      });
    }

    console.log('User upserted:', user.id, user.spotifyId);

    // Cookies setzen
    res.cookie('at', tokens.access_token, {
      ...COOKIE_OPTS_BASE,
      maxAge: tokens.expires_in * 1000,
    });

    if (tokens.refresh_token) {
      res.cookie('rt', tokens.refresh_token, {
        ...COOKIE_OPTS_BASE,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }

    // Redirect zurück zum Frontend
    const ret = (() => {
      try {
        return JSON.parse(
          Buffer.from(state || '', 'base64').toString()
        )?.returnTo;
      } catch {
        return null;
      }
    })();

    const to = ret || process.env.FRONTEND_URL || 'http://127.0.0.1:8080';
    return res.redirect(to);
  } catch (e) {
    console.error('Callback error:', e);
    return res.status(500).send(e?.message || 'Error');
  }
};

// ======================= ME ==========================
export const me = async (req, res, next) => {
  try {
    const { at } = req.cookies || {};
    if (!at) return res.status(401).json({ error: 'no_access_token' });

    const profile = await fetchMe(at); // Spotify-Profil
    const user = await User.findOne({ where: { spotifyId: profile.id } });
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    return res.json({
      id: user.id,
      display_name: user.displayName,
      email: user.email,
      avatar_url: user.avatarUrl,
      country: user.country,
      product: user.product,
    });
  } catch (e) {
    return next(e);
  }
};

// ======================= REFRESH =====================
export const refresh = async (req, res, next) => {
  try {
    const cookieRt = (req.cookies && req.cookies.rt) || null;
    const bodyRt = (req.body && req.body.refresh_token) || null;
    const rt = bodyRt || cookieRt;

    if (!rt) return res.status(400).json({ error: 'missing_refresh_token' });

    const data = await refreshAccessToken(rt);
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    const profile = await fetchMe(data.access_token);

    const updates = {
      accessToken: data.access_token,
      tokenExpiresAt: expiresAt,
    };
    if (data.refresh_token) updates.refreshToken = data.refresh_token;

    await User.update(updates, { where: { spotifyId: profile.id } });

    if (data.refresh_token) {
      res.cookie('rt', data.refresh_token, {
        ...COOKIE_OPTS_BASE,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }
    res.cookie('at', data.access_token, {
      ...COOKIE_OPTS_BASE,
      maxAge: data.expires_in * 1000,
    });

    return res.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
      refreshed: true,
    });
  } catch (err) {
    return next(err);
  }
};

// ======================= LOGOUT ======================
export const logout = async (req, res, next) => {
  try {
    res.clearCookie('at', { path: '/' });
    res.clearCookie('rt', { path: '/' });
    return res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
