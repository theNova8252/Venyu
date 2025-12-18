import ChatMessage from '../model/ChatMessage.js';
import { fetchMe } from '../model/spotifyModel.js';
import User from '../model/User.js';

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

export async function listMessages(req, res, next) {
  const { roomId } = req.params;

  try {
    const currentUser = await getCurrentUser(req);

    const messages = await ChatMessage.findAll({
      where: { roomId },
      order: [['createdAt', 'ASC']],
    });

    const result = messages.map((m) => {
      const obj = m.toJSON();
      obj.isMine = String(obj.senderId) === String(currentUser.id);
      return obj;
    });

    return res.json(result);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    return next(err);
  }
}

export async function createMessage(req, res, next) {
  const { roomId } = req.params;
  const { ciphertext, iv, version } = req.body;

  if (!ciphertext || !iv) {
    return res.status(400).json({ message: 'ciphertext and iv are required' });
  }

  try {
    const currentUser = await getCurrentUser(req);

    const msg = await ChatMessage.create({
      roomId,
      senderId: currentUser.id,
      ciphertext,
      iv,
      version: version || 'aes-gcm-v1',
    });

    const obj = msg.toJSON();
    obj.isMine = true;
    return res.status(201).json(obj);
  } catch (err) {
    if (err.status) return res.status(err.status).json({ error: err.message });
    return next(err);
  }
}
