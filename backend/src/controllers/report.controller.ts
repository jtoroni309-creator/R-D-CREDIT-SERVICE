import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PDFService } from '../services/pdf.service';
import { Form6765Service } from '../services/form6765.service';
import { ShareFileService } from '../services/sharefile.service';
import { prisma } from '../index';

export class ReportController {
  private pdfService: PDFService;
  private form6765Service: Form6765Service;
  private shareFileService: ShareFileService;

  constructor() {
    this.pdfService = new PDFService();
    this.form6765Service = new Form6765Service();
    this.shareFileService = new ShareFileService();
  }

  generatePDF = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { engagementId } = req.params;
      const options = req.body;

      const pdfBuffer = await this.pdfService.generateStudyPDF(engagementId, options);

      // Upload to ShareFile
      const engagement = await prisma.engagement.findUnique({
        where: { id: engagementId },
      });

      if (engagement) {
        const accessToken = req.headers.authorization?.split(' ')[1];
        if (accessToken) {
          const fileName = `RD_Study_${engagement.taxpayerName}_${engagement.taxYear}.pdf`;
          await this.shareFileService.uploadFile(
            accessToken,
            engagement.shareFileFolderId,
            fileName,
            pdfBuffer
          );
        }
      }

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="RD_Study_${engagement?.taxYear}.pdf"`
      );
      res.send(pdfBuffer);
    } catch (error) {
      next(error);
    }
  };

  exportForm6765JSON = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { engagementId } = req.params;

      const json = await this.form6765Service.exportJSON(engagementId);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="Form6765.json"');
      res.send(json);
    } catch (error) {
      next(error);
    }
  };

  exportForm6765CSV = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { engagementId } = req.params;

      const csv = await this.form6765Service.exportCSV(engagementId);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="Form6765.csv"');
      res.send(csv);
    } catch (error) {
      next(error);
    }
  };

  exportForm6765Excel = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { engagementId } = req.params;

      const excelBuffer = await this.form6765Service.exportExcel(engagementId);

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader('Content-Disposition', 'attachment; filename="Form6765.xlsx"');
      res.send(excelBuffer);
    } catch (error) {
      next(error);
    }
  };
}
