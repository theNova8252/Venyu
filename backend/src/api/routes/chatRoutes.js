import { Router } from 'express';
import { listMessages, createMessage } from '../../controller/chatController.js';

const router = Router();

router.get('/rooms/:roomId/messages', listMessages);
router.post('/rooms/:roomId/messages', createMessage);

export default router;
