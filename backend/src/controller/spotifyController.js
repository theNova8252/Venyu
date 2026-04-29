// backend/src/controller/spotifyController.js
import dotenv from 'dotenv';
import {
  buildAuthUrl,
  exchangeCodeForTokens,
  refreshAccessToken,
  fetchMe,
  fetchTopArtists,
  fetchTopTracks,
  fetchAudioFeatures,
  fetchRecentlyPlayed,
  fetchCurrentlyPlaying,
  fetchDevices,
  searchTracks as searchSpotifyTracks,
  startPlayback,
  pausePlayback,
  seekPlayback,
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

const normalizeBase64Url = (value) => {
  if (typeof value !== 'string') return '';

  const normalized = value
    .trim()
    .replace(/ /g, '+')
    .replace(/-/g, '+')
    .replace(/_/g, '/');

  const padding = normalized.length % 4;
  if (padding === 0) return normalized;

  return normalized.padEnd(normalized.length + (4 - padding), '=');
};

const parseAuthState = (state) => {
  if (typeof state !== 'string' || !state) return {};

  try {
    const decoded = Buffer.from(normalizeBase64Url(state), 'base64').toString('utf8');
    const parsed = JSON.parse(decoded);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
};

const normalizeName = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed || null;
};

const normalizeBirthDate = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null;

  const [year, month, day] = trimmed.split('-').map((part) => Number.parseInt(part, 10));
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    Number.isNaN(date.getTime())
    || date.getUTCFullYear() !== year
    || date.getUTCMonth() !== month - 1
    || date.getUTCDate() !== day
  ) {
    return null;
  }

  return trimmed;
};

const calculateAgeFromBirthDate = (birthDate) => {
  const normalized = normalizeBirthDate(birthDate);
  if (!normalized) return null;

  const today = new Date();
  const birth = new Date(`${normalized}T00:00:00Z`);

  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - birth.getUTCMonth();
  const dayDiff = today.getUTCDate() - birth.getUTCDate();

  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age -= 1;
  }

  return age >= 0 && age <= 120 ? age : null;
};

const getSignupDataFromState = (state) => {
  const parsed = parseAuthState(state);
  const rawProfile = parsed.profile && typeof parsed.profile === 'object' ? parsed.profile : {};
  const birthDate = normalizeBirthDate(rawProfile.birthDate);

  return {
    returnTo: typeof parsed.returnTo === 'string' && parsed.returnTo ? parsed.returnTo : null,
    loginOnly: parsed.loginOnly === true,
    profile: {
      firstName: normalizeName(rawProfile.firstName),
      lastName: normalizeName(rawProfile.lastName),
      birthDate,
      age: calculateAgeFromBirthDate(birthDate),
    },
  };
};

const hasRequiredSignupProfile = (profile) => Boolean(profile?.firstName) && profile?.age != null;
const isAllowedAge = (profile) => Number.isInteger(profile?.age) && profile.age >= 16;

const buildDisplayName = (profile, spotifyDisplayName) => {
  const fullName = [profile?.firstName, profile?.lastName].filter(Boolean).join(' ').trim();
  return fullName || spotifyDisplayName || null;
};

const getFrontendUrl = (returnTo) => {
  if (typeof returnTo === 'string' && returnTo) {
    try {
      const parsed = new URL(returnTo);
      return `${parsed.origin}/`;
    } catch {
      // fall through
    }
  }

  return process.env.FRONTEND_URL || 'http://127.0.0.1:8080';
};

const redirectToLandingError = (res, returnTo, error) => {
  const url = new URL(getFrontendUrl(returnTo));
  url.pathname = '/';
  url.searchParams.set('error', error);
  return res.redirect(url.toString());
};

const isUploadedAvatar = (avatarUrl) =>
  typeof avatarUrl === 'string' && avatarUrl.startsWith('/uploads/');

const getPreferredAvatarUrl = (currentAvatarUrl, spotifyAvatarUrl) => {
  if (isUploadedAvatar(currentAvatarUrl)) {
    return currentAvatarUrl;
  }

  return spotifyAvatarUrl ?? currentAvatarUrl ?? null;
};

const summarizeAudioFeatures = (audioFeatureItems = []) => {
  const valid = Array.isArray(audioFeatureItems)
    ? audioFeatureItems.filter((item) => item && typeof item === 'object')
    : [];

  if (!valid.length) {
    return null;
  }

  const average = (key) => {
    const values = valid.map((item) => Number(item[key])).filter(Number.isFinite);
    if (!values.length) return null;
    const sum = values.reduce((acc, value) => acc + value, 0);
    return Number((sum / values.length).toFixed(3));
  };

  return {
    danceability: average('danceability'),
    energy: average('energy'),
    valence: average('valence'),
    tempo: average('tempo'),
  };
};

const extractSpotifyErrorStatus = (error) => {
  if (!error) return null;

  const raw = typeof error?.message === 'string' ? error.message : String(error);

  try {
    const parsed = JSON.parse(raw);
    const status = Number(parsed?.error?.status);
    return Number.isFinite(status) ? status : null;
  } catch {
    return null;
  }
};

const withSpotifyFallback = async (fn, fallbackValue, label) => {
  try {
    return await fn();
  } catch (error) {
    const status = extractSpotifyErrorStatus(error);
    const suffix = Number.isFinite(status) ? ` (status ${status})` : '';
    console.warn(`Spotify optional fetch failed: ${label}${suffix}`);
    return fallbackValue;
  }
};

const PREMIUM_REQUIRED_HINT = 'Spotify Premium oder ein aktives Spotify-Gerät wird benötigt.';
const DEVICE_REQUIRED_HINT = 'Öffne Spotify (Handy/Desktop) und starte kurz einen Song, dann nochmal.';

const requireAccessToken = (req) => {
  const { at } = req.cookies || {};
  if (!at) {
    const error = new Error('no_access_token');
    error.status = 401;
    throw error;
  }
  return at;
};

const buildTrackSearchResult = (track) => ({
  trackId: track?.id ?? null,
  uri: track?.uri ?? null,
  name: track?.name ?? null,
  artists: Array.isArray(track?.artists)
    ? track.artists.map((artist) => artist?.name).filter(Boolean)
    : [],
  albumImage: track?.album?.images?.[0]?.url ?? null,
  durationMs: Number(track?.duration_ms) || 0,
});

const createNoDeviceError = () => {
  const error = new Error('no_device_available');
  error.status = 409;
  error.hint = DEVICE_REQUIRED_HINT;
  return error;
};

const resolvePlaybackDevice = async (accessToken, preferredDeviceId = null) => {
  if (preferredDeviceId) return preferredDeviceId;

  const devs = await fetchDevices(accessToken);
  const active = devs?.devices?.find((device) => device.is_active);
  const fallback = active?.id || devs?.devices?.[0]?.id || null;

  if (!fallback) {
    throw createNoDeviceError();
  }

  return fallback;
};

const sendPlaybackError = (res, error, fallbackErrorCode) => {
  const spotifyStatus = extractSpotifyErrorStatus(error);
  const status = error?.status || spotifyStatus || 500;

  return res.status(status).json({
    error: error?.message || fallbackErrorCode,
    hint: status === 403 ? PREMIUM_REQUIRED_HINT : (error?.hint || PREMIUM_REQUIRED_HINT),
  });
};

// ======================= LOGIN =======================
export const login = (req, res) => {
  const state = typeof req.query.state === 'string' ? req.query.state : '';
  const signupState = getSignupDataFromState(state);
  const { profile, loginOnly } = signupState;

  if (!loginOnly) {
    if (!hasRequiredSignupProfile(profile)) {
      return res.status(400).json({
        error: 'missing_signup_profile',
        message: 'firstName and birthDate are required before Spotify login',
      });
    }

    if (!isAllowedAge(profile)) {
      return redirectToLandingError(res, signupState.returnTo, 'underage');
    }
  }

  return res.redirect(buildAuthUrl(state));
};

// ======================= CALLBACK ====================
export const callback = async (req, res) => {
  try {
    const { code, state } = req.query;
    if (!code) return res.status(400).send('Missing code');

    const signupState = getSignupDataFromState(state);

    if (!signupState.loginOnly) {
      if (!hasRequiredSignupProfile(signupState.profile)) {
        return res.status(400).send('missing_signup_profile');
      }

      if (!isAllowedAge(signupState.profile)) {
        return redirectToLandingError(res, signupState.returnTo, 'underage');
      }
    }

    const tokens = await exchangeCodeForTokens(code);

    const meProfile = await fetchMe(tokens.access_token);

    const [topArtistsRes, topTracksRes, recentlyPlayedRes] = await Promise.all([
      withSpotifyFallback(
        () => fetchTopArtists(tokens.access_token, { timeRange: 'medium_term', limit: 20 }),
        { items: [] },
        'top_artists',
      ),
      withSpotifyFallback(
        () => fetchTopTracks(tokens.access_token, { timeRange: 'medium_term', limit: 20 }),
        { items: [] },
        'top_tracks',
      ),
      withSpotifyFallback(
        () => fetchRecentlyPlayed(tokens.access_token, { limit: 20 }),
        { items: [] },
        'recently_played',
      ),
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

    const topTrackIds = (topTracksRes?.items || [])
      .map((track) => track?.id)
      .filter(Boolean)
      .slice(0, 10);
    const audioFeaturesRes = topTrackIds.length
      ? await withSpotifyFallback(
        () => fetchAudioFeatures(tokens.access_token, topTrackIds),
        { audio_features: [] },
        'audio_features',
      )
      : { audio_features: [] };
    const audioFeatures = summarizeAudioFeatures(audioFeaturesRes?.audio_features || []);

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

    if (signupState.loginOnly && !user) {
      return redirectToLandingError(res, signupState.returnTo, 'no_account');
    }

    const userPayload = {
      displayName: signupState.loginOnly
        ? (user?.displayName || meProfile.display_name || null)
        : buildDisplayName(signupState.profile, meProfile.display_name ?? null),
      firstName: signupState.loginOnly ? (user?.firstName ?? null) : signupState.profile.firstName,
      lastName: signupState.loginOnly ? (user?.lastName ?? null) : signupState.profile.lastName,
      birthDate: signupState.loginOnly ? (user?.birthDate ?? null) : signupState.profile.birthDate,
      email: meProfile.email ?? null,
      avatarUrl: getPreferredAvatarUrl(user?.avatarUrl ?? null, meProfile.images?.[0]?.url ?? null),
      country: meProfile.country ?? null,
      product: meProfile.product ?? null,
      age: signupState.loginOnly ? (user?.age ?? null) : signupState.profile.age,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? (user ? user.refreshToken : null),
      tokenExpiresAt: expiresAt,
      topArtists,
      topTracks,
      recentlyPlayed,
      genres,
      audioFeatures,
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
    const existingToken = await SpotifyToken.findByPk(user.id);
    await SpotifyToken.upsert({
      userId: user.id,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? existingToken?.refreshToken ?? null,
      tokenExpiresAt: expiresAt,
    });

    // Upsert music data into spotify_data
    await SpotifyData.upsert({
      userId: user.id,
      topArtists,
      topTracks,
      recentlyPlayed,
      genres,
      audioFeatures,
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
    const to = signupState.returnTo || process.env.FRONTEND_URL || 'http://127.0.0.1:8080';
    return res.redirect(to);
  } catch (e) {
    console.error('Callback error:', e?.message || e);
    return res.status(500).send(e?.message || 'callback_failed');
  }
};

// ======================= ME ==========================
export const me = async (req, res, next) => {
  try {
    const accessToken = requireAccessToken(req);

    const profile = await fetchMe(accessToken);
    const user = await User.findOne({ where: { spotifyId: profile.id } });
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    return res.json({
      id: user.id,
      spotifyId: user.spotifyId,
      displayName: user.displayName,
      firstName: user.firstName,
      lastName: user.lastName,
      birthDate: user.birthDate,
      email: user.email,
      avatarUrl: user.avatarUrl,
      country: user.country,
      product: user.product,
      age: user.age,
      bio: user.bio,
      isVisible: user.isVisible,
      topArtists: user.topArtists,
      topTracks: user.topTracks,
      recentlyPlayed: user.recentlyPlayed,
      genres: user.genres,
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

// ======================= TRACK SEARCH =================
export const searchTracks = async (req, res, next) => {
  try {
    const accessToken = requireAccessToken(req);
    const query = typeof req.query.q === 'string' ? req.query.q.trim() : '';
    const limit = Math.min(Math.max(Number(req.query.limit) || 8, 1), 20);

    if (query.length < 2) {
      return res.json([]);
    }

    const data = await searchSpotifyTracks(accessToken, query, { limit });
    const tracks = Array.isArray(data?.tracks?.items)
      ? data.tracks.items.map(buildTrackSearchResult).filter((track) => track.trackId && track.uri)
      : [];

    return res.json(tracks);
  } catch (e) {
    if (e.status) {
      return res.status(e.status).json({ error: e.message });
    }

    return next(e);
  }
};

export const playerToken = async (req, res, next) => {
  try {
    const accessToken = requireAccessToken(req);
    return res.json({ accessToken });
  } catch (e) {
    if (e.status) {
      return res.status(e.status).json({ error: e.message });
    }

    return next(e);
  }
};

// ======================= CURRENTLY PLAYING ===========
export const currentlyPlaying = async (req, res, _next) => {
  try {
    let accessToken = requireAccessToken(req);

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
    const accessToken = requireAccessToken(req);
    const data = await fetchDevices(accessToken);
    return res.json(data);
  } catch (e) {
    console.error('devices error:', e?.message || e);
    return res.status(e?.status || 500).json({ error: e?.message || 'devices_failed' });
  }
};

// ======================= PLAY ========================
export const play = async (req, res) => {
  try {
    const accessToken = requireAccessToken(req);

    const { trackUri, deviceId, positionMs } = req.body || {};
    if (!trackUri) return res.status(400).json({ error: 'missing_trackUri' });

    const at = accessToken;
    let finalDeviceId = await resolvePlaybackDevice(accessToken, deviceId || null);

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

    await startPlayback(accessToken, {
      deviceId: finalDeviceId,
      uris: [trackUri],
      positionMs: positionMs ?? 0,
    });

    return res.json({ ok: true, deviceId: finalDeviceId });
  } catch (e) {
    console.error('play error:', e?.message || e);
    return sendPlaybackError(res, e, 'play_failed');
  }
};

// ======================= PAUSE =======================
export const pause = async (req, res) => {
  try {
    const accessToken = requireAccessToken(req);
    const { deviceId } = req.body || {};
    const finalDeviceId = await resolvePlaybackDevice(accessToken, deviceId || null);

    await pausePlayback(accessToken, { deviceId: finalDeviceId });
    return res.json({ ok: true, deviceId: finalDeviceId });
  } catch (e) {
    console.error('pause error:', e?.message || e);
    return sendPlaybackError(res, e, 'pause_failed');
  }
};

// ======================= SEEK ========================
export const seek = async (req, res) => {
  try {
    const accessToken = requireAccessToken(req);
    const { positionMs, deviceId } = req.body || {};
    const finalDeviceId = await resolvePlaybackDevice(accessToken, deviceId || null);

    await seekPlayback(accessToken, positionMs ?? 0, { deviceId: finalDeviceId });
    return res.json({
      ok: true,
      deviceId: finalDeviceId,
      positionMs: Math.max(0, Number(positionMs) || 0),
    });
  } catch (e) {
    console.error('seek error:', e?.message || e);
    return sendPlaybackError(res, e, 'seek_failed');
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

    const topTrackIds = (topTracksRes?.items || [])
      .map((track) => track?.id)
      .filter(Boolean)
      .slice(0, 10);
    const audioFeaturesRes = topTrackIds.length
      ? await fetchAudioFeatures(at, topTrackIds)
      : { audio_features: [] };
    const audioFeatures = summarizeAudioFeatures(audioFeaturesRes?.audio_features || []);

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
      audioFeatures,
    });

    // Preserve manually uploaded avatars and only refresh Spotify-hosted images.
    const newAvatar = meProfile.images?.[0]?.url ?? null;
    if (
      newAvatar
      && !isUploadedAvatar(user.avatarUrl)
      && newAvatar !== user.avatarUrl
    ) {
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
