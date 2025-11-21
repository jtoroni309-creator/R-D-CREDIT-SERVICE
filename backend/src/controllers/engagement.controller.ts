import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { EngagementService } from '../services/engagement.service';
import { EngagementStatus } from '@prisma/client';

export class EngagementController {
  private service: EngagementService;

  constructor() {
    this.service = new EngagementService();
  }

  listEngagements = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { status, taxYear, search, page, limit } = req.query;

      const result = await this.service.listEngagements(
        req.user!.id,
        req.user!.role,
        {
          status: status as EngagementStatus,
          taxYear: taxYear ? parseInt(taxYear as string) : undefined,
          search: search as string,
          page: page ? parseInt(page as string) : undefined,
          limit: limit ? parseInt(limit as string) : undefined,
        }
      );

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  createEngagement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const accessToken = req.headers.authorization?.split(' ')[1];

      const engagement = await this.service.createEngagement(
        req.body,
        req.user!.id,
        accessToken
      );

      res.status(201).json(engagement);
    } catch (error) {
      next(error);
    }
  };

  getEngagement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const engagement = await this.service.getEngagement(
        id,
        req.user!.id,
        req.user!.role
      );

      res.json(engagement);
    } catch (error) {
      next(error);
    }
  };

  updateEngagement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const engagement = await this.service.updateEngagement(
        id,
        req.body,
        req.user!.id
      );

      res.json(engagement);
    } catch (error) {
      next(error);
    }
  };

  deleteEngagement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      await this.service.deleteEngagement(id, req.user!.id);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  getEngagementSummary = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const summary = await this.service.getEngagementSummary(id);

      res.json(summary);
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const engagement = await this.service.updateStatus(
        id,
        status,
        req.user!.id
      );

      res.json(engagement);
    } catch (error) {
      next(error);
    }
  };
}
