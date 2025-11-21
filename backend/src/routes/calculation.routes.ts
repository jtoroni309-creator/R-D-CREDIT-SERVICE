import { Router } from 'express';
import { CalculationController } from '../controllers/calculation.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new CalculationController();

router.use(authenticate);

router.post('/engagement/:engagementId/calculate', controller.calculate);
router.get('/engagement/:engagementId/latest', controller.getLatest);

export default router;
