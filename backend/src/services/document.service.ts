import { prisma } from '../index';
import { ShareFileService } from './sharefile.service';
import { AppError } from '../middleware/errorHandler';
import { DocumentCategory } from '@prisma/client';

interface UploadDocumentData {
  engagementId: string;
  projectId?: string;
  file: {
    originalname: string;
    buffer: Buffer;
    size: number;
    mimetype: string;
  };
  category: DocumentCategory;
  description?: string;
  tags?: string[];
}

export class DocumentService {
  private shareFileService: ShareFileService;

  constructor() {
    this.shareFileService = new ShareFileService();
  }

  /**
   * Upload document to ShareFile and create database record
   */
  async uploadDocument(
    data: UploadDocumentData,
    userId: string,
    accessToken: string
  ) {
    const engagement = await prisma.engagement.findUnique({
      where: { id: data.engagementId },
    });

    if (!engagement) {
      throw new AppError('Engagement not found', 404);
    }

    // Validate file size (10MB limit)
    const maxSize = parseInt(process.env.MAX_DOCUMENT_SIZE || '10485760');
    if (data.file.size > maxSize) {
      throw new AppError(
        `File size exceeds maximum of ${maxSize / 1024 / 1024}MB`,
        400
      );
    }

    // Validate file type
    const allowedTypes = (
      process.env.ALLOWED_FILE_TYPES || 'pdf,docx,xlsx,png,jpg,jpeg'
    ).split(',');
    const extension = data.file.originalname.split('.').pop()?.toLowerCase();
    if (!extension || !allowedTypes.includes(extension)) {
      throw new AppError(
        `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
        400
      );
    }

    // Upload to ShareFile
    const shareFileFile = await this.shareFileService.uploadFile(
      accessToken,
      engagement.shareFileFolderId,
      data.file.originalname,
      data.file.buffer
    );

    // Create database record
    const document = await prisma.document.create({
      data: {
        engagementId: data.engagementId,
        projectId: data.projectId,
        fileName: data.file.originalname,
        fileSize: data.file.size,
        fileType: data.file.mimetype,
        category: data.category,
        shareFileId: shareFileFile.Id,
        shareFileUrl: shareFileFile.url,
        description: data.description,
        tags: data.tags || [],
        uploadedById: userId,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        engagementId: data.engagementId,
        action: 'UPLOAD_DOCUMENT',
        entityType: 'Document',
        entityId: document.id,
        changes: {
          fileName: data.file.originalname,
          category: data.category,
        },
      },
    });

    return document;
  }

  /**
   * List documents for engagement
   */
  async listDocuments(
    engagementId: string,
    filters?: {
      projectId?: string;
      category?: DocumentCategory;
      search?: string;
    }
  ) {
    const where: any = { engagementId };

    if (filters?.projectId) {
      where.projectId = filters.projectId;
    }

    if (filters?.category) {
      where.category = filters.category;
    }

    if (filters?.search) {
      where.OR = [
        { fileName: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const documents = await prisma.document.findMany({
      where,
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        project: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { uploadedAt: 'desc' },
    });

    return documents;
  }

  /**
   * Get document by ID
   */
  async getDocument(documentId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
      include: {
        uploadedBy: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        engagement: {
          select: {
            taxpayerName: true,
            taxYear: true,
          },
        },
        project: {
          select: {
            name: true,
          },
        },
      },
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    return document;
  }

  /**
   * Update document metadata
   */
  async updateDocument(
    documentId: string,
    data: {
      category?: DocumentCategory;
      description?: string;
      tags?: string[];
    },
    userId: string
  ) {
    const document = await prisma.document.update({
      where: { id: documentId },
      data,
    });

    await prisma.auditLog.create({
      data: {
        userId,
        engagementId: document.engagementId,
        action: 'UPDATE_DOCUMENT',
        entityType: 'Document',
        entityId: documentId,
        changes: data,
      },
    });

    return document;
  }

  /**
   * Delete document
   */
  async deleteDocument(documentId: string, userId: string) {
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!document) {
      throw new AppError('Document not found', 404);
    }

    // Delete from database
    await prisma.document.delete({
      where: { id: documentId },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        engagementId: document.engagementId,
        action: 'DELETE_DOCUMENT',
        entityType: 'Document',
        entityId: documentId,
        changes: {
          fileName: document.fileName,
        },
      },
    });

    // Note: ShareFile deletion would be handled separately if needed
    return { success: true, message: 'Document deleted successfully' };
  }

  /**
   * Get document statistics
   */
  async getDocumentStats(engagementId: string) {
    const documents = await prisma.document.findMany({
      where: { engagementId },
    });

    const stats = {
      total: documents.length,
      totalSize: documents.reduce((sum, doc) => sum + doc.fileSize, 0),
      byCategory: {} as Record<string, number>,
      byProject: {} as Record<string, number>,
    };

    documents.forEach((doc) => {
      stats.byCategory[doc.category] =
        (stats.byCategory[doc.category] || 0) + 1;
      if (doc.projectId) {
        stats.byProject[doc.projectId] =
          (stats.byProject[doc.projectId] || 0) + 1;
      }
    });

    return stats;
  }

  /**
   * Bulk upload documents
   */
  async bulkUpload(
    engagementId: string,
    files: Express.Multer.File[],
    category: DocumentCategory,
    userId: string,
    accessToken: string
  ) {
    const results = [];

    for (const file of files) {
      try {
        const document = await this.uploadDocument(
          {
            engagementId,
            file: {
              originalname: file.originalname,
              buffer: file.buffer,
              size: file.size,
              mimetype: file.mimetype,
            },
            category,
          },
          userId,
          accessToken
        );
        results.push({ success: true, document });
      } catch (error: any) {
        results.push({
          success: false,
          fileName: file.originalname,
          error: error.message,
        });
      }
    }

    return {
      total: files.length,
      successful: results.filter((r) => r.success).length,
      failed: results.filter((r) => !r.success).length,
      results,
    };
  }
}
