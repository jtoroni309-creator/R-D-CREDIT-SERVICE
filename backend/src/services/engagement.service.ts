import { prisma } from '../index';
import { EngagementStatus, UserRole } from '@prisma/client';
import { AppError } from '../middleware/errorHandler';
import { ShareFileService } from './sharefile.service';

interface CreateEngagementData {
  taxpayerName: string;
  taxpayerEIN: string;
  taxpayerAddress: string;
  taxYear: number;
  selectedStates: string[];
  shareFileFolderId?: string;
}

export class EngagementService {
  private shareFileService: ShareFileService;

  constructor() {
    this.shareFileService = new ShareFileService();
  }

  /**
   * Create new engagement
   */
  async createEngagement(data: CreateEngagementData, userId: string, accessToken?: string) {
    // Create ShareFile folder if not provided
    let folderId = data.shareFileFolderId;

    if (!folderId && accessToken) {
      const folderName = `${data.taxpayerName}_${data.taxYear}_RD_Study`;
      const folder = await this.shareFileService.createFolder(
        accessToken,
        'root', // Or specific parent folder ID
        folderName
      );
      folderId = folder.Id;
    }

    if (!folderId) {
      throw new AppError('ShareFile folder ID is required', 400);
    }

    const engagement = await prisma.engagement.create({
      data: {
        shareFileFolderId: folderId,
        taxpayerName: data.taxpayerName,
        taxpayerEIN: data.taxpayerEIN,
        taxpayerAddress: data.taxpayerAddress,
        taxYear: data.taxYear,
        selectedStates: data.selectedStates,
        status: EngagementStatus.DRAFT,
        createdById: userId,
      },
    });

    // Log audit event
    await this.logAudit(userId, 'CREATE', 'Engagement', engagement.id, null);

    return engagement;
  }

  /**
   * Get engagement by ID with full details
   */
  async getEngagement(engagementId: string, userId: string, userRole: UserRole) {
    const engagement = await prisma.engagement.findUnique({
      where: { id: engagementId },
      include: {
        projects: {
          include: {
            wages: true,
            supplies: true,
            contracts: true,
          },
        },
        wages: true,
        supplies: true,
        contracts: true,
        calculations: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
        reports: {
          orderBy: { generatedAt: 'desc' },
        },
      },
    });

    if (!engagement) {
      throw new AppError('Engagement not found', 404);
    }

    // Check permissions
    if (userRole === UserRole.CLIENT && engagement.createdById !== userId) {
      throw new AppError('Access denied', 403);
    }

    return engagement;
  }

  /**
   * List engagements (with pagination)
   */
  async listEngagements(
    userId: string,
    userRole: UserRole,
    filters: {
      status?: EngagementStatus;
      taxYear?: number;
      search?: string;
      page?: number;
      limit?: number;
    }
  ) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Client users only see their own engagements
    if (userRole === UserRole.CLIENT) {
      where.createdById = userId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.taxYear) {
      where.taxYear = filters.taxYear;
    }

    if (filters.search) {
      where.OR = [
        { taxpayerName: { contains: filters.search, mode: 'insensitive' } },
        { taxpayerEIN: { contains: filters.search } },
      ];
    }

    const [engagements, total] = await Promise.all([
      prisma.engagement.findMany({
        where,
        include: {
          projects: { select: { id: true, name: true } },
          calculations: {
            select: { totalQRE: true, regularCreditAmount: true },
            orderBy: { calculatedAt: 'desc' },
            take: 1,
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.engagement.count({ where }),
    ]);

    return {
      engagements,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update engagement
   */
  async updateEngagement(
    engagementId: string,
    data: Partial<CreateEngagementData>,
    userId: string
  ) {
    const engagement = await prisma.engagement.update({
      where: { id: engagementId },
      data: {
        ...(data.taxpayerName && { taxpayerName: data.taxpayerName }),
        ...(data.taxpayerEIN && { taxpayerEIN: data.taxpayerEIN }),
        ...(data.taxpayerAddress && { taxpayerAddress: data.taxpayerAddress }),
        ...(data.taxYear && { taxYear: data.taxYear }),
        ...(data.selectedStates && { selectedStates: data.selectedStates }),
      },
    });

    await this.logAudit(userId, 'UPDATE', 'Engagement', engagementId, data);

    return engagement;
  }

  /**
   * Update engagement status
   */
  async updateStatus(engagementId: string, status: EngagementStatus, userId: string) {
    const engagement = await prisma.engagement.update({
      where: { id: engagementId },
      data: {
        status,
        ...(status === EngagementStatus.COMPLETED && { finalizedAt: new Date() }),
      },
    });

    await this.logAudit(userId, 'STATUS_CHANGE', 'Engagement', engagementId, { status });

    return engagement;
  }

  /**
   * Delete engagement
   */
  async deleteEngagement(engagementId: string, userId: string) {
    await prisma.engagement.delete({
      where: { id: engagementId },
    });

    await this.logAudit(userId, 'DELETE', 'Engagement', engagementId, null);
  }

  /**
   * Get engagement summary statistics
   */
  async getEngagementSummary(engagementId: string) {
    const engagement = await prisma.engagement.findUnique({
      where: { id: engagementId },
      include: {
        projects: true,
        wages: true,
        supplies: true,
        contracts: true,
        calculations: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!engagement) {
      throw new AppError('Engagement not found', 404);
    }

    const totalWages = engagement.wages.reduce(
      (sum, w) => sum + Number(w.qualifiedWages),
      0
    );
    const totalSupplies = engagement.supplies.reduce(
      (sum, s) => sum + Number(s.qualifiedAmount),
      0
    );
    const totalContracts = engagement.contracts.reduce(
      (sum, c) => sum + Number(c.qualifiedAmount),
      0
    );

    return {
      taxpayerName: engagement.taxpayerName,
      taxYear: engagement.taxYear,
      status: engagement.status,
      projectCount: engagement.projects.length,
      totalWages,
      totalSupplies,
      totalContracts,
      totalQRE: totalWages + totalSupplies + totalContracts,
      latestCalculation: engagement.calculations[0] || null,
    };
  }

  /**
   * Log audit event
   */
  private async logAudit(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    changes: any
  ) {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        changes: changes || {},
      },
    });
  }
}
