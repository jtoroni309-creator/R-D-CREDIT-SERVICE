import { PriorYearService } from '../prior-year.service';
import { prisma } from '../../index';

jest.mock('../../index', () => ({
  prisma: {
    engagement: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
    project: {
      create: jest.fn(),
    },
    wage: {
      create: jest.fn(),
    },
    auditLog: {
      create: jest.fn(),
    },
  },
}));

describe('PriorYearService', () => {
  let service: PriorYearService;

  beforeEach(() => {
    service = new PriorYearService();
    jest.clearAllMocks();
  });

  describe('getPriorYearEngagements', () => {
    it('should return prior year engagements', async () => {
      const mockEngagements = [
        {
          id: '1',
          taxpayerEIN: '12-3456789',
          taxYear: 2023,
          projects: [],
          calculations: [{ totalQRE: 500000 }],
        },
        {
          id: '2',
          taxpayerEIN: '12-3456789',
          taxYear: 2022,
          projects: [],
          calculations: [{ totalQRE: 450000 }],
        },
      ];

      (prisma.engagement.findMany as jest.Mock).mockResolvedValue(mockEngagements);

      const result = await service.getPriorYearEngagements('12-3456789', 2024);

      expect(result).toEqual(mockEngagements);
      expect(prisma.engagement.findMany).toHaveBeenCalledWith({
        where: {
          taxpayerEIN: '12-3456789',
          taxYear: { lt: 2024 },
        },
        include: expect.any(Object),
        orderBy: { taxYear: 'desc' },
        take: 5,
      });
    });
  });

  describe('createFromPriorYear', () => {
    it('should create new engagement from prior year', async () => {
      const mockPriorEngagement = {
        id: 'prior-id',
        taxpayerName: 'Acme Corp',
        taxpayerEIN: '12-3456789',
        taxpayerAddress: '123 Main St',
        taxYear: 2023,
        selectedStates: ['CA'],
        projects: [
          {
            id: 'project-1',
            name: 'Project Alpha',
            businessComponent: 'Component A',
            technologiesUsed: ['Python'],
            wages: [
              { employeeName: 'John Doe', annualSalary: 100000 },
            ],
          },
        ],
        wages: [],
      };

      const mockNewEngagement = {
        id: 'new-id',
        taxpayerName: 'Acme Corp',
        taxpayerEIN: '12-3456789',
        taxYear: 2024,
      };

      (prisma.engagement.findUnique as jest.Mock).mockResolvedValue(mockPriorEngagement);
      (prisma.engagement.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.engagement.create as jest.Mock).mockResolvedValue(mockNewEngagement);
      (prisma.project.create as jest.Mock).mockResolvedValue({});
      (prisma.wage.create as jest.Mock).mockResolvedValue({});
      (prisma.auditLog.create as jest.Mock).mockResolvedValue({});

      const result = await service.createFromPriorYear('prior-id', 2024, 'user-id');

      expect(result).toEqual(mockNewEngagement);
      expect(prisma.engagement.create).toHaveBeenCalled();
      expect(prisma.project.create).toHaveBeenCalled();
    });

    it('should throw error if engagement already exists', async () => {
      const mockPriorEngagement = {
        id: 'prior-id',
        taxpayerEIN: '12-3456789',
        taxYear: 2023,
      };

      (prisma.engagement.findUnique as jest.Mock).mockResolvedValue(mockPriorEngagement);
      (prisma.engagement.findFirst as jest.Mock).mockResolvedValue({ id: 'existing' });

      await expect(
        service.createFromPriorYear('prior-id', 2024, 'user-id')
      ).rejects.toThrow('Engagement for tax year 2024 already exists');
    });
  });

  describe('getYearOverYearComparison', () => {
    it('should calculate year-over-year trends', async () => {
      const mockEngagements = [
        {
          id: '1',
          taxYear: 2022,
          status: 'COMPLETED',
          projects: [],
          calculations: [
            {
              totalQRE: 400000,
              totalWages: 300000,
              regularCreditAmount: 60000,
            },
          ],
        },
        {
          id: '2',
          taxYear: 2023,
          status: 'COMPLETED',
          projects: [],
          calculations: [
            {
              totalQRE: 450000,
              totalWages: 350000,
              regularCreditAmount: 67500,
            },
          ],
        },
      ];

      (prisma.engagement.findMany as jest.Mock).mockResolvedValue(mockEngagements);

      const result = await service.getYearOverYearComparison('12-3456789', [2022, 2023]);

      expect(result.comparison).toHaveLength(2);
      expect(result.trends).toBeDefined();
      expect(result.trends?.qreGrowth).toBeDefined();
      expect(result.trends?.creditGrowth).toBeDefined();
    });
  });
});
