import { Router } from 'express';
import { DocumentController, documentUpload } from '../controllers/document.controller';
import { authenticate } from '../middleware/auth';

const router = Router();
const controller = new DocumentController();

router.use(authenticate);

// Upload single document
router.post(
  '/upload',
  documentUpload.single('file'),
  controller.uploadDocument
);

// Bulk upload
router.post(
  '/bulk-upload',
  documentUpload.array('files', 10),
  controller.bulkUpload
);

// List documents for engagement
router.get('/engagement/:engagementId', controller.listDocuments);

// Get document
router.get('/:id', controller.getDocument);

// Update document
router.put('/:id', controller.updateDocument);

// Delete document
router.delete('/:id', controller.deleteDocument);

// Get stats
router.get('/engagement/:engagementId/stats', controller.getStats);

export default router;
