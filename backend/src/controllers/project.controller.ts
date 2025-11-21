import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../index';
import { LLMService } from '../services/llm.service';
import { AppError } from '../middleware/errorHandler';

export class ProjectController {
  private llmService: LLMService;

  constructor() {
    this.llmService = new LLMService();
  }

  listProjects = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { engagementId } = req.params;

      const projects = await prisma.project.findMany({
        where: { engagementId },
        include: {
          wages: true,
          supplies: true,
          contracts: true,
        },
        orderBy: { createdAt: 'asc' },
      });

      res.json(projects);
    } catch (error) {
      next(error);
    }
  };

  createProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { engagementId } = req.params;

      const project = await prisma.project.create({
        data: {
          ...req.body,
          engagementId,
          createdById: req.user!.id,
        },
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          engagementId,
          action: 'CREATE',
          entityType: 'Project',
          entityId: project.id,
          changes: req.body,
        },
      });

      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  };

  getProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          engagement: true,
          wages: true,
          supplies: true,
          contracts: true,
        },
      });

      if (!project) {
        throw new AppError('Project not found', 404);
      }

      res.json(project);
    } catch (error) {
      next(error);
    }
  };

  updateProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const project = await prisma.project.update({
        where: { id },
        data: req.body,
      });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          engagementId: project.engagementId,
          action: 'UPDATE',
          entityType: 'Project',
          entityId: id,
          changes: req.body,
        },
      });

      res.json(project);
    } catch (error) {
      next(error);
    }
  };

  deleteProject = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project) {
        throw new AppError('Project not found', 404);
      }

      await prisma.project.delete({ where: { id } });

      // Log audit
      await prisma.auditLog.create({
        data: {
          userId: req.user!.id,
          engagementId: project.engagementId,
          action: 'DELETE',
          entityType: 'Project',
          entityId: id,
        },
      });

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  validate4PartTest = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const project = await prisma.project.findUnique({ where: { id } });
      if (!project) {
        throw new AppError('Project not found', 404);
      }

      const responses = {
        permittedPurpose: project.permittedPurpose,
        eliminationUncertainty: project.eliminationUncertainty,
        processExperimentation: project.processExperimentation,
        technologicalNature: project.technologicalNature,
      };

      const validation = await this.llmService.validate4PartTest(responses);

      res.json(validation);
    } catch (error) {
      next(error);
    }
  };
}
