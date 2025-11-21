import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const authController = new AuthController();

// ShareFile OAuth flow
router.get('/sharefile/login', authController.initiateShareFileLogin);
router.get('/sharefile/callback', authController.handleShareFileCallback);

// Token management
router.post('/refresh', authController.refreshToken);
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/logout', authenticate, authController.logout);

export default router;
