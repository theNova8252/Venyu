import express from 'express';

import {
  login,
  callback,
  refresh,
  me,
  logout,
  devices,
  play,
} from '../../controller/spotifyController.js';

// // currently Playing
// import { fetchCurrentlyPlaying } from "../../model/spotifyModel.js";

// router.get("/currently-playing", async (req, res, next) => {
//   try {
//     const data = await fetchCurrentlyPlaying(req);
//     res.json(data || { isPlaying: false });
//   } catch (err) {
//     next(err);
//   }
// });
// // currently playing end
const router = express.Router();

router.get('/auth/login', login);
router.get('/auth/callback', callback);
router.post('/auth/refresh', refresh);
router.get('/me', me);
router.post('/auth/logout', logout);


router.get('/player/devices', devices);
router.post('/player/play', play);

export default router;
