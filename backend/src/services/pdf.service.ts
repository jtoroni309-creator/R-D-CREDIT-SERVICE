import PDFDocument from 'pdfkit';
import { prisma } from '../index';
import { AppError } from '../middleware/errorHandler';

interface PDFGenerationOptions {
  includeDetailedQRE?: boolean;
  includeProjectNarratives?: boolean;
  include4PartTest?: boolean;
}

export class PDFService {
  /**
   * Generate complete R&D Study PDF
   */
  async generateStudyPDF(
    engagementId: string,
    options: PDFGenerationOptions = {}
  ): Promise<Buffer> {
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
      },
    });

    if (!engagement) {
      throw new AppError('Engagement not found', 404);
    }

    const calculation = engagement.calculations[0];

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'LETTER',
        margins: { top: 72, bottom: 72, left: 72, right: 72 },
      });

      const buffers: Buffer[] = [];
      doc.on('data', buffers.push.bind(buffers));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', reject);

      // Title Page
      this.addTitlePage(doc, engagement);

      // Executive Summary
      doc.addPage();
      this.addExecutiveSummary(doc, engagement, calculation);

      // Section 1: Taxpayer Information
      doc.addPage();
      this.addTaxpayerInfo(doc, engagement);

      // Section 2: R&D Projects
      if (options.includeProjectNarratives !== false) {
        doc.addPage();
        this.addProjectsSection(doc, engagement.projects, options.include4PartTest);
      }

      // Section 3: Qualified Research Expenses
      doc.addPage();
      this.addQRESection(doc, engagement, options.includeDetailedQRE);

      // Section 4: Credit Calculations
      if (calculation) {
        doc.addPage();
        this.addCalculationsSection(doc, calculation);
      }

      // Section 5: Supporting Documentation
      doc.addPage();
      this.addSupportingDocumentation(doc);

      doc.end();
    });
  }

  private addTitlePage(doc: PDFKit.PDFDocument, engagement: any) {
    doc.fontSize(24).font('Helvetica-Bold').text('R&D TAX CREDIT STUDY', { align: 'center' });
    doc.moveDown(2);

    doc.fontSize(18).text(engagement.taxpayerName, { align: 'center' });
    doc.fontSize(14).text(`Tax Year ${engagement.taxYear}`, { align: 'center' });
    doc.moveDown(3);

    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Report Date: ${new Date().toLocaleDateString()}`, { align: 'center' });
    doc.moveDown(1);
    doc.text('Internal Revenue Code Section 41', { align: 'center' });
  }

  private addExecutiveSummary(doc: PDFKit.PDFDocument, engagement: any, calculation: any) {
    doc.fontSize(18).font('Helvetica-Bold').text('Executive Summary');
    doc.moveDown();

    doc.fontSize(12).font('Helvetica');

    const totalQRE = calculation ? Number(calculation.totalQRE) : 0;
    const regularCredit = calculation ? Number(calculation.regularCreditAmount) : 0;
    const ascCredit = calculation ? Number(calculation.ascCreditAmount) : 0;

    doc.text(
      `This R&D tax credit study documents the qualified research activities undertaken by ${engagement.taxpayerName} during tax year ${engagement.taxYear}.`
    );
    doc.moveDown();

    doc.text(
      `The company conducted ${engagement.projects.length} qualifying research project(s) that meet the requirements of IRC Section 41.`
    );
    doc.moveDown();

    doc.font('Helvetica-Bold').text('Credit Summary:');
    doc.font('Helvetica');
    doc.text(`Total Qualified Research Expenses: $${totalQRE.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    doc.text(`Federal Regular Credit: $${regularCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    doc.text(`Federal ASC: $${ascCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  }

  private addTaxpayerInfo(doc: PDFKit.PDFDocument, engagement: any) {
    doc.fontSize(18).font('Helvetica-Bold').text('Section 1: Taxpayer Information');
    doc.moveDown();

    doc.fontSize(12).font('Helvetica');
    doc.text(`Legal Name: ${engagement.taxpayerName}`);
    doc.text(`EIN: ${engagement.taxpayerEIN}`);
    doc.text(`Address: ${engagement.taxpayerAddress}`);
    doc.text(`Tax Year: ${engagement.taxYear}`);
  }

  private addProjectsSection(
    doc: PDFKit.PDFDocument,
    projects: any[],
    include4Part?: boolean
  ) {
    doc.fontSize(18).font('Helvetica-Bold').text('Section 2: R&D Projects');
    doc.moveDown();

    projects.forEach((project, index) => {
      if (index > 0) doc.addPage();

      doc.fontSize(14).font('Helvetica-Bold').text(`Project ${index + 1}: ${project.name}`);
      doc.moveDown();

      doc.fontSize(12).font('Helvetica-Bold').text('Description:');
      doc.font('Helvetica').text(project.description);
      doc.moveDown();

      doc.font('Helvetica-Bold').text('Business Component:');
      doc.font('Helvetica').text(project.businessComponent);
      doc.moveDown();

      doc.font('Helvetica-Bold').text('Technologies Used:');
      doc.font('Helvetica').text(project.technologiesUsed.join(', '));
      doc.moveDown();

      if (include4Part && project.narrativeImproved) {
        doc.font('Helvetica-Bold').text('Technical Narrative:');
        doc.font('Helvetica').text(project.narrativeImproved);
        doc.moveDown();
      }

      // 4-Part Test
      if (include4Part) {
        this.add4PartTest(doc, project);
      }
    });
  }

  private add4PartTest(doc: PDFKit.PDFDocument, project: any) {
    doc.fontSize(12).font('Helvetica-Bold').text('4-Part Test Analysis:');
    doc.moveDown(0.5);

    const sections = [
      { title: 'Permitted Purpose', data: project.permittedPurpose },
      { title: 'Elimination of Uncertainty', data: project.eliminationUncertainty },
      { title: 'Process of Experimentation', data: project.processExperimentation },
      { title: 'Technological in Nature', data: project.technologicalNature },
    ];

    sections.forEach((section) => {
      doc.font('Helvetica-Bold').text(section.title + ':');
      doc.font('Helvetica');

      if (section.data && typeof section.data === 'object') {
        Object.entries(section.data).forEach(([key, value]) => {
          doc.text(`  • ${value}`, { indent: 20 });
        });
      }

      doc.moveDown(0.5);
    });
  }

  private addQRESection(doc: PDFKit.PDFDocument, engagement: any, includeDetailed?: boolean) {
    doc.fontSize(18).font('Helvetica-Bold').text('Section 3: Qualified Research Expenses');
    doc.moveDown();

    // Wages Summary
    const totalWages = engagement.wages.reduce(
      (sum: number, w: any) => sum + Number(w.qualifiedWages),
      0
    );
    doc.fontSize(14).font('Helvetica-Bold').text('Wages:');
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Total Qualified Wages: $${totalWages.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    doc.text(`Number of Employees: ${engagement.wages.length}`);
    doc.moveDown();

    if (includeDetailed) {
      engagement.wages.forEach((wage: any) => {
        doc.text(
          `  ${wage.employeeName}: $${Number(wage.qualifiedWages).toLocaleString('en-US', { minimumFractionDigits: 2 })} (${Number(wage.percentTime)}% time)`
        );
      });
      doc.moveDown();
    }

    // Supplies Summary
    const totalSupplies = engagement.supplies.reduce(
      (sum: number, s: any) => sum + Number(s.qualifiedAmount),
      0
    );
    doc.fontSize(14).font('Helvetica-Bold').text('Supplies:');
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Total Qualified Supplies: $${totalSupplies.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    doc.moveDown();

    // Contract Research Summary
    const totalContracts = engagement.contracts.reduce(
      (sum: number, c: any) => sum + Number(c.qualifiedAmount),
      0
    );
    doc.fontSize(14).font('Helvetica-Bold').text('Contract Research:');
    doc
      .fontSize(12)
      .font('Helvetica')
      .text(`Total Qualified Contract Research: $${totalContracts.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    doc.moveDown();

    // Grand Total
    const grandTotal = totalWages + totalSupplies + totalContracts;
    doc.fontSize(14).font('Helvetica-Bold').text(`TOTAL QRE: $${grandTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
  }

  private addCalculationsSection(doc: PDFKit.PDFDocument, calculation: any) {
    doc.fontSize(18).font('Helvetica-Bold').text('Section 4: Credit Calculations');
    doc.moveDown();

    // Federal Regular Credit
    doc.fontSize(14).font('Helvetica-Bold').text('Federal Regular Credit:');
    doc.fontSize(12).font('Helvetica');
    doc.text(`Current Year QRE: $${Number(calculation.totalQRE).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    doc.text(`Base Amount: $${Number(calculation.regularBaseAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    doc.text(`Excess QRE: $${Number(calculation.regularExcessQRE).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    doc.text(`Credit (20%): $${Number(calculation.regularCreditAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    doc.moveDown();

    // Federal ASC
    doc.fontSize(14).font('Helvetica-Bold').text('Federal Alternative Simplified Credit:');
    doc.fontSize(12).font('Helvetica');
    doc.text(`Current Year QRE: $${Number(calculation.totalQRE).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    doc.text(`Base Amount: $${Number(calculation.ascBaseAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    doc.text(`Excess QRE: $${Number(calculation.ascExcessQRE).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    doc.text(`Credit (14%): $${Number(calculation.ascCreditAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}`);
    doc.moveDown();

    // State Credits
    if (calculation.stateCredits && Array.isArray(calculation.stateCredits)) {
      doc.fontSize(14).font('Helvetica-Bold').text('State Credits:');
      doc.fontSize(12).font('Helvetica');

      calculation.stateCredits.forEach((state: any) => {
        doc.text(
          `${state.stateName}: $${state.creditAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} (${(state.creditRate * 100).toFixed(2)}%)`
        );
      });
    }
  }

  private addSupportingDocumentation(doc: PDFKit.PDFDocument) {
    doc.fontSize(18).font('Helvetica-Bold').text('Section 5: Supporting Documentation');
    doc.moveDown();

    doc.fontSize(12).font('Helvetica');
    doc.text('This study is supported by the following documentation:');
    doc.moveDown(0.5);

    const supportingDocs = [
      'Project documentation and technical specifications',
      'Employee time tracking records',
      'Payroll records and wage calculations',
      'Supply and material purchase receipts',
      'Contract research agreements and invoices',
      'Engineering notes and design documents',
      'Test results and experimental data',
    ];

    supportingDocs.forEach((item) => {
      doc.text(`  • ${item}`, { indent: 20 });
    });

    doc.moveDown();
    doc.text(
      'All supporting documentation is available for review and has been maintained in accordance with IRS requirements.'
    );
  }
}
