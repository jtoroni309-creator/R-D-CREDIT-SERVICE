import { Router } from 'express';
import { ReportController } from '../controllers/report.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new ReportController();

router.use(authenticate);

router.post('/engagement/:engagementId/generate-pdf', controller.generatePDF);
router.post('/engagement/:engagementId/form6765/json', controller.exportForm6765JSON);
router.post('/engagement/:engagementId/form6765/csv', controller.exportForm6765CSV);
router.post('/engagement/:engagementId/form6765/excel', controller.exportForm6765Excel);

export default router;
