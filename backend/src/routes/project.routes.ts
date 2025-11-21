import { Router } from 'express';
import { ProjectController } from '../controllers/project.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new ProjectController();

router.use(authenticate);

router.get('/engagement/:engagementId', controller.listProjects);
router.post('/engagement/:engagementId', controller.createProject);
router.get('/:id', controller.getProject);
router.put('/:id', controller.updateProject);
router.delete('/:id', controller.deleteProject);
router.post('/:id/validate-4part', controller.validate4PartTest);

export default router;
