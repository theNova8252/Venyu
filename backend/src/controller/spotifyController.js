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

export const callback = async (req, res, next) => {
  try {
    const { code, error } = req.query;
    if (error) return res.status(400).json({ error });
    if (!code) return res.status(400).json({ error: 'missing_code' });

    const tokens = await exchangeCodeForTokens(code);
    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const me = await fetchMe(tokens.access_token);
    const avatar = me.images?.[0]?.url || null;

    const [user, created] = await User.upsert(
      {
        spotify_id: me.id,
        display_name: me.display_name || null,
        email: me.email || null,
        avatar_url: avatar,
        country: me.country || null,
        product: me.product || null,
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token ?? null,
        token_expires_at: expiresAt,
      },
      { returning: true, conflictFields: ['spotify_id'] },
    );

    if (tokens.refresh_token) {
      res.cookie('rt', tokens.refresh_token, {
        ...COOKIE_OPTS_BASE,
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });
    }
    res.cookie('at', tokens.access_token, {
      ...COOKIE_OPTS_BASE,
      maxAge: tokens.expires_in * 1000,
    });

    return res.status(200).json({
      message: created ? 'user_created' : 'user_updated',
      user: {
        id: user.id,
        spotify_id: user.spotify_id,
        display_name: user.display_name,
        email: user.email,
        avatar_url: user.avatar_url,
        product: user.product,
        country: user.country,
      },
    });
  } catch (err) {
    return next(err);
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
