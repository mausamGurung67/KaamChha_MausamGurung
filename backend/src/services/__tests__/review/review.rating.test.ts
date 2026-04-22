import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import prisma from '../../../config/database';
import { createReview } from '../../review.service';
import { createReviewSchema } from '../../../validators/review.validator';

const ioToEmit = jest.fn();

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    order: {
      findUnique: jest.fn(),
    },
    review: {
      create: jest.fn(),
      aggregate: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../../socket', () => ({
  __esModule: true,
  getIO: jest.fn(() => ({
    to: jest.fn(() => ({ emit: ioToEmit })),
  })),
}));

jest.mock('../../notification.service', () => ({
  notifyReviewSubmitted: jest.fn().mockResolvedValue(undefined),
}));

type MockDb = {
  order: {
    findUnique: jest.Mock;
  };
  review: {
    create: jest.Mock;
    aggregate: jest.Mock;
  };
  user: {
    findMany: jest.Mock;
  };
};

const mockedPrisma = prisma as unknown as MockDb;

describe('review and rating logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate empty review payload', () => {
    const parsed = createReviewSchema.safeParse({ body: {} });

    expect(parsed.success).toBe(false);
  });

  it('should validate rating range (1-5)', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      customerId: 'customer-1',
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      review: null,
      technicianId: 'tech-1',
      serviceId: 'service-1',
      service: { id: 'service-1', name: 'Cleaning' },
      customer: {
        id: 'customer-1',
        email: 'c1@example.com',
        profile: { name: 'Customer One', avatar: null },
      },
      technician: {
        id: 'tech-1',
        email: 't1@example.com',
        profile: { name: 'Tech One', avatar: null },
      },
    });

    await expect(
      createReview({
        orderId: 'order-1',
        customerId: 'customer-1',
        rating: 0,
        comment: 'Good service',
      })
    ).rejects.toThrow('Rating must be between 1 and 5');

    expect(mockedPrisma.review.create).not.toHaveBeenCalled();
  });

  it('should reject review when payment is not completed', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order-pay-1',
      customerId: 'customer-pay-1',
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PENDING,
      review: null,
      technicianId: 'tech-pay-1',
      serviceId: 'service-pay-1',
      service: { id: 'service-pay-1', name: 'Cleaning' },
      customer: {
        id: 'customer-pay-1',
        email: 'cp1@example.com',
        profile: { name: 'CP1', avatar: null },
      },
      technician: {
        id: 'tech-pay-1',
        email: 'tp1@example.com',
        profile: { name: 'TP1', avatar: null },
      },
    });

    await expect(
      createReview({
        orderId: 'order-pay-1',
        customerId: 'customer-pay-1',
        rating: 4,
        comment: 'Good service',
      })
    ).rejects.toThrow('Payment must be completed before leaving a review');

    expect(mockedPrisma.review.create).not.toHaveBeenCalled();
  });

  it('should reject review from customer who does not own the order', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order-auth-1',
      customerId: 'real-customer',
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      review: null,
      technicianId: 'tech-auth-1',
      serviceId: 'service-auth-1',
      service: { id: 'service-auth-1', name: 'Electrical' },
      customer: {
        id: 'real-customer',
        email: 'real@example.com',
        profile: { name: 'Real Customer', avatar: null },
      },
      technician: {
        id: 'tech-auth-1',
        email: 'tech@example.com',
        profile: { name: 'Tech Auth', avatar: null },
      },
    });

    await expect(
      createReview({
        orderId: 'order-auth-1',
        customerId: 'intruder-customer',
        rating: 5,
      })
    ).rejects.toThrow('Unauthorized: you do not own this order');

    expect(mockedPrisma.review.create).not.toHaveBeenCalled();
  });

  it('should submit valid review successfully', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order-2',
      customerId: 'customer-2',
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      review: null,
      technicianId: 'tech-2',
      serviceId: 'service-2',
      service: { id: 'service-2', name: 'Plumbing' },
      customer: {
        id: 'customer-2',
        email: 'c2@example.com',
        profile: { name: 'Customer Two', avatar: null },
      },
      technician: {
        id: 'tech-2',
        email: 't2@example.com',
        profile: { name: 'Tech Two', avatar: null },
      },
    });

    mockedPrisma.review.create.mockResolvedValue({
      id: 'review-2',
      orderId: 'order-2',
      rating: 5,
      comment: 'Excellent and quick fix',
      createdAt: new Date('2026-04-04T10:00:00.000Z'),
      customer: {
        id: 'customer-2',
        email: 'c2@example.com',
        profile: { name: 'Customer Two', avatar: null },
      },
      service: { id: 'service-2', name: 'Plumbing' },
      order: {
        id: 'order-2',
        totalAmount: 1800,
        completedAt: new Date('2026-04-04T09:00:00.000Z'),
      },
    });

    mockedPrisma.review.aggregate.mockResolvedValue({
      _avg: { rating: 4.6 },
      _count: { rating: 12 },
    });
    mockedPrisma.user.findMany.mockResolvedValue([{ id: 'admin-1' }]);

    const result = await createReview({
      orderId: 'order-2',
      customerId: 'customer-2',
      rating: 5,
      comment: '  Excellent and quick fix  ',
    });

    expect(mockedPrisma.review.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          orderId: 'order-2',
          customerId: 'customer-2',
          technicianId: 'tech-2',
          serviceId: 'service-2',
          rating: 5,
          comment: 'Excellent and quick fix',
          isApproved: true,
        }),
      })
    );
    expect(result.averageRating).toBe(4.6);
    expect(result.totalReviews).toBe(12);
    expect(ioToEmit).toHaveBeenCalled();
  });

  it('should prevent duplicate reviews for same order', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order-3',
      customerId: 'customer-3',
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      review: { id: 'review-existing' },
      technicianId: 'tech-3',
      serviceId: 'service-3',
      service: { id: 'service-3', name: 'Electrical' },
      customer: {
        id: 'customer-3',
        email: 'c3@example.com',
        profile: { name: 'Customer Three', avatar: null },
      },
      technician: {
        id: 'tech-3',
        email: 't3@example.com',
        profile: { name: 'Tech Three', avatar: null },
      },
    });

    await expect(
      createReview({
        orderId: 'order-3',
        customerId: 'customer-3',
        rating: 4,
        comment: 'Good work',
      })
    ).rejects.toThrow('You have already reviewed this order');

    expect(mockedPrisma.review.create).not.toHaveBeenCalled();
  });
});