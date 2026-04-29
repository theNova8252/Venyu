import { fetchMe } from '../model/spotifyModel.js';
import User from '../model/User.js';
import E2eeKey from '../model/e2eeKey.js';

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

function buildBackupPayload(key) {
  if (!key?.privateKeyBackupCiphertext || !key?.privateKeyBackupIv || !key?.privateKeyBackupSalt) {
    return null;
  }

  return {
    ciphertext: key.privateKeyBackupCiphertext,
    iv: key.privateKeyBackupIv,
    salt: key.privateKeyBackupSalt,
    version: key.privateKeyBackupVersion || 'private-jwk-aes-gcm-pbkdf2-v1',
  };
}

export async function upsertMyPublicKey(req, res) {
  try {
    const me = await getCurrentUser(req);
    const { publicKeyJwk, privateKeyBackup } = req.body || {};

    if (!publicKeyJwk) {
      return res.status(400).json({ error: 'missing_publicKeyJwk' });
    }

    const payload = {
      userId: String(me.id),
      publicKeyJwk,
    };

    if (
      privateKeyBackup
      && typeof privateKeyBackup.ciphertext === 'string'
      && typeof privateKeyBackup.iv === 'string'
      && typeof privateKeyBackup.salt === 'string'
    ) {
      payload.privateKeyBackupCiphertext = privateKeyBackup.ciphertext;
      payload.privateKeyBackupIv = privateKeyBackup.iv;
      payload.privateKeyBackupSalt = privateKeyBackup.salt;
      payload.privateKeyBackupVersion = privateKeyBackup.version || 'private-jwk-aes-gcm-pbkdf2-v1';
    }

    const existing = await E2eeKey.findByPk(String(me.id));
    if (existing) {
      await existing.update(payload);
    } else {
      await E2eeKey.create(payload);
    }

    return res.json({ ok: true });
  } catch (error) {
    console.error('upsertMyPublicKey error', error?.message || error);
    if (error.status) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: 'e2ee_key_upsert_failed' });
  }
}

export async function getMyKeyBundle(req, res) {
  try {
    const me = await getCurrentUser(req);
    const key = await E2eeKey.findByPk(String(me.id));
    if (!key) {
      return res.status(404).json({ error: 'my_key_not_found' });
    }

    return res.json({
      userId: String(me.id),
      publicKeyJwk: key.publicKeyJwk,
      privateKeyBackup: buildBackupPayload(key),
    });
  } catch (error) {
    console.error('getMyKeyBundle error', error?.message || error);
    if (error.status) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: 'my_key_lookup_failed' });
  }
}

export async function getPeerPublicKey(req, res) {
  try {
    const me = await getCurrentUser(req);
    const { roomId } = req.params;

    const parts = parseRoom(roomId);
    if (!parts) return res.status(400).json({ error: 'invalid_roomId' });

    const meId = String(me.id);
    const peerId = parts.find((part) => part !== meId) || null;
    if (!peerId) return res.status(400).json({ error: 'cannot_determine_peer' });

    const key = await E2eeKey.findByPk(String(peerId));
    if (!key) return res.status(404).json({ error: 'peer_key_not_found' });

    return res.json({
      peerId: String(peerId),
      publicKeyJwk: key.publicKeyJwk,
    });
  } catch (error) {
    console.error('getPeerPublicKey error', error?.message || error);
    if (error.status) return res.status(error.status).json({ error: error.message });
    return res.status(500).json({ error: 'peer_key_lookup_failed' });
  }
}
