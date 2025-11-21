import { prisma } from '../index';
import { AppError } from '../middleware/errorHandler';
import { EngagementStatus } from '@prisma/client';

export class PriorYearService {
  /**
   * Get prior year engagements for a taxpayer
   */
  async getPriorYearEngagements(taxpayerEIN: string, currentYear: number) {
    const priorEngagements = await prisma.engagement.findMany({
      where: {
        taxpayerEIN,
        taxYear: { lt: currentYear },
      },
      include: {
        projects: { select: { id: true, name: true } },
        calculations: {
          select: { totalQRE: true, regularCreditAmount: true },
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { taxYear: 'desc' },
      take: 5, // Last 5 years
    });

    return priorEngagements;
  }

  /**
   * Create new engagement from prior year data
   */
  async createFromPriorYear(
    priorEngagementId: string,
    newYear: number,
    userId: string
  ) {
    const priorEngagement = await prisma.engagement.findUnique({
      where: { id: priorEngagementId },
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
      },
    });

    if (!priorEngagement) {
      throw new AppError('Prior year engagement not found', 404);
    }

    // Check if engagement for this year already exists
    const existing = await prisma.engagement.findFirst({
      where: {
        taxpayerEIN: priorEngagement.taxpayerEIN,
        taxYear: newYear,
      },
    });

    if (existing) {
      throw new AppError(
        `Engagement for tax year ${newYear} already exists`,
        400
      );
    }

    // Create new engagement
    const newEngagement = await prisma.engagement.create({
      data: {
        taxpayerName: priorEngagement.taxpayerName,
        taxpayerEIN: priorEngagement.taxpayerEIN,
        taxpayerAddress: priorEngagement.taxpayerAddress,
        taxYear: newYear,
        selectedStates: priorEngagement.selectedStates,
        status: EngagementStatus.DRAFT,
        shareFileFolderId: `temp_${Date.now()}`, // Will be replaced with actual ShareFile folder
        createdById: userId,
        // priorYearEngagementId: priorEngagementId, // Uncomment after schema migration
      },
    });

    // Copy projects (structure only, clear narratives)
    for (const priorProject of priorEngagement.projects) {
      const newProject = await prisma.project.create({
        data: {
          engagementId: newEngagement.id,
          name: priorProject.name,
          description: `[Copied from prior year - please update for ${newYear}]`,
          businessComponent: priorProject.businessComponent,
          technologiesUsed: priorProject.technologiesUsed,
          permittedPurpose: {}, // Clear for new year
          eliminationUncertainty: {},
          processExperimentation: {},
          technologicalNature: {},
          narrativeOriginal: null,
          narrativeImproved: null,
          narrativeApproved: false,
          isValidated: false,
          createdById: userId,
        },
      });

      // Copy employee wages (set to $0 for new year)
      for (const wage of priorProject.wages) {
        await prisma.wage.create({
          data: {
            engagementId: newEngagement.id,
            projectId: newProject.id,
            employeeName: wage.employeeName,
            annualSalary: wage.annualSalary, // Keep same salary as starting point
            percentTime: 0, // User must update
            qualifiedWages: 0,
            notes: `Copied from ${newYear - 1} - please update time allocation`,
          },
        });
      }
    }

    // Copy unallocated employees
    const unallocatedWages = priorEngagement.wages.filter(
      (w) => !w.projectId
    );
    for (const wage of unallocatedWages) {
      await prisma.wage.create({
        data: {
          engagementId: newEngagement.id,
          projectId: null,
          employeeName: wage.employeeName,
          annualSalary: wage.annualSalary,
          percentTime: 0,
          qualifiedWages: 0,
          notes: `Copied from ${newYear - 1} - please update`,
        },
      });
    }

    // Log audit event
    await prisma.auditLog.create({
      data: {
        userId,
        engagementId: newEngagement.id,
        action: 'CREATE_FROM_PRIOR_YEAR',
        entityType: 'Engagement',
        entityId: newEngagement.id,
        changes: {
          priorYearEngagementId,
          priorYearTaxYear: priorEngagement.taxYear,
          newYear,
        },
      },
    });

    return newEngagement;
  }

  /**
   * Copy specific data elements from prior year
   */
  async copyDataSelectively(
    sourceEngagementId: string,
    targetEngagementId: string,
    options: {
      copyProjects?: boolean;
      copyEmployees?: boolean;
      copySuppliers?: boolean;
      copyContractors?: boolean;
    },
    userId: string
  ) {
    const source = await prisma.engagement.findUnique({
      where: { id: sourceEngagementId },
      include: {
        projects: true,
        wages: true,
        supplies: true,
        contracts: true,
      },
    });

    const target = await prisma.engagement.findUnique({
      where: { id: targetEngagementId },
    });

    if (!source || !target) {
      throw new AppError('Engagement not found', 404);
    }

    let copiedCount = 0;

    // Copy projects
    if (options.copyProjects) {
      for (const project of source.projects) {
        await prisma.project.create({
          data: {
            engagementId: targetEngagementId,
            name: project.name,
            description: '',
            businessComponent: project.businessComponent,
            technologiesUsed: project.technologiesUsed,
            permittedPurpose: {},
            eliminationUncertainty: {},
            processExperimentation: {},
            technologicalNature: {},
            createdById: userId,
          },
        });
        copiedCount++;
      }
    }

    // Copy employees
    if (options.copyEmployees) {
      for (const wage of source.wages) {
        await prisma.wage.create({
          data: {
            engagementId: targetEngagementId,
            employeeName: wage.employeeName,
            annualSalary: wage.annualSalary,
            percentTime: 0,
            qualifiedWages: 0,
          },
        });
        copiedCount++;
      }
    }

    // Copy suppliers
    if (options.copySuppliers) {
      const uniqueSuppliers = new Set(
        source.supplies.map((s) => s.description)
      );
      for (const description of uniqueSuppliers) {
        await prisma.supply.create({
          data: {
            engagementId: targetEngagementId,
            description,
            totalCost: 0,
            qualifiedAmount: 0,
          },
        });
        copiedCount++;
      }
    }

    // Copy contractors
    if (options.copyContractors) {
      const uniqueContractors = new Set(
        source.contracts.map((c) => c.vendorName)
      );
      for (const vendorName of uniqueContractors) {
        await prisma.contractResearch.create({
          data: {
            engagementId: targetEngagementId,
            vendorName,
            contractAmount: 0,
            qualifiedPercent: 0,
            qualifiedAmount: 0,
          },
        });
        copiedCount++;
      }
    }

    // Log audit
    await prisma.auditLog.create({
      data: {
        userId,
        engagementId: targetEngagementId,
        action: 'COPY_SELECTIVE_DATA',
        entityType: 'Engagement',
        entityId: targetEngagementId,
        changes: {
          sourceEngagementId,
          options,
          copiedCount,
        },
      },
    });

    return {
      success: true,
      copiedCount,
      message: `Successfully copied ${copiedCount} items`,
    };
  }

  /**
   * Get year-over-year comparison
   */
  async getYearOverYearComparison(taxpayerEIN: string, years: number[]) {
    const engagements = await prisma.engagement.findMany({
      where: {
        taxpayerEIN,
        taxYear: { in: years },
      },
      include: {
        projects: { select: { id: true, name: true } },
        calculations: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
      },
      orderBy: { taxYear: 'asc' },
    });

    const comparison = engagements.map((eng) => {
      const calc = eng.calculations[0];
      return {
        year: eng.taxYear,
        status: eng.status,
        projectCount: eng.projects.length,
        totalQRE: calc ? Number(calc.totalQRE) : 0,
        totalWages: calc ? Number(calc.totalWages) : 0,
        totalSupplies: calc ? Number(calc.totalSupplies) : 0,
        totalContracts: calc ? Number(calc.totalContracts) : 0,
        regularCredit: calc ? Number(calc.regularCreditAmount) : 0,
        ascCredit: calc ? Number(calc.ascCreditAmount) : 0,
      };
    });

    // Calculate trends
    const trends = this.calculateTrends(comparison);

    return {
      taxpayerEIN,
      years,
      comparison,
      trends,
    };
  }

  /**
   * Calculate growth trends
   */
  private calculateTrends(data: any[]) {
    if (data.length < 2) return null;

    const latest = data[data.length - 1];
    const previous = data[data.length - 2];

    const qreGrowth =
      previous.totalQRE > 0
        ? ((latest.totalQRE - previous.totalQRE) / previous.totalQRE) * 100
        : 0;

    const creditGrowth =
      previous.regularCredit > 0
        ? ((latest.regularCredit - previous.regularCredit) /
            previous.regularCredit) *
          100
        : 0;

    const avgQRE =
      data.reduce((sum, d) => sum + d.totalQRE, 0) / data.length;

    return {
      qreGrowth: qreGrowth.toFixed(2) + '%',
      creditGrowth: creditGrowth.toFixed(2) + '%',
      avgQRE: avgQRE.toFixed(2),
      totalYears: data.length,
    };
  }

  /**
   * Pre-fill form with prior year data
   */
  async getPrefillData(priorEngagementId: string) {
    const prior = await prisma.engagement.findUnique({
      where: { id: priorEngagementId },
      include: {
        projects: {
          select: {
            name: true,
            businessComponent: true,
            technologiesUsed: true,
          },
        },
        wages: {
          select: {
            employeeName: true,
            annualSalary: true,
          },
        },
      },
    });

    if (!prior) {
      throw new AppError('Prior engagement not found', 404);
    }

    return {
      taxpayerInfo: {
        name: prior.taxpayerName,
        ein: prior.taxpayerEIN,
        address: prior.taxpayerAddress,
      },
      selectedStates: prior.selectedStates,
      projectTemplates: prior.projects.map((p) => ({
        name: p.name,
        businessComponent: p.businessComponent,
        technologies: p.technologiesUsed,
      })),
      employees: prior.wages.map((w) => ({
        name: w.employeeName,
        salary: Number(w.annualSalary),
      })),
    };
  }
}
