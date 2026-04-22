import {
  getTechnicianDashboard,
  getTechnicianEarnings,
  getTechnicianProfile,
  updateTechnicianProfile,
} from '../../technician.service';
import prisma from '../../../config/database';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    order: {
      count: jest.fn(),
      aggregate: jest.fn(),
      findMany: jest.fn(),
    },
    kYC: {
      findUnique: jest.fn(),
    },
    review: {
      aggregate: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    profile: {
      upsert: jest.fn(),
    },
  },
}));

type MockDb = {
  order: {
    count: jest.Mock;
    aggregate: jest.Mock;
    findMany: jest.Mock;
  };
  kYC: {
    findUnique: jest.Mock;
  };
  review: {
    aggregate: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
  };
  profile: {
    upsert: jest.Mock;
  };
};

const mockedPrisma = prisma as unknown as MockDb;

describe('technician profile management logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject invalid technician profile update', async () => {
    await expect(updateTechnicianProfile('technician-1', {})).rejects.toThrow(
      'At least one profile field is required'
    );

    expect(mockedPrisma.profile.upsert).not.toHaveBeenCalled();
  });

  it('should allow valid technician profile update', async () => {
    const payload = {
      name: 'Sita Technician',
      phone: '9800000000',
      address: 'Lalitpur',
      avatar: 'https://img.example/tech-avatar.png',
    };

    const updatedProfile = {
      id: 'profile-tech-1',
      userId: 'technician-1',
      ...payload,
    };

    mockedPrisma.profile.upsert.mockResolvedValue(updatedProfile);

    const result = await updateTechnicianProfile('technician-1', payload);

    expect(mockedPrisma.profile.upsert).toHaveBeenCalledWith({
      where: { userId: 'technician-1' },
      update: payload,
      create: {
        userId: 'technician-1',
        ...payload,
      },
    });

    expect(result).toEqual(updatedProfile);
  });

  it('should return null profile when technician is not found', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    const result = await getTechnicianProfile('missing-tech');

    expect(result).toBeNull();
    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'missing-tech' },
      })
    );
  });

  it('should strip password from technician profile payload', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'tech-12',
      email: 'tech12@example.com',
      password: 'secret-hash',
      profile: { name: 'Tech Twelve' },
      kyc: { status: 'APPROVED' },
      _count: { technicianOrders: 10, createdServices: 3 },
    });

    const result = await getTechnicianProfile('tech-12');

    expect(result).toEqual(
      expect.objectContaining({
        id: 'tech-12',
        email: 'tech12@example.com',
      })
    );
    expect((result as any).password).toBeUndefined();
  });

  it('should build dashboard stats and monthly chart for technician', async () => {
    mockedPrisma.order.count
      .mockResolvedValueOnce(20)
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(3)
      .mockResolvedValueOnce(10);

    mockedPrisma.order.aggregate
      .mockResolvedValueOnce({ _sum: { technicianAmount: 40000 } })
      .mockResolvedValueOnce({ _sum: { technicianAmount: 5000 } });

    mockedPrisma.order.findMany
      .mockResolvedValueOnce([{ id: 'order-1' }])
      .mockResolvedValueOnce([
        { technicianAmount: 2500, completedAt: new Date() },
        { technicianAmount: 1800, completedAt: new Date() },
      ])
      .mockResolvedValueOnce([
        { completedAt: new Date() },
        { completedAt: new Date() },
      ]);

    mockedPrisma.kYC.findUnique.mockResolvedValue({ status: 'APPROVED' });
    mockedPrisma.review.aggregate.mockResolvedValue({
      _avg: { rating: 4.34 },
      _count: { rating: 18 },
    });

    const result = await getTechnicianDashboard('tech-20');

    expect(result.stats.totalOrders).toBe(20);
    expect(result.stats.pendingOrders).toBe(4);
    expect(result.stats.activeOrders).toBe(3);
    expect(result.stats.completedOrders).toBe(10);
    expect(result.stats.totalEarnings).toBe(40000);
    expect(result.stats.thisMonthEarnings).toBe(5000);
    expect(result.stats.averageRating).toBe(4.3);
    expect(result.stats.totalReviews).toBe(18);
    expect(result.stats.kycStatus).toBe('APPROVED');
    expect(result.monthlyData).toHaveLength(6);
  });

  it('should return earnings summary with 12-month chart', async () => {
    mockedPrisma.order.aggregate
      .mockResolvedValueOnce({ _sum: { technicianAmount: 70000 }, _count: 30 })
      .mockResolvedValueOnce({ _sum: { technicianAmount: 8000 }, _count: 4 })
      .mockResolvedValueOnce({ _sum: { technicianAmount: 52000 }, _count: 22 })
      .mockResolvedValueOnce({ _sum: { technicianAmount: 18000 }, _count: 8 });

    mockedPrisma.order.findMany
      .mockResolvedValueOnce([
        { technicianAmount: 2000, completedAt: new Date(), paymentStatus: 'PAID' },
        { technicianAmount: 1500, completedAt: new Date(), paymentStatus: 'PENDING' },
      ])
      .mockResolvedValueOnce([
        {
          id: 'order-e-1',
          totalAmount: 3000,
          technicianAmount: 2400,
          completedAt: new Date(),
          paymentStatus: 'PAID',
          service: { name: 'Plumbing' },
          customer: { profile: { name: 'Customer A' } },
        },
      ]);

    const result = await getTechnicianEarnings('tech-22');

    expect(result.totalEarnings).toBe(70000);
    expect(result.thisMonthEarnings).toBe(8000);
    expect(result.completedPayments).toBe(52000);
    expect(result.pendingPayments).toBe(18000);
    expect(result.monthlyChart).toHaveLength(12);
    expect(result.recentPayments).toHaveLength(1);
  });

  it('should reject too-short technician name', async () => {
    await expect(
      updateTechnicianProfile('technician-1', { name: 'A' })
    ).rejects.toThrow('Name must be at least 2 characters');

    expect(mockedPrisma.profile.upsert).not.toHaveBeenCalled();
  });

  it('should reject invalid technician phone format', async () => {
    await expect(
      updateTechnicianProfile('technician-1', { phone: '98000abc' })
    ).rejects.toThrow('Phone number must be exactly 10 digits');

    expect(mockedPrisma.profile.upsert).not.toHaveBeenCalled();
  });
});
