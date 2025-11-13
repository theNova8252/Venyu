import { Router } from 'express';
import {
  getMeProfile,
  updateMeProfile,
  uploadAvatar,
  upload,
} from '../../controller/userController.js';

const router = Router();
router.get('/me', getMeProfile);
router.put('/me', updateMeProfile);
router.post('/avatar', upload.single('avatar'), uploadAvatar);

export default router;
