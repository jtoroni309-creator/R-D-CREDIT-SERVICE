import ExcelJS from 'exceljs';
import { prisma } from '../index';
import { AppError } from '../middleware/errorHandler';

interface Form6765Data {
  // Part I - Current Year Credit
  line1_qualifiedWages: number;
  line2_qualifiedSupplies: number;
  line3_qualifiedContract: number;
  line4_totalQRE: number;

  // Regular Credit (Lines 5-9)
  line5_baseAmount: number;
  line6_excessQRE: number;
  line7_creditRate: number;
  line8_regularCredit: number;

  // ASC (Lines 10-16)
  line10_currentYearQRE: number;
  line11_priorYear1QRE: number;
  line12_priorYear2QRE: number;
  line13_priorYear3QRE: number;
  line14_averagePriorQRE: number;
  line15_baseAmount: number;
  line16_ascCredit: number;

  // Taxpayer info
  taxpayerName: string;
  ein: string;
  taxYear: number;
}

export class Form6765Service {
  /**
   * Generate Form 6765 data from engagement
   */
  async generateForm6765Data(engagementId: string): Promise<Form6765Data> {
    const engagement = await prisma.engagement.findUnique({
      where: { id: engagementId },
      include: {
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

    const calculation = engagement.calculations[0];
    if (!calculation) {
      throw new AppError('No calculations found for this engagement', 404);
    }

    const totalWages = Number(calculation.totalWages);
    const totalSupplies = Number(calculation.totalSupplies);
    const totalContracts = Number(calculation.totalContracts);
    const totalQRE = Number(calculation.totalQRE);

    // Get prior year QREs for ASC
    const priorYearQREs = await this.getPriorYearQREs(
      engagement.taxpayerEIN,
      engagement.taxYear
    );

    const formData: Form6765Data = {
      // Part I
      line1_qualifiedWages: totalWages,
      line2_qualifiedSupplies: totalSupplies,
      line3_qualifiedContract: totalContracts * 0.65, // 65% of contract research
      line4_totalQRE: totalQRE,

      // Regular Credit
      line5_baseAmount: Number(calculation.regularBaseAmount || 0),
      line6_excessQRE: Number(calculation.regularExcessQRE || 0),
      line7_creditRate: 0.20,
      line8_regularCredit: Number(calculation.regularCreditAmount || 0),

      // ASC
      line10_currentYearQRE: totalQRE,
      line11_priorYear1QRE: priorYearQREs[0] || 0,
      line12_priorYear2QRE: priorYearQREs[1] || 0,
      line13_priorYear3QRE: priorYearQREs[2] || 0,
      line14_averagePriorQRE:
        priorYearQREs.length > 0
          ? priorYearQREs.reduce((a, b) => a + b, 0) / priorYearQREs.length
          : 0,
      line15_baseAmount: Number(calculation.ascBaseAmount || 0),
      line16_ascCredit: Number(calculation.ascCreditAmount || 0),

      // Taxpayer info
      taxpayerName: engagement.taxpayerName,
      ein: engagement.taxpayerEIN,
      taxYear: engagement.taxYear,
    };

    return formData;
  }

  /**
   * Export Form 6765 data as JSON
   */
  async exportJSON(engagementId: string): Promise<string> {
    const formData = await this.generateForm6765Data(engagementId);
    return JSON.stringify(formData, null, 2);
  }

  /**
   * Export Form 6765 data as CSV
   */
  async exportCSV(engagementId: string): Promise<string> {
    const formData = await this.generateForm6765Data(engagementId);

    const rows = [
      ['Form 6765', 'Credit for Increasing Research Activities'],
      [''],
      ['Taxpayer Name', formData.taxpayerName],
      ['EIN', formData.ein],
      ['Tax Year', formData.taxYear.toString()],
      [''],
      ['Part I - Current Year Credit'],
      ['Line', 'Description', 'Amount'],
      ['1', 'Qualified Wages', formData.line1_qualifiedWages.toFixed(2)],
      ['2', 'Qualified Supplies', formData.line2_qualifiedSupplies.toFixed(2)],
      ['3', 'Qualified Contract Research (65%)', formData.line3_qualifiedContract.toFixed(2)],
      ['4', 'Total Qualified Research Expenses', formData.line4_totalQRE.toFixed(2)],
      [''],
      ['Regular Credit Calculation'],
      ['5', 'Base Amount', formData.line5_baseAmount.toFixed(2)],
      ['6', 'Excess QRE', formData.line6_excessQRE.toFixed(2)],
      ['7', 'Credit Rate', '20%'],
      ['8', 'Regular Credit', formData.line8_regularCredit.toFixed(2)],
      [''],
      ['Alternative Simplified Credit Calculation'],
      ['10', 'Current Year QRE', formData.line10_currentYearQRE.toFixed(2)],
      ['11', 'Prior Year 1 QRE', formData.line11_priorYear1QRE.toFixed(2)],
      ['12', 'Prior Year 2 QRE', formData.line12_priorYear2QRE.toFixed(2)],
      ['13', 'Prior Year 3 QRE', formData.line13_priorYear3QRE.toFixed(2)],
      ['14', 'Average Prior QRE', formData.line14_averagePriorQRE.toFixed(2)],
      ['15', 'Base Amount (50% of Average)', formData.line15_baseAmount.toFixed(2)],
      ['16', 'ASC (14%)', formData.line16_ascCredit.toFixed(2)],
    ];

    return rows.map((row) => row.join(',')).join('\n');
  }

  /**
   * Export Form 6765 data as Excel
   */
  async exportExcel(engagementId: string): Promise<Buffer> {
    const formData = await this.generateForm6765Data(engagementId);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Form 6765');

    // Title
    worksheet.mergeCells('A1:D1');
    worksheet.getCell('A1').value = 'Form 6765 - Credit for Increasing Research Activities';
    worksheet.getCell('A1').font = { size: 14, bold: true };
    worksheet.getCell('A1').alignment = { horizontal: 'center' };

    // Taxpayer Info
    worksheet.addRow([]);
    worksheet.addRow(['Taxpayer Name:', formData.taxpayerName]);
    worksheet.addRow(['EIN:', formData.ein]);
    worksheet.addRow(['Tax Year:', formData.taxYear]);

    // Part I
    worksheet.addRow([]);
    worksheet.addRow(['Part I - Current Year Credit']).font = { bold: true };
    worksheet.addRow(['Line', 'Description', 'Amount']);

    const dataRows = [
      [1, 'Qualified Wages', formData.line1_qualifiedWages],
      [2, 'Qualified Supplies', formData.line2_qualifiedSupplies],
      [3, 'Qualified Contract Research (65%)', formData.line3_qualifiedContract],
      [4, 'Total QRE', formData.line4_totalQRE],
      [],
      ['Regular Credit Calculation'],
      [5, 'Base Amount', formData.line5_baseAmount],
      [6, 'Excess QRE', formData.line6_excessQRE],
      [7, 'Credit Rate', '20%'],
      [8, 'Regular Credit', formData.line8_regularCredit],
      [],
      ['Alternative Simplified Credit Calculation'],
      [10, 'Current Year QRE', formData.line10_currentYearQRE],
      [11, 'Prior Year 1 QRE', formData.line11_priorYear1QRE],
      [12, 'Prior Year 2 QRE', formData.line12_priorYear2QRE],
      [13, 'Prior Year 3 QRE', formData.line13_priorYear3QRE],
      [14, 'Average Prior QRE', formData.line14_averagePriorQRE],
      [15, 'Base Amount (50%)', formData.line15_baseAmount],
      [16, 'ASC (14%)', formData.line16_ascCredit],
    ];

    dataRows.forEach((row) => {
      worksheet.addRow(row);
    });

    // Formatting
    worksheet.columns = [
      { width: 10 },
      { width: 40 },
      { width: 20 },
    ];

    // Currency formatting for amounts
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber > 8) {
        const cell = row.getCell(3);
        if (typeof cell.value === 'number') {
          cell.numFmt = '$#,##0.00';
        }
      }
    });

    return await workbook.xlsx.writeBuffer() as Buffer;
  }

  /**
   * Get prior year QREs for ASC calculation
   */
  private async getPriorYearQREs(ein: string, currentYear: number): Promise<number[]> {
    const priorYears = [currentYear - 1, currentYear - 2, currentYear - 3];

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

    const qresByYear = new Map<number, number>();
    priorEngagements.forEach((eng) => {
      if (eng.calculations.length > 0) {
        qresByYear.set(eng.taxYear, Number(eng.calculations[0].totalQRE));
      }
    });

    return priorYears.map((year) => qresByYear.get(year) || 0);
  }
}
