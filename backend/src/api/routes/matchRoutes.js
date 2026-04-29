import { Router } from 'express';
import { Op } from 'sequelize';
import User from '../../model/User.js';
import SpotifyData from '../../model/SpotifyData.js';
import Like from '../../model/Like.js';
import EventRsvp from '../../model/eventRSVP.js';
import { fetchMe } from '../../model/spotifyModel.js';

const router = Router();
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

  return user;
}

function makeRoomId(a, b) {
  return [a, b].sort().join('__');
}

// Candidates, excluding already liked or matched users.
router.get('/candidates', async (req, res, next) => {
  try {
    const me = await getCurrentUser(req);

    // 1) All people I already liked should not show up again.
    const myLikes = await Like.findAll({
      where: { fromUserId: me.id },
      attributes: ['toUserId'],
    });
    const likedIds = new Set(myLikes.map((l) => String(l.toUserId)));

    // 2) Determine mutual-like matches.
    const reciprocalLikes = await Like.findAll({
      where: {
        toUserId: me.id,
        fromUserId: { [Op.in]: Array.from(likedIds) },
      },
      attributes: ['fromUserId'],
    });
    const matchedIds = new Set(reciprocalLikes.map((l) => String(l.fromUserId)));

    // 3) Fetch candidates, excluding:
    //    - nicht ich
    //    - sichtbar
    //    - already liked users
    //    - nicht gematched
    const others = await User.findAll({
      where: {
        id: {
          [Op.and]: [
            { [Op.ne]: me.id },
            { [Op.notIn]: Array.from(new Set([...likedIds, ...matchedIds])) },
          ],
        },
        isVisible: true,
      },
    });

    console.log('✅ Candidates found:', others.length);
    console.log('🔍 DEBUG: About to process candidates...');

    // Fetch event RSVPs for all candidate users
    const otherIds = others.map((u) => u.id);
    const allRsvps = otherIds.length
      ? await EventRsvp.findAll({
        where: { userId: { [Op.in]: otherIds }, interested: true },
        attributes: ['userId', 'eventId', 'interested', 'going'],
      })
      : [];

    // Group RSVPs by userId
    const rsvpsByUser = {};
    for (const r of allRsvps) {
      if (!rsvpsByUser[r.userId]) rsvpsByUser[r.userId] = [];
      rsvpsByUser[r.userId].push({ eventId: r.eventId, interested: r.interested, going: r.going });
    }

    // Get me's data for match-score breakdown (cap at top 5 genres and artists)
    const mySpotifyData = await SpotifyData.findByPk(me.id);
    const meGenres = new Set(Array.isArray(mySpotifyData?.genres) ? mySpotifyData.genres.slice(0, 6) : []);
    const meArtistIds = new Set(
      (Array.isArray(mySpotifyData?.topArtists) ? mySpotifyData.topArtists.slice(0, 4) : []).map((a) => (typeof a === 'string' ? a : a?.id || a?.name)).filter(Boolean),
    );
    // My event RSVPs (kept for display only, not used in score)
    const myRsvps = await EventRsvp.findAll({
      where: { userId: me.id, interested: true },
      attributes: ['eventId'],
    });
    const myEventIds = new Set(myRsvps.map((r) => r.eventId));

    // Fetch SpotifyData for all candidates
    const allSpotifyData = otherIds.length
      ? await SpotifyData.findAll({ where: { userId: { [Op.in]: otherIds } } })
      : [];
    const spotifyDataByUser = {};
    for (const sd of allSpotifyData) spotifyDataByUser[sd.userId] = sd;

    const result = others.map((u, index) => {
      const displayName = [u.firstName, u.lastName].filter(Boolean).join(' ').trim() || u.displayName;
      const uSpotify = spotifyDataByUser[u.id];
      const artistNames = Array.isArray(uSpotify?.topArtists)
        ? uSpotify.topArtists.map((a) => (typeof a === 'string' ? a : a?.name)).filter(Boolean)
        : [];

      // Cap at top 4 artists for matching
      const artistIds = Array.isArray(uSpotify?.topArtists)
        ? uSpotify.topArtists.slice(0, 4).map((a) => (typeof a === 'string' ? a : a?.id || a?.name)).filter(Boolean)
        : [];

      // Cap at top 6 genres for matching
      const uGenres = Array.isArray(uSpotify?.genres) ? uSpotify.genres.slice(0, 6) : [];

      // Match score: 6 genres + 4 artists = 10 total, scaled to 100
      const uGenreSet = new Set(uGenres);
      const sharedGenres = [...meGenres].filter((g) => uGenreSet.has(g));

      const uArtistSet = new Set(artistIds);
      const sharedArtists = [...meArtistIds].filter((a) => uArtistSet.has(a));

      // Event overlap (display only, not counted in score)
      const userEventIds = (rsvpsByUser[u.id] || []).map((r) => r.eventId);
      const sharedEvents = userEventIds.filter((eid) => myEventIds.has(eid));

      // Each shared item = 10% (6 genres + 4 artists = 10 items = 100%)
      const totalScore = Math.min(100, (sharedGenres.length + sharedArtists.length) * 10);
      console.log(`🎯 ${displayName}: ${sharedGenres.length} shared genres, ${sharedArtists.length} shared artists → ${totalScore}%`);

      const candidate = {
        id: u.id,
        userId: u.id,
        name: displayName || 'Unknown',
        age: Number.isFinite(Number(u.age)) ? Number(u.age) : null,
        avatar: u.avatarUrl || `https://i.pravatar.cc/400?img=${(index + 10) % 70}`,
        bio: u.bio || 'Music lover',
        distance: 'Nearby',
        topArtists: Array.isArray(uSpotify?.topArtists)
          ? uSpotify.topArtists
            .map((a) => (typeof a === 'string' ? { name: a, image: null } : { name: a?.name, image: a?.image || null }))
            .filter((a) => a.name)
          : [],
        topTracks: Array.isArray(uSpotify?.topTracks)
          ? uSpotify.topTracks
            .map((t) => ({
              name: typeof t === 'string' ? t : t?.name,
              artist: typeof t === 'string' ? '' : t?.artists?.[0]?.name || '',
              albumImage: typeof t === 'string' ? null : t?.album?.image || null,
            }))
            .filter((t) => t.name)
          : [],
        genres: uGenres,
        eventRsvps: rsvpsByUser[u.id] || [],
        matchScore: totalScore,
        matchBreakdown: {
          genreScore: sharedGenres.length,
          genreMax: 6,
          sharedGenres,
          artistScore: sharedArtists.length,
          artistMax: 4,
          sharedArtists: sharedArtists.length,
          total: totalScore,
        },
      };
      return candidate;
    });

    console.log('📤 Sending candidates:', result.length);
    return res.json(result);
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    return next(e);
  }
});

// Like
router.post('/:otherUserId/like', async (req, res, next) => {
  try {
    const me = await getCurrentUser(req);
    const { otherUserId } = req.params;

    if (!otherUserId) return res.status(400).json({ error: 'missing_other_user_id' });
    if (otherUserId === String(me.id)) return res.status(400).json({ error: 'cannot_like_self' });

    const other = await User.findByPk(otherUserId);
    if (!other) return res.status(404).json({ error: 'user_not_found' });

    // Prevent duplicate likes.
    await Like.findOrCreate({
      where: {
        fromUserId: me.id,
        toUserId: otherUserId,
      },
    });

    const reciprocal = await Like.findOne({
      where: {
        fromUserId: otherUserId,
        toUserId: me.id,
      },
    });

    if (reciprocal) {
      const roomId = makeRoomId(me.id, otherUserId);
      return res.json({ isMatch: true, roomId });
    }

    return res.json({ isMatch: false });
  } catch (e) {
    if (e.status) return res.status(e.status).json({ error: e.message });
    return next(e);
  }
});

export default router;
