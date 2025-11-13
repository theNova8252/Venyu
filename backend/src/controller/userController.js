import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import User from '../model/User.js';
import { fetchMe } from '../model/spotifyModel.js';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '.jpg');
    cb(null, `avatar_${Date.now()}${ext}`);
  },
});
export const upload = multer({ storage });

export const getMeProfile = async (req, res, next) => {
  try {
    const { at } = req.cookies || {};
    if (!at) return res.status(401).json({ error: 'no_access_token' });

    const sp = await fetchMe(at);
    const user = await User.findOne({ where: { spotifyId: sp.id } });
    if (!user) return res.status(404).json({ error: 'user_not_found' });

    return res.json({
      id: user.id,
      display_name: user.displayName,
      email: user.email,
      avatar_url: user.avatarUrl,
      country: user.country,
      product: user.product,
      bio: user.bio,
      is_visible: user.isVisible,
      spotify: { id: sp.id, display_name: sp.display_name, followers: sp.followers?.total ?? 0 },
    });
  } catch (e) {
    return next(e);
  }
};

export const updateMeProfile = async (req, res, next) => {
  try {
    const { at } = req.cookies || {};
    if (!at) return res.status(401).json({ error: 'no_access_token' });

    const sp = await fetchMe(at);
    const { bio, isVisible } = req.body || {};

    const [count] = await User.update(
      {
        bio: bio ?? null,
        ...(typeof isVisible === 'boolean' ? { isVisible } : {}),
      },
      { where: { spotifyId: sp.id } },
    );

    if (!count) return res.status(404).json({ error: 'user_not_found' });
    return res.json({ updated: true });
  } catch (e) {
    return next(e);
  }
};

export const uploadAvatar = async (req, res, next) => {
  try {
    const { at } = req.cookies || {};
    if (!at) return res.status(401).json({ error: 'no_access_token' });

    const sp = await fetchMe(at);
    if (!req.file) return res.status(400).json({ error: 'no_file' });

    const relPath = `/uploads/${req.file.filename}`;
    await User.update({ avatarUrl: relPath }, { where: { spotifyId: sp.id } });

    return res.json({ avatar_url: relPath });
  } catch (e) {
    return next(e);
  }
};
