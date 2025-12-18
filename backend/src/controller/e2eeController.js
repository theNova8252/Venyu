import { fetchMe } from '../model/spotifyModel.js';
import User from '../model/User.js';
import E2eeKey from '../model/E2eeKey.js';

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

function parseRoom(roomId) {
  const parts = String(roomId || '').split('__').filter(Boolean);
  if (parts.length !== 2) return null;
  return parts;
}

// POST /api/chat/e2ee/public-key
export async function upsertMyPublicKey(req, res, next) {
  try {
    const me = await getCurrentUser(req);
    const { publicKeyJwk } = req.body || {};

    if (!publicKeyJwk) return res.status(400).json({ error: 'missing_publicKeyJwk' });

    await E2eeKey.upsert({
      userId: String(me.id),     // ✅ UUID string
      publicKeyJwk,
    });

    return res.json({ ok: true });
  } catch (e) {
    console.error('upsertMyPublicKey error', e?.message || e);
    if (e.status) return res.status(e.status).json({ error: e.message });
    return res.status(500).json({ error: 'e2ee_key_upsert_failed' });
  }
}

// GET /api/chat/rooms/:roomId/peer-key
export async function getPeerPublicKey(req, res) {
  try {
    const me = await getCurrentUser(req);
    const { roomId } = req.params;

    const parts = parseRoom(roomId);
    if (!parts) return res.status(400).json({ error: 'invalid_roomId' });

    const meId = String(me.id);
    const peerId = parts.find((p) => p !== meId) || null;
    if (!peerId) return res.status(400).json({ error: 'cannot_determine_peer' });

    const key = await E2eeKey.findByPk(String(peerId)); // ✅ UUID
    if (!key) return res.status(404).json({ error: 'peer_key_not_found' });

    return res.json({ peerId: String(peerId), publicKeyJwk: key.publicKeyJwk });
  } catch (e) {
    console.error('getPeerPublicKey error', e?.message || e);
    return res.status(500).json({ error: 'peer_key_lookup_failed' });
  }
}
