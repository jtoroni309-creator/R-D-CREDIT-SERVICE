import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { PriorYearService } from '../services/prior-year.service';

export class PriorYearController {
  private service: PriorYearService;

  constructor() {
    this.service = new PriorYearService();
  }

  /**
   * Get prior year engagements for a taxpayer
   */
  getPriorYears = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { ein, year } = req.query;

      if (!ein || !year) {
        return res.status(400).json({ error: 'EIN and year are required' });
      }

      const priorEngagements = await this.service.getPriorYearEngagements(
        ein as string,
        parseInt(year as string)
      );

      res.json(priorEngagements);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Create new engagement from prior year
   */
  createFromPriorYear = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { priorEngagementId, newYear } = req.body;

      if (!priorEngagementId || !newYear) {
        return res
          .status(400)
          .json({ error: 'Prior engagement ID and new year are required' });
      }

      const newEngagement = await this.service.createFromPriorYear(
        priorEngagementId,
        newYear,
        req.user!.id
      );

      res.status(201).json(newEngagement);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Copy selective data from prior year
   */
  copyDataSelectively = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { sourceEngagementId, targetEngagementId, options } = req.body;

      const result = await this.service.copyDataSelectively(
        sourceEngagementId,
        targetEngagementId,
        options,
        req.user!.id
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get year-over-year comparison
   */
  getComparison = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { ein } = req.params;
      const { years } = req.query;

      if (!years) {
        return res.status(400).json({ error: 'Years parameter is required' });
      }

      const yearsList = (years as string).split(',').map((y) => parseInt(y));

      const comparison = await this.service.getYearOverYearComparison(
        ein,
        yearsList
      );

      res.json(comparison);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get prefill data from prior year
   */
  getPrefillData = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const { id } = req.params;

      const prefillData = await this.service.getPrefillData(id);

      res.json(prefillData);
    } catch (error) {
      next(error);
    }
  };
}
