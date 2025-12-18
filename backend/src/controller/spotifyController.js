// backend/src/controller/spotifyController.js
import dotenv from 'dotenv';
import {
  buildAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  fetchMe,
  fetchTopArtists,
  fetchTopTracks,
<<<<<<< Updated upstream
  fetchCurrentlyPlaying,
=======
  fetchDevices,
  startPlayback,
>>>>>>> Stashed changes
} from '../model/spotifyModel.js';
import User from '../model/User.js';

dotenv.config();

const COOKIE_OPTS_BASE = {
  httpOnly: true,
  sameSite: 'none',
  secure: true,
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

    const [me, topArtistsRes, topTracksRes] = await Promise.all([
      fetchMe(tokens.access_token),
      fetchTopArtists(tokens.access_token, { time_range: 'medium_term', limit: 20 }),
      fetchTopTracks(tokens.access_token, { time_range: 'medium_term', limit: 20 }),
    ]);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const topArtists = topArtistsRes.items.map((a) => ({
      id: a.id,
      name: a.name,
      genres: a.genres,
      popularity: a.popularity,
      image: a.images?.[0]?.url ?? null,
      uri: a.uri,
      followers: a.followers,
    }));

    const topTracks = topTracksRes.items.map((t) => ({
      id: t.id,
      name: t.name,
      uri: t.uri,
      previewUrl: t.preview_url,
      durationMs: t.duration_ms,
      popularity: t.popularity,
      album: {
        id: t.album?.id,
        name: t.album?.name,
        image: t.album?.images?.[0]?.url ?? null,
      },
      artists:
        t.artists?.map((a) => ({
          id: a.id,
          name: a.name,
          uri: a.uri,
        })) ?? [],
    }));

    const genresSet = new Set();
    topArtists.forEach((a) => (a.genres || []).forEach((g) => genresSet.add(g)));
    const genres = Array.from(genresSet);

    let user = await User.findOne({ where: { spotifyId: me.id } });

    const userPayload = {
      displayName: me.display_name ?? null,
      email: me.email ?? null,
      avatarUrl: me.images?.[0]?.url ?? null,
      country: me.country ?? null,
      product: me.product ?? null,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? (user ? user.refreshToken : null),
      tokenExpiresAt: expiresAt,
      topArtists,
      topTracks,
      genres,
    };

    if (user) await user.update(userPayload);
    else {
      user = await User.create({
        ...userPayload,
        spotifyId: me.id,
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
    console.error('Callback error:', e);
    return res.status(500).send(e?.message || 'Error');
  }
};

export const me = async (req, res, next) => {
  try {
    const { at } = req.cookies || {};
    if (!at) return res.status(401).json({ error: 'no_access_token' });

    const profile = await fetchMe(at);
    const user = await User.findOne({ where: { spotifyId: profile.id } });
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    return res.json({
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      country: user.country,
      product: user.product,
      topArtists: user.topArtists,
      topTracks: user.topTracks,
      genres: user.genres,
    });
  } catch (e) {
    return next(e);
  }
};

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

export const logout = async (req, res, next) => {
  try {
    res.clearCookie('at', { path: '/' });
    res.clearCookie('rt', { path: '/' });
    return res.json({ success: true });
  } catch (err) {
    return next(err);
  }
};

<<<<<<< Updated upstream
// currently playing
export const syncCurrentlyPlaying = async (req, res, next) => {
  try {
    const { at } = req.cookies || {};
    if (!at) return res.status(401).end();

    const profile = await fetchMe(at);
    const user = await User.findOne({ where: { spotifyId: profile.id } });
    if (!user) return res.status(404).end();

    if (!user.shareCurrentlyPlaying) {
      await user.update({ currentlyPlaying: null });
      return res.json({ ok: true });
    }

    const data = await fetchCurrentlyPlaying(at);

    const payload = data?.item
      ? {
        isPlaying: true,
        updatedAt: new Date().toISOString(),
        track: {
          name: data.item.name,
          artists: data.item.artists.map((a) => a.name),
          albumImage: data.item.album.images?.[0]?.url ?? null,
        },
      }
      : { isPlaying: false, updatedAt: new Date().toISOString() };

    await user.update({ currentlyPlaying: payload });
    return res.json(payload);
=======
export const devices = async (req, res, next) => {
  try {
    const { at } = req.cookies || {};
    if (!at) return res.status(401).json({ error: 'no_access_token' });

    const data = await fetchDevices(at);
    return res.json(data);
  } catch (e) {
    return next(e);
  }
};

export const play = async (req, res, next) => {
  try {
    const { at } = req.cookies || {};
    if (!at) return res.status(401).json({ error: 'no_access_token' });

    const { trackUri, deviceId, positionMs } = req.body || {};
    if (!trackUri) return res.status(400).json({ error: 'missing_trackUri' });

    let finalDeviceId = deviceId || null;
    if (!finalDeviceId) {
      const devs = await fetchDevices(at);
      const active = devs?.devices?.find((d) => d.is_active);
      finalDeviceId = active?.id || devs?.devices?.[0]?.id || null;
    }

    await startPlayback(at, {
      deviceId: finalDeviceId,
      uris: [trackUri],
      positionMs: positionMs ?? 0,
    });

    return res.json({ ok: true, deviceId: finalDeviceId });
>>>>>>> Stashed changes
  } catch (e) {
    return next(e);
  }
};
