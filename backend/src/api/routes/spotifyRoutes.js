import express from 'express';

import {
  login,
  callback,
  refresh,
  me,
  logout,
  searchTracks,
  playerToken,
  devices,
  play,
  pause,
  seek,
  syncMusicData,
  currentlyPlaying,
} from '../../controller/spotifyController.js';

const router = express.Router();

router.get('/auth/login', login);
router.get('/auth/callback', callback);
router.post('/auth/refresh', refresh);
router.get('/me', me);
router.post('/auth/logout', logout);
router.post('/sync', syncMusicData);

router.get('/search-tracks', searchTracks);
router.get('/player/token', playerToken);
router.get('/currently-playing', currentlyPlaying);
router.get('/player/devices', devices);
router.post('/player/play', play);
router.post('/player/pause', pause);
router.post('/player/seek', seek);

export default router;
