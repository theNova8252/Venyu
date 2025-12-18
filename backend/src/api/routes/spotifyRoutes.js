import express from 'express';
import { login, callback, refresh, me, logout, syncCurrentlyPlaying } from '../../controller/spotifyController.js';

const router = express.Router();

router.get('/auth/login', login);
router.get('/auth/callback', callback);
router.post('/auth/refresh', refresh);
router.get('/me', me);
router.post('/auth/logout', logout);
// router.get('/currently-playing', syncCurrentlyPlaying);
router.post('/sync-currently-playing', syncCurrentlyPlaying);

export default router;
