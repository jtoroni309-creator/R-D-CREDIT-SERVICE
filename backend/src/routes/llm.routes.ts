import { Router } from 'express';
import { LLMController } from '../controllers/llm.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new LLMController();

router.use(authenticate);

router.post('/improve-narrative', controller.improveNarrative);
router.post('/expand-technical', controller.expandTechnical);
router.post('/suggest-missing', controller.suggestMissing);

export default router;
