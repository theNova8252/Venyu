import express from 'express';

import {
  login,
  callback,
  refresh,
  me,
  logout,
  syncCurrentlyPlaying,
  devices,
  play,
} from '../../controller/spotifyController.js';

const router = express.Router();

router.get('/auth/login', login);
router.get('/auth/callback', callback);
router.post('/auth/refresh', refresh);
router.get('/me', me);
router.post('/auth/logout', logout);

router.post('/sync-currently-playing', syncCurrentlyPlaying);

router.get('/player/devices', devices);
router.post('/player/play', play);

export default router;
