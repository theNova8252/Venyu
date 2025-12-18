import express from 'express';
<<<<<<< Updated upstream
import { login, callback, refresh, me, logout, syncCurrentlyPlaying } from '../../controller/spotifyController.js';
=======
import {
  login,
  callback,
  refresh,
  me,
  logout,
  devices,
  play,
} from '../../controller/spotifyController.js';
>>>>>>> Stashed changes

const router = express.Router();

router.get('/auth/login', login);
router.get('/auth/callback', callback);
router.post('/auth/refresh', refresh);
router.get('/me', me);
router.post('/auth/logout', logout);
// router.get('/currently-playing', syncCurrentlyPlaying);
router.post('/sync-currently-playing', syncCurrentlyPlaying);

router.get('/player/devices', devices);
router.post('/player/play', play);

export default router;
