import { Router } from 'express';
import { PriorYearController } from '../controllers/prior-year.controller';
import { authenticate, authorize } from '../middleware/auth';
import { UserRole } from '@prisma/client';

const router = Router();
const controller = new PriorYearController();

// All routes require authentication
router.use(authenticate);

// Get prior year engagements
router.get('/prior-years', controller.getPriorYears);

// Create from prior year
router.post(
  '/create-from-prior',
  authorize(UserRole.STAFF, UserRole.ADMIN),
  controller.createFromPriorYear
);

// Copy selective data
router.post(
  '/copy-data',
  authorize(UserRole.STAFF, UserRole.ADMIN),
  controller.copyDataSelectively
);

// Year-over-year comparison
router.get('/comparison/:ein', controller.getComparison);

// Get prefill data
router.get('/prefill/:id', controller.getPrefillData);

export default router;
