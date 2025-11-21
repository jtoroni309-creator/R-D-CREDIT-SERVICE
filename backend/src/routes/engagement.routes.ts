import { Router } from 'express';
import { EngagementController } from '../controllers/engagement.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();
const controller = new EngagementController();

// All routes require authentication
router.use(authenticate);

router.get('/', controller.listEngagements);
router.post('/', authorize(UserRole.STAFF, UserRole.ADMIN), controller.createEngagement);
router.get('/:id', controller.getEngagement);
router.put('/:id', authorize(UserRole.STAFF, UserRole.ADMIN), controller.updateEngagement);
router.delete('/:id', authorize(UserRole.ADMIN), controller.deleteEngagement);
router.get('/:id/summary', controller.getEngagementSummary);
router.put('/:id/status', authorize(UserRole.STAFF, UserRole.ADMIN), controller.updateStatus);

export default router;
