import { KYCStatus, OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import prisma from '../../../config/database';
import {
  getPlatformStats,
  getRevenueAnalytics,
  getOrderAnalytics,
  getTechnicianPerformanceAnalytics,
} from '../../admin.stats.service';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      count: jest.fn(),
      findMany: jest.fn(),
    },
    order: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
      groupBy: jest.fn(),
    },
    service: {
      count: jest.fn(),
      findUnique: jest.fn(),
    },
    category: {
      count: jest.fn(),
    },
    kYC: {
      count: jest.fn(),
    },
    payment: {
      count: jest.fn(),
    },
    profile: {
      findUnique: jest.fn(),
    },
  },
}));

type MockDb = {
  user: {
    count: jest.Mock;
    findMany: jest.Mock;
  };
  order: {
    count: jest.Mock;
    aggregate: jest.Mock;
    findMany: jest.Mock;
    groupBy: jest.Mock;
  };
  service: {
    count: jest.Mock;
    findUnique: jest.Mock;
  };
  category: {
    count: jest.Mock;
  };
  kYC: {
    count: jest.Mock;
  };
  payment: {
    count: jest.Mock;
  };
  profile: {
    findUnique: jest.Mock;
  };
};

const mockedPrisma = prisma as unknown as MockDb;

describe('admin.stats.service core analytics', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return platform stats with derived payment success rate', async () => {
    mockedPrisma.user.count
      .mockResolvedValueOnce(100)
      .mockResolvedValueOnce(60)
      .mockResolvedValueOnce(35)
      .mockResolvedValueOnce(5)
      .mockResolvedValueOnce(90);

    mockedPrisma.order.count
      .mockResolvedValueOnce(80)
      .mockResolvedValueOnce(12)
      .mockResolvedValueOnce(50);

    mockedPrisma.order.aggregate
      .mockResolvedValueOnce({ _sum: { totalAmount: 250000 } })
      .mockResolvedValueOnce({ _sum: { platformAmount: 50000 } })
      .mockResolvedValueOnce({ _sum: { technicianAmount: 200000 } });

    mockedPrisma.service.count.mockResolvedValueOnce(45).mockResolvedValueOnce(40);
    mockedPrisma.category.count.mockResolvedValue(8);
    mockedPrisma.kYC.count.mockResolvedValueOnce(7).mockResolvedValueOnce(28);
    mockedPrisma.payment.count.mockResolvedValueOnce(70).mockResolvedValueOnce(63);

    const result = await getPlatformStats();

    expect(result.users.total).toBe(100);
    expect(result.orders.completed).toBe(50);
    expect(result.revenue.total).toBe(250000);
    expect(result.revenue.platform).toBe(50000);
    expect(result.payments.total).toBe(70);
    expect(result.payments.successful).toBe(63);
    expect(result.payments.successRate).toBe(90);
  });

  it('should return revenue analytics with daily aggregation and summary values', async () => {
    mockedPrisma.order.aggregate
      .mockResolvedValueOnce({ _sum: { totalAmount: 300000 }, _count: 6 })
      .mockResolvedValueOnce({ _sum: { platformAmount: 60000 } })
      .mockResolvedValueOnce({ _sum: { technicianAmount: 240000 } });

    mockedPrisma.order.findMany.mockResolvedValue([
      {
        totalAmount: 50000,
        platformAmount: 10000,
        technicianAmount: 40000,
        createdAt: new Date('2026-04-10T10:00:00.000Z'),
      },
      {
        totalAmount: 40000,
        platformAmount: 8000,
        technicianAmount: 32000,
        createdAt: new Date('2026-04-10T12:00:00.000Z'),
      },
      {
        totalAmount: 30000,
        platformAmount: 6000,
        technicianAmount: 24000,
        createdAt: new Date('2026-04-09T09:00:00.000Z'),
      },
    ]);

    const result = await getRevenueAnalytics();

    expect(result.summary.totalRevenue).toBe(300000);
    expect(result.summary.platformRevenue).toBe(60000);
    expect(result.summary.technicianEarnings).toBe(240000);
    expect(result.summary.totalOrders).toBe(6);
    expect(result.summary.averageOrderValue).toBe(50000);
    expect(result.dailyRevenue.length).toBeGreaterThan(0);
    expect(result.dailyRevenue[0]).toEqual(
      expect.objectContaining({
        date: expect.any(String),
        revenue: expect.any(Number),
        orders: expect.any(Number),
      })
    );
  });

  it('should return grouped order analytics with category mapping', async () => {
    mockedPrisma.order.count.mockResolvedValue(25);
    mockedPrisma.order.groupBy
      .mockResolvedValueOnce([
        { status: OrderStatus.PENDING, _count: 5 },
        { status: OrderStatus.COMPLETED, _count: 20 },
      ])
      .mockResolvedValueOnce([
        { paymentStatus: PaymentStatus.PENDING, _count: 4 },
        { paymentStatus: PaymentStatus.PAID, _count: 21 },
      ])
      .mockResolvedValueOnce([
        { serviceId: 'service-1', _count: 10 },
        { serviceId: 'service-2', _count: 15 },
      ]);

    mockedPrisma.service.findUnique
      .mockResolvedValueOnce({ categoryId: 'cat-1', category: { name: 'Electrical' } })
      .mockResolvedValueOnce({ categoryId: 'cat-2', category: { name: 'Plumbing' } });

    const result = await getOrderAnalytics();

    expect(result.totalOrders).toBe(25);
    expect(result.statusDistribution).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ status: OrderStatus.PENDING, count: 5 }),
        expect.objectContaining({ status: OrderStatus.COMPLETED, count: 20 }),
      ])
    );
    expect(result.ordersByCategory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ categoryName: 'Electrical', count: 10 }),
        expect.objectContaining({ categoryName: 'Plumbing', count: 15 }),
      ])
    );
  });

  it('should return technician performance sorted by earnings descending', async () => {
    mockedPrisma.user.findMany.mockResolvedValue([
      {
        id: 'tech-1',
        email: 'tech1@example.com',
        technicianOrders: [
          { technicianAmount: 2000, status: OrderStatus.COMPLETED, completedAt: new Date() },
          { technicianAmount: 1000, status: OrderStatus.COMPLETED_BY_TECHNICIAN, completedAt: new Date() },
        ],
        _count: { technicianOrders: 2 },
      },
      {
        id: 'tech-2',
        email: 'tech2@example.com',
        technicianOrders: [
          { technicianAmount: 4000, status: OrderStatus.COMPLETED, completedAt: new Date() },
        ],
        _count: { technicianOrders: 1 },
      },
    ]);

    mockedPrisma.profile.findUnique
      .mockResolvedValueOnce({ name: 'Tech One' })
      .mockResolvedValueOnce({ name: 'Tech Two' });

    const result = await getTechnicianPerformanceAnalytics();

    expect(result[0].technicianId).toBe('tech-2');
    expect(result[0].totalEarnings).toBe(4000);
    expect(result[1].technicianId).toBe('tech-1');
    expect(result[1].totalEarnings).toBe(2000);
  });
});
