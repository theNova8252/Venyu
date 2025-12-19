import { Router } from 'express';
import { Op } from 'sequelize';
import User from '../../model/User.js';
import Like from '../../model/Like.js';
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

    const result = others.map((u, index) => ({
      id: u.id,
      userId: u.id,
      name: u.displayName || 'Unknown',
      avatar: u.avatarUrl || `https://i.pravatar.cc/400?img=${(index + 10) % 70}`,
      bio: u.bio || 'Music lover',
      distance: 'Nearby',
      topArtists: u.topArtists || [],
      genres: u.genres || [],
      matchScore: 80,
    }));

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
