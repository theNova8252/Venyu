import { Router } from 'express';
import { upsertRsvp, getRsvpsForEvents } from '../../controller/eventsRsvpController.js';

const router = Router();

router.get('/rsvp', getRsvpsForEvents);
router.put('/:eventId/rsvp', upsertRsvp);

export default router;
