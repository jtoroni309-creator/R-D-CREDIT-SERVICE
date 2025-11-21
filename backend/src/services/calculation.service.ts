import { prisma } from '../index';
import { AppError } from '../middleware/errorHandler';
import { Decimal } from '@prisma/client/runtime/library';

interface FederalRegularCreditResult {
  baseAmount: number;
  excessQRE: number;
  creditAmount: number;
}

interface FederalASCResult {
  baseAmount: number;
  excessQRE: number;
  creditAmount: number;
}

interface StateCredit {
  stateCode: string;
  stateName: string;
  creditRate: number;
  baseAmount: number;
  creditAmount: number;
  hasCarryforward: boolean;
  carryforwardYears?: number;
}

interface CalculationResult {
  totalWages: number;
  totalSupplies: number;
  totalContracts: number;
  totalQRE: number;
  regularCredit: FederalRegularCreditResult;
  ascCredit: FederalASCResult;
  stateCredits: StateCredit[];
  projectAllocations: any;
}

export class CalculationService {
  /**
   * Run complete calculation for an engagement
   */
  async calculateCredits(engagementId: string, userId: string): Promise<CalculationResult> {
    const engagement = await prisma.engagement.findUnique({
      where: { id: engagementId },
      include: {
        wages: true,
        supplies: true,
        contracts: true,
        projects: true,
      },
    });

    if (!engagement) {
      throw new AppError('Engagement not found', 404);
    }

    // Calculate totals
    const totalWages = this.sumDecimal(engagement.wages.map((w) => w.qualifiedWages));
    const totalSupplies = this.sumDecimal(engagement.supplies.map((s) => s.qualifiedAmount));
    const totalContracts = this.sumDecimal(engagement.contracts.map((c) => c.qualifiedAmount));
    const totalQRE = totalWages + totalSupplies + totalContracts;

    // Calculate Federal Regular Credit
    const regularCredit = await this.calculateFederalRegularCredit(
      totalQRE,
      engagement.taxpayerEIN,
      engagement.taxYear
    );

    // Calculate Federal ASC
    const ascCredit = await this.calculateFederalASC(
      totalQRE,
      engagement.taxpayerEIN,
      engagement.taxYear
    );

    // Calculate State Credits
    const stateCredits = await this.calculateStateCredits(
      totalQRE,
      engagement.selectedStates
    );

    // Calculate project allocations
    const projectAllocations = this.calculateProjectAllocations(engagement);

    // Save calculation results
    const calculation = await prisma.calculation.create({
      data: {
        engagementId,
        totalWages: new Decimal(totalWages),
        totalSupplies: new Decimal(totalSupplies),
        totalContracts: new Decimal(totalContracts),
        totalQRE: new Decimal(totalQRE),
        regularBaseAmount: new Decimal(regularCredit.baseAmount),
        regularExcessQRE: new Decimal(regularCredit.excessQRE),
        regularCreditAmount: new Decimal(regularCredit.creditAmount),
        ascBaseAmount: new Decimal(ascCredit.baseAmount),
        ascExcessQRE: new Decimal(ascCredit.excessQRE),
        ascCreditAmount: new Decimal(ascCredit.creditAmount),
        stateCredits: stateCredits,
        projectAllocations,
        calculatedBy: userId,
      },
    });

    return {
      totalWages,
      totalSupplies,
      totalContracts,
      totalQRE,
      regularCredit,
      ascCredit,
      stateCredits,
      projectAllocations,
    };
  }

  /**
   * Calculate Federal Regular Credit (Section 41)
   */
  private async calculateFederalRegularCredit(
    currentYearQRE: number,
    ein: string,
    taxYear: number
  ): Promise<FederalRegularCreditResult> {
    // For demonstration - in production, this would use historical data
    // Formula: 20% × (Current Year QRE - Base Amount)
    // Base Amount = Fixed-Base % × Average Annual Gross Receipts (4 years)

    // Simplified calculation - would need historical data
    const fixedBasePercentage = 0.03; // Example: 3%
    const averageGrossReceipts = 10000000; // Example: $10M
    const baseAmount = fixedBasePercentage * averageGrossReceipts;

    const excessQRE = Math.max(0, currentYearQRE - baseAmount);
    const creditAmount = excessQRE * 0.20;

    return {
      baseAmount,
      excessQRE,
      creditAmount,
    };
  }

  /**
   * Calculate Federal Alternative Simplified Credit (ASC)
   */
  private async calculateFederalASC(
    currentYearQRE: number,
    ein: string,
    taxYear: number
  ): Promise<FederalASCResult> {
    // Formula: 14% × (Current Year QRE - 50% × Average QREs (prior 3 years))

    // Get prior 3 years QRE (simplified - would query historical data)
    const priorYearQREs = await this.getPriorYearQREs(ein, taxYear, 3);
    const averagePriorQRE = priorYearQREs.length > 0
      ? priorYearQREs.reduce((sum, qre) => sum + qre, 0) / priorYearQREs.length
      : 0;

    const baseAmount = averagePriorQRE * 0.50;
    const excessQRE = Math.max(0, currentYearQRE - baseAmount);
    const creditAmount = excessQRE * 0.14;

    return {
      baseAmount,
      excessQRE,
      creditAmount,
    };
  }

  /**
   * Calculate State Credits
   */
  private async calculateStateCredits(
    totalQRE: number,
    selectedStates: string[]
  ): Promise<StateCredit[]> {
    const stateConfigs = await prisma.stateConfig.findMany({
      where: {
        stateCode: { in: selectedStates },
        isActive: true,
      },
    });

    return stateConfigs.map((config) => {
      const rate = Number(config.creditRate);
      let baseAmount = 0;

      // Simplified - would use state-specific base calculation
      if (config.baseCalculation === 'METHOD_ASC') {
        baseAmount = totalQRE * 0.50;
      }

      const creditableAmount = Math.max(0, totalQRE - baseAmount);
      let creditAmount = creditableAmount * rate;

      // Apply cap if configured
      if (config.hasCap && config.capAmount) {
        creditAmount = Math.min(creditAmount, Number(config.capAmount));
      }

      return {
        stateCode: config.stateCode,
        stateName: config.stateName,
        creditRate: rate,
        baseAmount,
        creditAmount,
        hasCarryforward: config.hasCarryforward,
        carryforwardYears: config.carryforwardYears || undefined,
      };
    });
  }

  /**
   * Calculate QRE allocations by project
   */
  private calculateProjectAllocations(engagement: any): any {
    const allocations: any = {};

    engagement.projects.forEach((project: any) => {
      const projectWages = engagement.wages
        .filter((w: any) => w.projectId === project.id)
        .reduce((sum: number, w: any) => sum + Number(w.qualifiedWages), 0);

      const projectSupplies = engagement.supplies
        .filter((s: any) => s.projectId === project.id)
        .reduce((sum: number, s: any) => sum + Number(s.qualifiedAmount), 0);

      const projectContracts = engagement.contracts
        .filter((c: any) => c.projectId === project.id)
        .reduce((sum: number, c: any) => sum + Number(c.qualifiedAmount), 0);

      allocations[project.id] = {
        projectName: project.name,
        wages: projectWages,
        supplies: projectSupplies,
        contracts: projectContracts,
        total: projectWages + projectSupplies + projectContracts,
      };
    });

    return allocations;
  }

  /**
   * Get prior year QREs for base calculations
   */
  private async getPriorYearQREs(
    ein: string,
    currentYear: number,
    yearsBack: number
  ): Promise<number[]> {
    const priorYears = Array.from(
      { length: yearsBack },
      (_, i) => currentYear - (i + 1)
    );

    const priorEngagements = await prisma.engagement.findMany({
      where: {
        taxpayerEIN: ein,
        taxYear: { in: priorYears },
      },
      include: {
        calculations: {
          orderBy: { calculatedAt: 'desc' },
          take: 1,
        },
      },
    });

    return priorEngagements
      .filter((e) => e.calculations.length > 0)
      .map((e) => Number(e.calculations[0].totalQRE));
  }

  /**
   * Helper: Sum Decimal values
   */
  private sumDecimal(values: Decimal[]): number {
    return values.reduce((sum, val) => sum + Number(val), 0);
  }

  /**
   * Get latest calculation for engagement
   */
  async getLatestCalculation(engagementId: string) {
    const calculation = await prisma.calculation.findFirst({
      where: { engagementId },
      orderBy: { calculatedAt: 'desc' },
    });

    return calculation;
  }
}
