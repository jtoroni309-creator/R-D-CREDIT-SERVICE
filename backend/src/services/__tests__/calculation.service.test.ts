import { CalculationService } from '../calculation.service';
import { prisma } from '../../index';

// Mock Prisma
jest.mock('../../index', () => ({
  prisma: {
    engagement: {
      findUnique: jest.fn(),
    },
    calculation: {
      create: jest.fn(),
      findFirst: jest.fn(),
    },
  },
}));

describe('CalculationService', () => {
  let service: CalculationService;

  beforeEach(() => {
    service = new CalculationService();
    jest.clearAllMocks();
  });

  describe('calculateCredits', () => {
    it('should calculate federal regular credit correctly', async () => {
      // Mock engagement data
      const mockEngagement = {
        id: 'test-engagement-id',
        taxpayerEIN: '12-3456789',
        taxYear: 2024,
        wages: [
          { qualifiedWages: 100000 },
          { qualifiedWages: 150000 },
        ],
        supplies: [
          { qualifiedAmount: 50000 },
        ],
        contracts: [
          { qualifiedAmount: 100000 },
        ],
        projects: [],
      };

      (prisma.engagement.findUnique as jest.Mock).mockResolvedValue(mockEngagement);
      (prisma.calculation.create as jest.Mock).mockResolvedValue({
        id: 'calc-id',
        totalQRE: 400000,
        regularCreditAmount: 50000,
      });

      const result = await service.calculateCredits('test-engagement-id', 'user-id');

      expect(result.totalWages).toBe(250000);
      expect(result.totalSupplies).toBe(50000);
      expect(result.totalContracts).toBe(100000);
      expect(result.totalQRE).toBe(400000);
      expect(result.regularCredit).toBeDefined();
      expect(result.ascCredit).toBeDefined();
    });

    it('should throw error if engagement not found', async () => {
      (prisma.engagement.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        service.calculateCredits('invalid-id', 'user-id')
      ).rejects.toThrow('Engagement not found');
    });
  });

  describe('getLatestCalculation', () => {
    it('should return latest calculation', async () => {
      const mockCalculation = {
        id: 'calc-id',
        totalQRE: 500000,
        regularCreditAmount: 75000,
        calculatedAt: new Date(),
      };

      (prisma.calculation.findFirst as jest.Mock).mockResolvedValue(mockCalculation);

      const result = await service.getLatestCalculation('engagement-id');

      expect(result).toEqual(mockCalculation);
      expect(prisma.calculation.findFirst).toHaveBeenCalledWith({
        where: { engagementId: 'engagement-id' },
        orderBy: { calculatedAt: 'desc' },
      });
    });
  });
});
