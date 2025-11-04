import express from 'express';
import { login, callback, refresh, me, logout } from '../../controller/spotifyController.js';

const router = express.Router();

router.get('/auth/login', login); // -> redirects to Spotify authorize
router.get('/auth/callback', callback); // -> exchange code for tokens
router.post('/auth/refresh', refresh); // -> refresh access token
router.get('/me', me); // -> current user profile
router.post('/auth/logout', logout);

export default router;
