// backend/src/controller/spotifyController.js
import dotenv from 'dotenv';
import {
  buildAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  fetchMe,
  fetchTopArtists,
  fetchTopTracks,
  fetchRecentlyPlayed,
  fetchCurrentlyPlaying,
  fetchDevices,
  startPlayback,
} from '../model/spotifyModel.js';
import User from '../model/User.js';
import SpotifyToken from '../model/SpotifyToken.js';
import SpotifyData from '../model/SpotifyData.js';

dotenv.config();

const isDev = (process.env.MODE || process.env.NODE_ENV) !== 'production';

const COOKIE_OPTS_BASE = {
  httpOnly: true,
  sameSite: isDev ? 'lax' : 'none',
  secure: !isDev,
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

    const [meProfile, topArtistsRes, topTracksRes, recentlyPlayedRes] = await Promise.all([
      fetchMe(tokens.access_token),
      fetchTopArtists(tokens.access_token, { timeRange: 'medium_term', limit: 20 }),
      fetchTopTracks(tokens.access_token, { timeRange: 'medium_term', limit: 20 }),
      fetchRecentlyPlayed(tokens.access_token, { limit: 20 }),
    ]);

    const expiresAt = new Date(Date.now() + tokens.expires_in * 1000);

    const topArtists = (topArtistsRes?.items || []).map((a) => ({
      id: a.id,
      name: a.name,
      genres: a.genres,
      popularity: a.popularity,
      image: a.images?.[0]?.url ?? null,
      uri: a.uri,
      followers: a.followers,
    }));

    const topTracks = (topTracksRes?.items || []).map((t) => ({
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
      artists: (t.artists || []).map((a) => ({
        id: a.id,
        name: a.name,
        uri: a.uri,
      })),
    }));
    const recentlyPlayed = (recentlyPlayedRes?.items || []).map((item) => ({
      playedAt: item.played_at,
      track: {
        id: item.track.id,
        name: item.track.name,
        uri: item.track.uri,
        previewUrl: item.track.preview_url,
        album: {
          id: item.track.album?.id,
          name: item.track.album?.name,
          image: item.track.album?.images?.[0]?.url ?? null,
        },
        artists: (item.track.artists || []).map((a) => ({
          id: a.id,
          name: a.name,
        })),
      },
    }));

    const genresSet = new Set();
    topArtists.forEach((a) => (a.genres || []).forEach((g) => genresSet.add(g)));
    const genres = Array.from(genresSet);

    let user = await User.findOne({ where: { spotifyId: meProfile.id } });

    const userPayload = {
      displayName: meProfile.display_name ?? null,
      email: meProfile.email ?? null,
      avatarUrl: meProfile.images?.[0]?.url ?? null,
      country: meProfile.country ?? null,
      product: meProfile.product ?? null,
    };

    if (user) {
      await user.update(userPayload);
    } else {
      user = await User.create({
        ...userPayload,
        spotifyId: meProfile.id,
      });
    }

    // Upsert auth tokens into spotify_tokens
    await SpotifyToken.upsert({
      userId: user.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? (await SpotifyToken.findByPk(user.id))?.refreshToken ?? null,
      tokenExpiresAt: expiresAt,
    });

    // Upsert music data into spotify_data
    await SpotifyData.upsert({
      userId: user.id,
      topArtists,
      topTracks,
      recentlyPlayed,
      genres,
    });

    // cookies
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

    // redirect back
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
    console.error('Callback error:', e?.message || e);
    return res.status(500).send(e?.message || 'callback_failed');
  }
};

// ======================= ME ==========================
export const me = async (req, res, next) => {
  try {
    const { at } = req.cookies || {};
    if (!at) return res.status(401).json({ error: 'no_access_token' });

    const profile = await fetchMe(at);
    const user = await User.findOne({ where: { spotifyId: profile.id } });
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    const spotifyData = await SpotifyData.findByPk(user.id);

    return res.json({
      id: user.id,
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      country: user.country,
      product: user.product,
      topArtists: spotifyData?.topArtists ?? [],
      topTracks: spotifyData?.topTracks ?? [],
      recentlyPlayed: spotifyData?.recentlyPlayed ?? [],
      genres: spotifyData?.genres ?? [],
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

    // save to spotify_tokens
    const profile = await fetchMe(data.access_token);
    const expiresAt = new Date(Date.now() + data.expires_in * 1000);
    const user = await User.findOne({ where: { spotifyId: profile.id } });
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    const tokenUpdates = {
      userId: user.id,
      accessToken: data.access_token,
      tokenExpiresAt: expiresAt,
    };
    if (data.refresh_token) tokenUpdates.refreshToken = data.refresh_token;

    await SpotifyToken.upsert(tokenUpdates);

    // cookies
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
  } catch (e) {
    console.error('refresh error:', e?.message || e);
    return next(e);
  }
};

// ======================= LOGOUT ======================
export const logout = async (_req, res, next) => {
  try {
    res.clearCookie('at', { path: '/' });
    res.clearCookie('rt', { path: '/' });
    return res.json({ success: true });
  } catch (e) {
    return next(e);
  }
};

// ======================= CURRENTLY PLAYING ===========
export const currentlyPlaying = async (req, res, next) => {
  try {
    const { at } = req.cookies || {};
    if (!at) return res.status(401).json({ error: 'no_access_token' });

    let accessToken = at;

    // If userId is provided, look up that user's token instead
    const { userId } = req.query || {};
    if (userId) {
      const targetToken = await SpotifyToken.findByPk(userId);
      if (!targetToken || !targetToken.accessToken) {
        return res.json({ isPlaying: false });
      }
      accessToken = targetToken.accessToken;
    }

    const data = await fetchCurrentlyPlaying(accessToken);

    if (!data || !data.item) {
      return res.json({ isPlaying: false });
    }

    return res.json({
      isPlaying: data.is_playing ?? false,
      trackName: data.item.name ?? null,
      artistName: (data.item.artists || []).map((a) => a.name).join(', '),
      albumName: data.item.album?.name ?? null,
      albumImage: data.item.album?.images?.[0]?.url ?? null,
      trackUri: data.item.uri ?? null,
      progressMs: data.progress_ms ?? 0,
      durationMs: data.item.duration_ms ?? 0,
    });
  } catch (e) {
    console.error('currentlyPlaying error:', e?.message || e);
    return res.json({ isPlaying: false });
  }
};

// ======================= DEVICES =====================
export const devices = async (req, res) => {
  try {
    const { at } = req.cookies || {};
    if (!at) return res.status(401).json({ error: 'no_access_token' });

    const data = await fetchDevices(at);
    return res.json(data);
  } catch (e) {
    console.error('devices error:', e?.message || e);
    return res.status(500).json({ error: e?.message || 'devices_failed' });
  }
};

// ======================= PLAY ========================
export const play = async (req, res) => {
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

      if (!finalDeviceId) {
        return res.status(409).json({
          error: 'no_device_available',
          hint: 'Öffne Spotify (Handy/Desktop) und starte kurz einen Song, dann nochmal.',
        });
      }
    }

    await startPlayback(at, {
      deviceId: finalDeviceId,
      uris: [trackUri],
      positionMs: positionMs ?? 0,
    });

    return res.json({ ok: true, deviceId: finalDeviceId });
  } catch (e) {
    console.error('play error:', e?.message || e);
    return res.status(500).json({
      error: e?.message || 'play_failed',
      hint: 'Wenn 403: oft Premium/Scopes/Token.',
    });
  }
};

// ======================= SYNC MUSIC DATA =====================
export const syncMusicData = async (req, res, next) => {
  try {
    const { at } = req.cookies || {};
    if (!at) return res.status(401).json({ error: 'no_access_token' });

    const profile = await fetchMe(at);
    const user = await User.findOne({ where: { spotifyId: profile.id } });
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    console.log('🔄 Syncing music data for user:', user.displayName);

    // Fetch fresh data from Spotify
    const [topArtistsRes, topTracksRes, meProfile, recentlyPlayedRes] = await Promise.all([
      fetchTopArtists(at, { timeRange: 'medium_term', limit: 20 }),
      fetchTopTracks(at, { timeRange: 'medium_term', limit: 20 }),
      fetchMe(at),
      fetchRecentlyPlayed(at, { limit: 20 }),
    ]);

    const topArtists = (topArtistsRes?.items || []).map((a) => ({
      id: a.id,
      name: a.name,
      genres: a.genres,
      popularity: a.popularity,
      image: a.images?.[0]?.url ?? null,
      uri: a.uri,
      followers: a.followers,
    }));

    const topTracks = (topTracksRes?.items || []).map((t) => ({
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
      artists: (t.artists || []).map((a) => ({
        id: a.id,
        name: a.name,
        uri: a.uri,
      })),
    }));

    const genresSet = new Set();
    topArtists.forEach((a) => (a.genres || []).forEach((g) => genresSet.add(g)));
    const genres = Array.from(genresSet);

    const recentlyPlayed = (recentlyPlayedRes?.items || []).map((item) => ({
      playedAt: item.played_at,
      track: {
        id: item.track.id,
        name: item.track.name,
        uri: item.track.uri,
        previewUrl: item.track.preview_url,
        album: {
          id: item.track.album?.id,
          name: item.track.album?.name,
          image: item.track.album?.images?.[0]?.url ?? null,
        },
        artists: (item.track.artists || []).map((a) => ({
          id: a.id,
          name: a.name,
        })),
      },
    }));

    console.log(`  ✅ Found ${topArtists.length} artists, ${genres.length} genres`);

    // Update music data in spotify_data table
    await SpotifyData.upsert({
      userId: user.id,
      topArtists,
      topTracks,
      recentlyPlayed,
      genres,
    });

    // Update avatar on user profile if changed
    const newAvatar = meProfile.images?.[0]?.url ?? null;
    if (newAvatar && newAvatar !== user.avatarUrl) {
      await user.update({ avatarUrl: newAvatar });
    }

    return res.json({
      success: true,
      topArtists: topArtists.length,
      topTracks: topTracks.length,
      genres: genres.length,
    });
  } catch (e) {
    console.error('syncMusicData error:', e);
    return next(e);
  }
};
