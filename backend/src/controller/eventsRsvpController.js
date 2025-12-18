import EventRsvp from '../model/eventRSVP.js';
import User from '../model/User.js';
import { fetchMe } from '../model/spotifyModel.js';

function toBool(v) {
  if (v === true || v === false) return v;
  if (v === 'true') return true;
  if (v === 'false') return false;
  if (v === 1 || v === '1') return true;
  if (v === 0 || v === '0') return false;
  return false;
}

async function getCurrentUser(req) {
  const { at } = req.cookies || {};
  if (!at) return null;

  const sp = await fetchMe(at);
  return User.findOne({ where: { spotifyId: sp.id } });
}

function applyRules(next) {
  const result = { ...next };
  if (result.going) result.interested = true;
  if (!result.interested) result.going = false;
  return result;
}

export const upsertRsvp = async (req, res, next) => {
  try {
    const me = await getCurrentUser(req);
    if (!me) return res.status(401).json({ error: 'no_access_token' });

    const eventId = String(req.params.eventId);
    const interested = toBool(req.body?.interested);
    const going = toBool(req.body?.going);

    const nextState = applyRules({ interested, going });

    const [row] = await EventRsvp.upsert(
      { userId: me.id, eventId, ...nextState },
      { returning: true },
    );

    return res.json({
      eventId: row.eventId,
      interested: row.interested,
      going: row.going,
    });
  } catch (e) {
    return next(e);
  }
};

export const getRsvpsForEvents = async (req, res, next) => {
  try {
    const me = await getCurrentUser(req);
    if (!me) return res.status(401).json({ error: 'no_access_token' });

    const ids = String(req.query.ids || '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (!ids.length) return res.json({});

    const rows = await EventRsvp.findAll({
      where: { userId: me.id, eventId: ids },
      attributes: ['eventId', 'interested', 'going'],
    });

    const map = {};
    for (const r of rows) map[r.eventId] = { interested: r.interested, going: r.going };
    return res.json(map);
  } catch (e) {
    return next(e);
  }
};
