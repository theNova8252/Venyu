import express from 'express';
import EVENTS from '../../../data/events.js';

const router = express.Router();

router.get('/nearby', (req, res) => {
  res.json(EVENTS);
});

export default router;
