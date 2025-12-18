// backend/src/api/routes/chatRoutes.js
import { Router } from 'express';
import { listMessages, createMessage } from '../../controller/chatController.js';
import { upsertMyPublicKey, getPeerPublicKey } from '../../controller/e2eeController.js';

const router = Router();

// Messages
router.get('/rooms/:roomId/messages', listMessages);
router.post('/rooms/:roomId/messages', createMessage);

// E2EE Keys
router.post('/e2ee/public-key', upsertMyPublicKey);
router.get('/rooms/:roomId/peer-key', getPeerPublicKey);

export default router;
