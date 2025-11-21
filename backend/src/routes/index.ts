import { Router } from 'express';
import authRoutes from './auth.routes';
import engagementRoutes from './engagement.routes';
import projectRoutes from './project.routes';
import qreRoutes from './qre.routes';
import calculationRoutes from './calculation.routes';
import llmRoutes from './llm.routes';
import reportRoutes from './report.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/engagements', engagementRoutes);
router.use('/projects', projectRoutes);
router.use('/qre', qreRoutes);
router.use('/calculations', calculationRoutes);
router.use('/llm', llmRoutes);
router.use('/reports', reportRoutes);

export default router;
