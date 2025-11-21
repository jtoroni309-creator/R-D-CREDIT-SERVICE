import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { LLMService } from '../services/llm.service';

export class LLMController {
  private service: LLMService;

  constructor() {
    this.service = new LLMService();
  }

  improveNarrative = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { text } = req.body;

      const result = await this.service.improveNarrative(text);

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  expandTechnical = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { text } = req.body;

      const result = await this.service.expandTechnicalDetails(text);

      res.json({ expanded: result });
    } catch (error) {
      next(error);
    }
  };

  suggestMissing = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { projectData } = req.body;

      const result = await this.service.suggestMissingInfo(projectData);

      res.json(result);
    } catch (error) {
      next(error);
    }
  };
}
