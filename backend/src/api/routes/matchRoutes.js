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

// Kandidaten (mit Filter: keine bereits gelikten / gematchten)
router.get('/candidates', async (req, res, next) => {
  try {
    const me = await getCurrentUser(req);

    // 1) Alle Leute die ich schon geliked habe (diese sollen NICHT wieder auftauchen)
    const myLikes = await Like.findAll({
      where: { fromUserId: me.id },
      attributes: ['toUserId'],
    });
    const likedIds = new Set(myLikes.map((l) => String(l.toUserId)));

    // 2) Optional: Matches bestimmen (mutual likes)
    //    (eigentlich sind Matches eh subset von likedIds, aber wir lassen’s sauber drin)
    const reciprocalLikes = await Like.findAll({
      where: {
        toUserId: me.id,
        fromUserId: { [Op.in]: Array.from(likedIds) },
      },
      attributes: ['fromUserId'],
    });
    const matchedIds = new Set(reciprocalLikes.map((l) => String(l.fromUserId)));

    // 3) Kandidaten holen, aber:
    //    - nicht ich
    //    - sichtbar
    //    - nicht schon geliked
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

    // Get me's data for match-score breakdown
    const mySpotifyData = await SpotifyData.findByPk(me.id);
    const meGenres = new Set(Array.isArray(mySpotifyData?.genres) ? mySpotifyData.genres : []);
    const meArtistIds = new Set(
      (Array.isArray(mySpotifyData?.topArtists) ? mySpotifyData.topArtists : []).map((a) => (typeof a === 'string' ? a : a?.id || a?.name)).filter(Boolean),
    );
    // My event RSVPs
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
      const uSpotify = spotifyDataByUser[u.id];
      const artistNames = Array.isArray(uSpotify?.topArtists)
        ? uSpotify.topArtists.map((a) => (typeof a === 'string' ? a : a?.name)).filter(Boolean)
        : [];

      const artistIds = Array.isArray(uSpotify?.topArtists)
        ? uSpotify.topArtists.map((a) => (typeof a === 'string' ? a : a?.id || a?.name)).filter(Boolean)
        : [];

      const uGenres = Array.isArray(uSpotify?.genres) ? uSpotify.genres : [];

      // Match score breakdown
      const uGenreSet = new Set(uGenres);
      const sharedGenres = [...meGenres].filter((g) => uGenreSet.has(g));
      const genreUnion = new Set([...meGenres, ...uGenreSet]);
      const genreScore = genreUnion.size === 0 ? 0 : sharedGenres.length / genreUnion.size;

      const uArtistSet = new Set(artistIds);
      const sharedArtists = [...meArtistIds].filter((a) => uArtistSet.has(a));
      const artistMax = Math.max(meArtistIds.size, uArtistSet.size);
      const artistScore = artistMax === 0 ? 0 : sharedArtists.length / artistMax;

      // Event overlap
      const userEventIds = (rsvpsByUser[u.id] || []).map((r) => r.eventId);
      const sharedEvents = userEventIds.filter((eid) => myEventIds.has(eid));

      const totalScore = Math.round(genreScore * 50 + artistScore * 30 + (sharedEvents.length > 0 ? 20 : 0));

      const candidate = {
        id: u.id,
        userId: u.id,
        name: u.displayName || 'Unknown',
        age: u.age || 25,
        avatar: u.avatarUrl || `https://i.pravatar.cc/400?img=${(index + 10) % 70}`,
        bio: u.bio || 'Music lover',
        distance: 'Nearby',
        topArtists: artistNames,
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
        matchScore: totalScore || 80,
        matchBreakdown: {
          genreScore: Math.round(genreScore * 50),
          sharedGenres,
          artistScore: Math.round(artistScore * 30),
          sharedArtists: sharedArtists.length,
          eventScore: sharedEvents.length > 0 ? 20 : 0,
          sharedEvents: sharedEvents.length,
          total: totalScore || 80,
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

    // ✅ schützt gegen doppelte Likes
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
