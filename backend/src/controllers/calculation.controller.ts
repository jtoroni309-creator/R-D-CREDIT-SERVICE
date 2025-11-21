import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { CalculationService } from '../services/calculation.service';

export class CalculationController {
  private service: CalculationService;

  constructor() {
    this.service = new CalculationService();
  }

  calculate = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { engagementId } = req.params;

      const result = await this.service.calculateCredits(engagementId, req.user!.id);

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  getLatest = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { engagementId } = req.params;

      const calculation = await this.service.getLatestCalculation(engagementId);

      res.json(calculation);
    } catch (error) {
      next(error);
    }
  };
}
