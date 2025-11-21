import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { DocumentService } from '../services/document.service';
import { DocumentCategory } from '@prisma/client';
import multer from 'multer';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_DOCUMENT_SIZE || '10485760'), // 10MB default
  },
});

export class DocumentController {
  private service: DocumentService;

  constructor() {
    this.service = new DocumentService();
  }

  /**
   * Upload single document
   */
  uploadDocument = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { engagementId, projectId, category, description, tags } = req.body;

      if (!engagementId || !category) {
        return res
          .status(400)
          .json({ error: 'Engagement ID and category are required' });
      }

      const accessToken = req.headers.authorization?.split(' ')[1];
      if (!accessToken) {
        return res.status(401).json({ error: 'No access token' });
      }

      const document = await this.service.uploadDocument(
        {
          engagementId,
          projectId,
          file: {
            originalname: req.file.originalname,
            buffer: req.file.buffer,
            size: req.file.size,
            mimetype: req.file.mimetype,
          },
          category: category as DocumentCategory,
          description,
          tags: tags ? JSON.parse(tags) : [],
        },
        req.user!.id,
        accessToken
      );

      res.status(201).json(document);
    } catch (error) {
      next(error);
    }
  };

  /**
   * List documents
   */
  listDocuments = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { engagementId } = req.params;
      const { projectId, category, search } = req.query;

      const documents = await this.service.listDocuments(engagementId, {
        projectId: projectId as string,
        category: category as DocumentCategory,
        search: search as string,
      });

      res.json(documents);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get document
   */
  getDocument = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const document = await this.service.getDocument(id);
      res.json(document);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Update document
   */
  updateDocument = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const { category, description, tags } = req.body;

      const document = await this.service.updateDocument(
        id,
        { category, description, tags },
        req.user!.id
      );

      res.json(document);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete document
   */
  deleteDocument = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;
      const result = await this.service.deleteDocument(id, req.user!.id);
      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get document statistics
   */
  getStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { engagementId } = req.params;
      const stats = await this.service.getDocumentStats(engagementId);
      res.json(stats);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Bulk upload
   */
  bulkUpload = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      if (!req.files || !Array.isArray(req.files)) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const { engagementId, category } = req.body;

      if (!engagementId || !category) {
        return res
          .status(400)
          .json({ error: 'Engagement ID and category are required' });
      }

      const accessToken = req.headers.authorization?.split(' ')[1];
      if (!accessToken) {
        return res.status(401).json({ error: 'No access token' });
      }

      const result = await this.service.bulkUpload(
        engagementId,
        req.files as Express.Multer.File[],
        category as DocumentCategory,
        req.user!.id,
        accessToken
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}

export const documentUpload = upload;
