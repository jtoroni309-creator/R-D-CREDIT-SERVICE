/**
 * Universal Tax Calculation Engine
 *
 * Handles all tax calculations including:
 * - Tax brackets and rates
 * - Alternative Minimum Tax (AMT)
 * - Net Investment Income Tax (NIIT)
 * - Self-employment tax
 * - Estimated tax
 * - State tax calculations
 * - Phase-outs and limitations
 */

import { EventEmitter } from 'events';

// ============================================
// Type Definitions
// ============================================

export interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

export interface FilingStatus {
  status: 'SINGLE' | 'MARRIED_JOINT' | 'MARRIED_SEPARATE' | 'HEAD_OF_HOUSEHOLD' | 'QUALIFYING_WIDOW';
  standardDeduction: number;
  taxBrackets: TaxBracket[];
  amtExemption: number;
  amtPhaseoutStart: number;
}

export interface TaxCalculationResult {
  taxableIncome: number;
  regularTax: number;
  amt: number;
  totalTax: number;
  selfEmploymentTax: number;
  niit: number;
  effectiveRate: number;
  marginalRate: number;
  breakdown: {
    [bracket: string]: {
      income: number;
      tax: number;
      rate: number;
    };
  };
}

export interface EstimatedTaxCalculation {
  requiredAnnualPayment: number;
  safeHarbor: number;
  quarterlyPayment: number;
  underpaymentPenalty: number;
}

export interface StateTaxCalculation {
  stateCode: string;
  stateTaxableIncome: number;
  stateTax: number;
  localTax?: number;
}

// ============================================
// Calculation Engine
// ============================================

export class CalculationEngine extends EventEmitter {
  private taxYearData: Map<number, any> = new Map();
  private stateTaxRates: Map<string, any> = new Map();

  constructor() {
    super();
    this.loadTaxData();
  }

  /**
   * Load tax year data (brackets, deductions, etc.)
   */
  private loadTaxData(): void {
    // 2024 Tax Year Data
    this.taxYearData.set(2024, {
      filingStatuses: {
        SINGLE: {
          standardDeduction: 14600,
          taxBrackets: [
            { min: 0, max: 11600, rate: 0.10 },
            { min: 11600, max: 47150, rate: 0.12 },
            { min: 47150, max: 100525, rate: 0.22 },
            { min: 100525, max: 191950, rate: 0.24 },
            { min: 191950, max: 243725, rate: 0.32 },
            { min: 243725, max: 609350, rate: 0.35 },
            { min: 609350, max: Infinity, rate: 0.37 },
          ],
          amtExemption: 85700,
          amtPhaseoutStart: 609350,
        },
        MARRIED_JOINT: {
          standardDeduction: 29200,
          taxBrackets: [
            { min: 0, max: 23200, rate: 0.10 },
            { min: 23200, max: 94300, rate: 0.12 },
            { min: 94300, max: 201050, rate: 0.22 },
            { min: 201050, max: 383900, rate: 0.24 },
            { min: 383900, max: 487450, rate: 0.32 },
            { min: 487450, max: 731200, rate: 0.35 },
            { min: 731200, max: Infinity, rate: 0.37 },
          ],
          amtExemption: 133300,
          amtPhaseoutStart: 1218700,
        },
        HEAD_OF_HOUSEHOLD: {
          standardDeduction: 21900,
          taxBrackets: [
            { min: 0, max: 16550, rate: 0.10 },
            { min: 16550, max: 63100, rate: 0.12 },
            { min: 63100, max: 100500, rate: 0.22 },
            { min: 100500, max: 191950, rate: 0.24 },
            { min: 191950, max: 243700, rate: 0.32 },
            { min: 243700, max: 609350, rate: 0.35 },
            { min: 609350, max: Infinity, rate: 0.37 },
          ],
          amtExemption: 85700,
          amtPhaseoutStart: 609350,
        },
      },
      socialSecurityWageBase: 168600,
      socialSecurityRate: 0.124, // 12.4% for self-employed
      medicareRate: 0.029, // 2.9% for self-employed
      additionalMedicareRate: 0.009, // 0.9% additional
      additionalMedicareThreshold: {
        SINGLE: 200000,
        MARRIED_JOINT: 250000,
        MARRIED_SEPARATE: 125000,
      },
      niitRate: 0.038, // 3.8% Net Investment Income Tax
      niitThreshold: {
        SINGLE: 200000,
        MARRIED_JOINT: 250000,
        MARRIED_SEPARATE: 125000,
      },
      amtRate1: 0.26, // First $220,700 for married joint
      amtRate2: 0.28, // Over $220,700
      amtCrossover: 220700,
    });

    // Load state tax data
    this.loadStateTaxData();
  }

  /**
   * Load state tax rates and calculations
   */
  private loadStateTaxData(): void {
    // California
    this.stateTaxRates.set('CA', {
      taxBrackets: {
        SINGLE: [
          { min: 0, max: 10412, rate: 0.01 },
          { min: 10412, max: 24684, rate: 0.02 },
          { min: 24684, max: 38959, rate: 0.04 },
          { min: 38959, max: 54081, rate: 0.06 },
          { min: 54081, max: 68350, rate: 0.08 },
          { min: 68350, max: 349137, rate: 0.093 },
          { min: 349137, max: 418961, rate: 0.103 },
          { min: 418961, max: 698271, rate: 0.113 },
          { min: 698271, max: Infinity, rate: 0.123 },
        ],
      },
      standardDeduction: {
        SINGLE: 5363,
        MARRIED_JOINT: 10726,
      },
    });

    // New York
    this.stateTaxRates.set('NY', {
      taxBrackets: {
        SINGLE: [
          { min: 0, max: 8500, rate: 0.04 },
          { min: 8500, max: 11700, rate: 0.045 },
          { min: 11700, max: 13900, rate: 0.0525 },
          { min: 13900, max: 80650, rate: 0.055 },
          { min: 80650, max: 215400, rate: 0.06 },
          { min: 215400, max: 1077550, rate: 0.0685 },
          { min: 1077550, max: 5000000, rate: 0.0965 },
          { min: 5000000, max: 25000000, rate: 0.103 },
          { min: 25000000, max: Infinity, rate: 0.109 },
        ],
      },
      standardDeduction: {
        SINGLE: 8000,
        MARRIED_JOINT: 16050,
      },
    });

    // Additional states would be added here...
  }

  /**
   * Calculate regular income tax
   */
  public calculateRegularTax(
    taxableIncome: number,
    filingStatus: string,
    taxYear: number = 2024
  ): TaxCalculationResult {
    const yearData = this.taxYearData.get(taxYear);
    if (!yearData) {
      throw new Error(`Tax data not available for year ${taxYear}`);
    }

    const statusData = yearData.filingStatuses[filingStatus];
    if (!statusData) {
      throw new Error(`Filing status not found: ${filingStatus}`);
    }

    let totalTax = 0;
    let previousBracketMax = 0;
    const breakdown: any = {};

    for (const bracket of statusData.taxBrackets) {
      if (taxableIncome <= previousBracketMax) {
        break;
      }

      const bracketIncome = Math.min(taxableIncome, bracket.max) - bracket.min;
      const bracketTax = bracketIncome * bracket.rate;

      if (bracketIncome > 0) {
        totalTax += bracketTax;
        breakdown[`bracket_${bracket.rate * 100}%`] = {
          income: bracketIncome,
          tax: bracketTax,
          rate: bracket.rate,
        };
      }

      previousBracketMax = bracket.max;
    }

    // Calculate marginal rate
    let marginalRate = 0;
    for (const bracket of statusData.taxBrackets) {
      if (taxableIncome >= bracket.min && taxableIncome <= bracket.max) {
        marginalRate = bracket.rate;
        break;
      }
    }

    return {
      taxableIncome,
      regularTax: Math.round(totalTax),
      amt: 0, // Calculated separately
      totalTax: Math.round(totalTax),
      selfEmploymentTax: 0,
      niit: 0,
      effectiveRate: taxableIncome > 0 ? totalTax / taxableIncome : 0,
      marginalRate,
      breakdown,
    };
  }

  /**
   * Calculate Alternative Minimum Tax
   */
  public calculateAMT(
    regularTaxableIncome: number,
    amtAdjustments: number,
    filingStatus: string,
    taxYear: number = 2024
  ): number {
    const yearData = this.taxYearData.get(taxYear);
    if (!yearData) return 0;

    const statusData = yearData.filingStatuses[filingStatus];
    if (!statusData) return 0;

    // Calculate AMTI (Alternative Minimum Taxable Income)
    const amti = regularTaxableIncome + amtAdjustments;

    // Apply AMT exemption with phaseout
    let exemption = statusData.amtExemption;
    if (amti > statusData.amtPhaseoutStart) {
      const phaseout = (amti - statusData.amtPhaseoutStart) * 0.25;
      exemption = Math.max(0, exemption - phaseout);
    }

    const amtBase = Math.max(0, amti - exemption);

    // Calculate AMT
    let amt = 0;
    if (amtBase <= yearData.amtCrossover) {
      amt = amtBase * yearData.amtRate1;
    } else {
      amt = yearData.amtCrossover * yearData.amtRate1 +
            (amtBase - yearData.amtCrossover) * yearData.amtRate2;
    }

    return Math.round(amt);
  }

  /**
   * Calculate Self-Employment Tax
   */
  public calculateSelfEmploymentTax(
    netEarnings: number,
    filingStatus: string,
    taxYear: number = 2024
  ): number {
    const yearData = this.taxYearData.get(taxYear);
    if (!yearData) return 0;

    // Apply 92.35% to net earnings
    const seIncome = netEarnings * 0.9235;

    // Social Security portion (capped)
    const ssCap = Math.min(seIncome, yearData.socialSecurityWageBase);
    const ssTax = ssCap * yearData.socialSecurityRate;

    // Medicare portion (uncapped)
    const medicareTax = seIncome * yearData.medicareRate;

    // Additional Medicare tax if over threshold
    let additionalMedicare = 0;
    const threshold = yearData.additionalMedicareThreshold[filingStatus] || 200000;
    if (seIncome > threshold) {
      additionalMedicare = (seIncome - threshold) * yearData.additionalMedicareRate;
    }

    return Math.round(ssTax + medicareTax + additionalMedicare);
  }

  /**
   * Calculate Net Investment Income Tax
   */
  public calculateNIIT(
    netInvestmentIncome: number,
    magi: number,
    filingStatus: string,
    taxYear: number = 2024
  ): number {
    const yearData = this.taxYearData.get(taxYear);
    if (!yearData) return 0;

    const threshold = yearData.niitThreshold[filingStatus] || 200000;

    if (magi <= threshold) {
      return 0;
    }

    const excessMAGI = magi - threshold;
    const taxableNII = Math.min(netInvestmentIncome, excessMAGI);

    return Math.round(taxableNII * yearData.niitRate);
  }

  /**
   * Calculate state income tax
   */
  public calculateStateTax(
    federalAGI: number,
    stateAdjustments: number,
    filingStatus: string,
    stateCode: string,
    taxYear: number = 2024
  ): StateTaxCalculation {
    const stateData = this.stateTaxRates.get(stateCode);
    if (!stateData) {
      return {
        stateCode,
        stateTaxableIncome: 0,
        stateTax: 0,
      };
    }

    // Calculate state taxable income
    const stateAGI = federalAGI + stateAdjustments;
    const standardDeduction = stateData.standardDeduction[filingStatus] || 0;
    const stateTaxableIncome = Math.max(0, stateAGI - standardDeduction);

    // Calculate state tax using brackets
    const brackets = stateData.taxBrackets[filingStatus] || stateData.taxBrackets.SINGLE;
    let stateTax = 0;
    let previousMax = 0;

    for (const bracket of brackets) {
      if (stateTaxableIncome <= previousMax) {
        break;
      }

      const bracketIncome = Math.min(stateTaxableIncome, bracket.max) - bracket.min;
      if (bracketIncome > 0) {
        stateTax += bracketIncome * bracket.rate;
      }

      previousMax = bracket.max;
    }

    return {
      stateCode,
      stateTaxableIncome: Math.round(stateTaxableIncome),
      stateTax: Math.round(stateTax),
    };
  }

  /**
   * Calculate estimated tax payments
   */
  public calculateEstimatedTax(
    expectedTotalTax: number,
    withholding: number,
    priorYearTax: number,
    priorYearAGI: number,
    currentYearAGI: number
  ): EstimatedTaxCalculation {
    // Safe harbor calculations
    const safeHarbor1 = expectedTotalTax * 0.9; // 90% of current year
    let safeHarbor2 = priorYearTax; // 100% of prior year

    // 110% rule for high earners
    if (priorYearAGI > 150000) {
      safeHarbor2 = priorYearTax * 1.1;
    }

    const safeHarbor = Math.min(safeHarbor1, safeHarbor2);
    const requiredPayment = Math.max(0, safeHarbor - withholding);
    const quarterlyPayment = Math.ceil(requiredPayment / 4);

    // Calculate underpayment penalty (simplified)
    const actualPayments = withholding;
    const underpayment = Math.max(0, safeHarbor - actualPayments);
    const underpaymentPenalty = underpayment > 1000 ? underpayment * 0.08 : 0; // 8% simplified rate

    return {
      requiredAnnualPayment: Math.round(safeHarbor),
      safeHarbor: Math.round(safeHarbor),
      quarterlyPayment: Math.round(quarterlyPayment),
      underpaymentPenalty: Math.round(underpaymentPenalty),
    };
  }

  /**
   * Calculate tax refund or amount due
   */
  public calculateRefundOrDue(
    totalTax: number,
    payments: {
      withholding: number;
      estimatedTax: number;
      priorYearOverpayment: number;
    }
  ): {
    totalPayments: number;
    refund: number;
    amountDue: number;
  } {
    const totalPayments = payments.withholding + payments.estimatedTax + payments.priorYearOverpayment;
    const difference = totalPayments - totalTax;

    return {
      totalPayments: Math.round(totalPayments),
      refund: Math.round(Math.max(0, difference)),
      amountDue: Math.round(Math.max(0, -difference)),
    };
  }

  /**
   * Calculate complete tax liability
   */
  public calculateCompleteTax(data: {
    taxableIncome: number;
    filingStatus: string;
    selfEmploymentIncome?: number;
    netInvestmentIncome?: number;
    magi?: number;
    amtAdjustments?: number;
    taxYear?: number;
  }): TaxCalculationResult {
    const taxYear = data.taxYear || 2024;

    // Regular tax
    const regularTax = this.calculateRegularTax(
      data.taxableIncome,
      data.filingStatus,
      taxYear
    );

    // Self-employment tax
    const selfEmploymentTax = data.selfEmploymentIncome
      ? this.calculateSelfEmploymentTax(data.selfEmploymentIncome, data.filingStatus, taxYear)
      : 0;

    // AMT
    const amt = data.amtAdjustments
      ? this.calculateAMT(data.taxableIncome, data.amtAdjustments, data.filingStatus, taxYear)
      : 0;

    // NIIT
    const niit = data.netInvestmentIncome && data.magi
      ? this.calculateNIIT(data.netInvestmentIncome, data.magi, data.filingStatus, taxYear)
      : 0;

    // Total tax is regular tax plus self-employment tax, AMT (if higher), and NIIT
    const totalTax = Math.max(regularTax.regularTax, amt) + selfEmploymentTax + niit;

    return {
      ...regularTax,
      amt,
      selfEmploymentTax,
      niit,
      totalTax: Math.round(totalTax),
    };
  }
}

// Export singleton instance
export default new CalculationEngine();
