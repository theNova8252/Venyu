// backend/src/api/routes/spotifyRoutes.js
import express from 'express';
import { login, callback, refresh, me, logout } from '../../controller/spotifyController.js';

const router = express.Router();

router.get('/auth/login', login);
router.get('/auth/callback', callback);
router.post('/auth/refresh', refresh);
router.get('/me', me);
router.post('/auth/logout', logout);

export default router;
