import { Router } from 'express';
import {
  getMeProfile,
  updateMeProfile,
  uploadAvatar,
  deleteAccount,
  upload,
} from '../../controller/userController.js';

const router = Router();
router.get('/me', getMeProfile);
router.put('/me', updateMeProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);
router.delete('/me', deleteAccount);

export default router;