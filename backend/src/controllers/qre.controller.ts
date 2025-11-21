import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middleware/auth';
import { prisma } from '../index';
import { AppError } from '../middleware/errorHandler';

export class QREController {
  // WAGES
  listWages = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { engagementId } = req.params;

      const wages = await prisma.wage.findMany({
        where: { engagementId },
        include: { project: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      });

      res.json(wages);
    } catch (error) {
      next(error);
    }
  };

  createWage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { engagementId } = req.params;

      const wage = await prisma.wage.create({
        data: {
          ...req.body,
          engagementId,
        },
      });

      await this.logAudit(req.user!.id, 'CREATE', 'Wage', wage.id, engagementId);

      res.status(201).json(wage);
    } catch (error) {
      next(error);
    }
  };

  updateWage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const wage = await prisma.wage.update({
        where: { id },
        data: req.body,
      });

      await this.logAudit(req.user!.id, 'UPDATE', 'Wage', id, wage.engagementId);

      res.json(wage);
    } catch (error) {
      next(error);
    }
  };

  deleteWage = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const wage = await prisma.wage.findUnique({ where: { id } });
      if (!wage) throw new AppError('Wage not found', 404);

      await prisma.wage.delete({ where: { id } });

      await this.logAudit(req.user!.id, 'DELETE', 'Wage', id, wage.engagementId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  // SUPPLIES
  listSupplies = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { engagementId } = req.params;

      const supplies = await prisma.supply.findMany({
        where: { engagementId },
        include: { project: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      });

      res.json(supplies);
    } catch (error) {
      next(error);
    }
  };

  createSupply = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { engagementId } = req.params;

      const supply = await prisma.supply.create({
        data: {
          ...req.body,
          engagementId,
        },
      });

      await this.logAudit(req.user!.id, 'CREATE', 'Supply', supply.id, engagementId);

      res.status(201).json(supply);
    } catch (error) {
      next(error);
    }
  };

  updateSupply = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const supply = await prisma.supply.update({
        where: { id },
        data: req.body,
      });

      await this.logAudit(req.user!.id, 'UPDATE', 'Supply', id, supply.engagementId);

      res.json(supply);
    } catch (error) {
      next(error);
    }
  };

  deleteSupply = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const supply = await prisma.supply.findUnique({ where: { id } });
      if (!supply) throw new AppError('Supply not found', 404);

      await prisma.supply.delete({ where: { id } });

      await this.logAudit(req.user!.id, 'DELETE', 'Supply', id, supply.engagementId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  // CONTRACTS
  listContracts = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { engagementId } = req.params;

      const contracts = await prisma.contractResearch.findMany({
        where: { engagementId },
        include: { project: { select: { id: true, name: true } } },
        orderBy: { createdAt: 'asc' },
      });

      res.json(contracts);
    } catch (error) {
      next(error);
    }
  };

  createContract = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { engagementId } = req.params;

      const contract = await prisma.contractResearch.create({
        data: {
          ...req.body,
          engagementId,
        },
      });

      await this.logAudit(req.user!.id, 'CREATE', 'ContractResearch', contract.id, engagementId);

      res.status(201).json(contract);
    } catch (error) {
      next(error);
    }
  };

  updateContract = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const contract = await prisma.contractResearch.update({
        where: { id },
        data: req.body,
      });

      await this.logAudit(req.user!.id, 'UPDATE', 'ContractResearch', id, contract.engagementId);

      res.json(contract);
    } catch (error) {
      next(error);
    }
  };

  deleteContract = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const contract = await prisma.contractResearch.findUnique({ where: { id } });
      if (!contract) throw new AppError('Contract not found', 404);

      await prisma.contractResearch.delete({ where: { id } });

      await this.logAudit(req.user!.id, 'DELETE', 'ContractResearch', id, contract.engagementId);

      res.status(204).send();
    } catch (error) {
      next(error);
    }
  };

  private async logAudit(
    userId: string,
    action: string,
    entityType: string,
    entityId: string,
    engagementId: string
  ) {
    await prisma.auditLog.create({
      data: {
        userId,
        engagementId,
        action,
        entityType,
        entityId,
      },
    });
  }
}
