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

export const login = (req, res) => {
  const state = req.query.state || '';
  return res.redirect(buildAuthUrl(state));
};

export const callback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send('Missing code');

    const tokens = await exchangeCodeForTokens(code);
    const me = await fetchMe(tokens.access_token); // Spotify /me

    // insert or update user
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

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

    // redirect back to app
    const ret = (() => {
      try {
        return JSON.parse(Buffer.from(state || '', 'base64').toString())?.returnTo;
      } catch {
        return null;
      }
    })();
    const to = ret || process.env.FRONTEND_URL || 'http://127.0.0.1:8080';
    return res.redirect(to);
  } catch (e) {
    console.error('Callback error:', e); // <-- log full error
    return res.status(500).send(e?.message || 'Error');
  }
};

export const me = async (req, res, next) => {
  try {
    const { at } = req.cookies || {};
    if (!at) return res.status(401).json({ error: 'no_access_token' });

    const profile = await fetchMe(at);
    const user = await User.findOne({ where: { spotify_id: profile.id } });
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    return res.json({
      id: user.id,
      display_name: user.display_name,
      email: user.email,
      avatar_url: user.avatar_url,
      country: user.country,
      product: user.product,
    });
  } catch (e) {
    return next(e);
  }
};

/**
 * POST /auth/refresh
 * Nimmt Refresh-Token aus Cookie 'rt' (oder req.body.refresh_token),
 * holt neues Access-Token, aktualisiert DB & setzt neues 'at'-Cookie.
 */
export const refresh = async (req, res, next) => {
  try {
    const cookieRt = (req.cookies && req.cookies.rt) || null;
    const bodyRt = (req.body && req.body.refresh_token) || null;
    const rt = bodyRt || cookieRt;

    if (!rt) return res.status(400).json({ error: 'missing_refresh_token' });

    const data = await refreshAccessToken(rt); // { access_token, expires_in, refresh_token? }
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);

    // Wer ist der User? -> /me mit neuem Access-Token
    const profile = await fetchMe(data.access_token);

    // DB updaten
    const updates = {
      access_token: data.access_token,
      token_expires_at: expiresAt,
    };
    if (data.refresh_token) updates.refresh_token = data.refresh_token;

    await User.update(updates, { where: { spotify_id: profile.id } });

    // Cookies setzen
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

/**
 * POST /auth/logout
 * Cookies löschen und (optional) Tokens in DB invalidieren.
 */
export const logout = async (req, res, next) => {
  try {
    const { at } = req.cookies || {};
    // Optional: User in DB finden und Tokens leeren
    if (at) {
      try {
        const profile = await fetchMe(at);
        await User.update(
          { access_token: null, refresh_token: null, token_expires_at: null },
          { where: { spotify_id: profile.id } },
        );
      } catch {
        // Wenn /me mit abgelaufenem Token fehlschlägt, ignorieren wir das hier.
      }
    }

    res.clearCookie('at', { path: '/' });
    res.clearCookie('rt', { path: '/' });

    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
};
