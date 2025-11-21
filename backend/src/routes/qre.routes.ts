import { Router } from 'express';
import { QREController } from '../controllers/qre.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new QREController();

router.use(authenticate);

// Wages
router.get('/engagement/:engagementId/wages', controller.listWages);
router.post('/engagement/:engagementId/wages', controller.createWage);
router.put('/wages/:id', controller.updateWage);
router.delete('/wages/:id', controller.deleteWage);

// Supplies
router.get('/engagement/:engagementId/supplies', controller.listSupplies);
router.post('/engagement/:engagementId/supplies', controller.createSupply);
router.put('/supplies/:id', controller.updateSupply);
router.delete('/supplies/:id', controller.deleteSupply);

// Contracts
router.get('/engagement/:engagementId/contracts', controller.listContracts);
router.post('/engagement/:engagementId/contracts', controller.createContract);
router.put('/contracts/:id', controller.updateContract);
router.delete('/contracts/:id', controller.deleteContract);

export default router;
