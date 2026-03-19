import { Router } from 'express';
import { Op } from 'sequelize';
import User from '../../model/User.js';
import SpotifyData from '../../model/SpotifyData.js';
import { fetchMe } from '../../model/spotifyModel.js';

const router = Router();

// Helper: get current user from access token cookie
async function getCurrentUser(req) {
  const { at } = req.cookies || {};
  if (!at) {
    const err = new Error('no_access_token');
    err.status = 401;
    throw err;
  }
  const sp = await fetchMe(at);
  const user = await User.findOne({ where: { spotifyId: sp.id } });
  if (!user) {
    const err = new Error('user_not_found');
    err.status = 404;
    throw err;
  }
  return { user, accessToken: at };
}

function toArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return value.split(',').map(item => item.trim()).filter(Boolean);
    }
  }
  return [];
}

function getArtistName(artist) {
  if (typeof artist === 'string') return artist;
  if (artist && typeof artist.name === 'string') return artist.name;
  return null;
}

// Search people in DB
async function searchPeople(query, currentUser, limit) {
  const users = await User.findAll({
    where: {
      id: { [Op.ne]: currentUser.id },
      isVisible: true,
      [Op.or]: [
        { displayName: { [Op.like]: `%${query}%` } },
        { spotifyId: { [Op.like]: `%${query}%` } },
      ],
    },
    limit,
  });

  const mySpotify = await SpotifyData.findByPk(currentUser.id);
  const myArtists = toArray(mySpotify?.topArtists).slice(0, 4);
  const myArtistNames = new Set(
    myArtists.map(a => getArtistName(a)).filter(Boolean).map(n => n.toLowerCase())
  );

  const userIds = users.map(u => u.id);
  const allSpotify = userIds.length
    ? await SpotifyData.findAll({ where: { userId: { [Op.in]: userIds } } })
    : [];
  const spotifyByUser = {};
  for (const sd of allSpotify) spotifyByUser[sd.userId] = sd;

  return users.map(u => {
    const uSpotify = spotifyByUser[u.id];
    const uArtists = toArray(uSpotify?.topArtists).slice(0, 4);
    const uArtistNames = new Set(
      uArtists.map(a => getArtistName(a)).filter(Boolean).map(n => n.toLowerCase())
    );
    const mutualArtists = [...myArtistNames].filter(n => uArtistNames.has(n)).length;
    const genres = toArray(uSpotify?.genres).slice(0, 3);

    return {
      id: u.id,
      displayName: u.displayName || 'Unknown',
      spotifyId: u.spotifyId,
      avatarUrl: u.avatarUrl,
      topGenres: genres,
      mutualArtists,
    };
  });
}

// Search music via Spotify API
async function searchMusic(query, accessToken, limit) {
  const params = new URLSearchParams({
    q: query,
    type: 'track',
    limit: String(limit),
  });
  const res = await fetch(`https://api.spotify.com/v1/search?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.tracks?.items || []).map(t => ({
    type: 'track',
    name: t.name,
    artist: t.artists?.[0]?.name || '',
    album: t.album?.name || '',
    albumImage: t.album?.images?.[1]?.url || t.album?.images?.[0]?.url || '',
    spotifyUri: t.uri,
  }));
}

// Search events via Ticketmaster API
async function searchEvents(query, limit) {
  const apiKey = process.env.TICKETMASTER_API_KEY;
  if (!apiKey) return [];
  const params = new URLSearchParams({
    apikey: apiKey,
    keyword: query,
    size: String(limit),
    sort: 'date,asc',
    classificationName: 'Music',
  });
  try {
    const res = await fetch(
      `https://app.ticketmaster.com/discovery/v2/events.json?${params}`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return (data._embedded?.events || []).map(e => ({
      id: e.id,
      name: e.name,
      date: e.dates?.start?.localDate || '',
      venue: e._embedded?.venues?.[0]?.name || '',
      city: e._embedded?.venues?.[0]?.city?.name || '',
    }));
  } catch {
    return [];
  }
}

// GET /api/search?q=<query>&type=<all|people|music|events>
router.get('/', async (req, res, next) => {
  try {
    const { q, type = 'all' } = req.query;

    if (!q || q.trim().length < 2) {
      return res.json({ people: [], music: [], events: [] });
    }

    const query = q.trim();
    const { user, accessToken } = await getCurrentUser(req);

    const limit = type === 'all' ? 5 : 10;

    const [people, music, events] = await Promise.all([
      type === 'all' || type === 'people'
        ? searchPeople(query, user, limit)
        : Promise.resolve([]),
      type === 'all' || type === 'music'
        ? searchMusic(query, accessToken, limit)
        : Promise.resolve([]),
      type === 'all' || type === 'events'
        ? searchEvents(query, limit)
        : Promise.resolve([]),
    ]);

    res.json({ people, music, events });
  } catch (err) {
    next(err);
  }
});

export default router;
