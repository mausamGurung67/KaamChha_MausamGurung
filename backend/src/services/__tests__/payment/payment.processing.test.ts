import { OrderStatus, PaymentStatus } from '@prisma/client';

const mockKhaltiPost = jest.fn();

jest.mock('axios', () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({
      post: mockKhaltiPost,
    })),
  },
}));

jest.mock('../../../config/env', () => ({
  __esModule: true,
  default: {
    KHALTI_GATEWAY_URL: 'https://khalti.test',
    KHALTI_SECRET_KEY: 'test-secret',
    KHALTI_WEBSITE_URL: 'https://app.test',
    FRONTEND_URL: 'https://app.test',
    ESEWA_SECRET_KEY: 'esewa-secret',
    ESEWA_MERCHANT_ID: 'EPAYTEST',
    ESEWA_GATEWAY_URL: 'https://esewa.test',
  },
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    order: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    payment: {
      create: jest.fn(),
      updateMany: jest.fn(),
    },
    bookingHistory: {
      create: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}));

jest.mock('../../../socket', () => ({
  __esModule: true,
  getIO: jest.fn(() => ({
    to: jest.fn(() => ({ emit: jest.fn() })),
  })),
}));

jest.mock('../../../services/notification.service', () => ({
  notifyPaymentSuccess: jest.fn().mockResolvedValue(undefined),
}));

import prisma from '../../../config/database';
import {
  initiateKhaltiPayment,
  verifyKhaltiPayment,
} from '../../payment.service';

type MockDb = {
  order: {
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  payment: {
    create: jest.Mock;
    updateMany: jest.Mock;
  };
  bookingHistory: {
    create: jest.Mock;
  };
  user: {
    findMany: jest.Mock;
  };
};

const mockedPrisma = prisma as unknown as MockDb;

describe('payment processing logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockKhaltiPost.mockReset();
  });

  it('should validate payment request when order is not completed', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order-1',
      customerId: 'customer-1',
      status: OrderStatus.IN_PROGRESS,
      paymentStatus: PaymentStatus.PENDING,
      totalAmount: 1500,
      service: { name: 'Plumbing' },
      customer: {
        id: 'customer-1',
        email: 'customer@example.com',
        profile: { name: 'Customer', phone: '9800000000' },
      },
    });

    await expect(
      initiateKhaltiPayment({ orderId: 'order-1', customerId: 'customer-1' })
    ).rejects.toThrow('Order must be in COMPLETED status to make payment. Current status: IN_PROGRESS');

    expect(mockKhaltiPost).not.toHaveBeenCalled();
    expect(mockedPrisma.payment.create).not.toHaveBeenCalled();
  });

  it('should block payment initiation when customer does not own the order', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order-own-1',
      customerId: 'real-customer',
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PENDING,
      totalAmount: 1200,
      service: { name: 'Carpentry' },
      customer: {
        id: 'real-customer',
        email: 'real@example.com',
        profile: { name: 'Real Customer', phone: '9800000000' },
      },
    });

    await expect(
      initiateKhaltiPayment({ orderId: 'order-own-1', customerId: 'intruder-customer' })
    ).rejects.toThrow('Unauthorized: you do not own this order');

    expect(mockKhaltiPost).not.toHaveBeenCalled();
    expect(mockedPrisma.payment.create).not.toHaveBeenCalled();
  });

  it('should handle successful payment verification', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order-2',
      customerId: 'customer-2',
      technicianId: 'tech-2',
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PENDING,
      totalAmount: 1500,
      service: { name: 'Electrical', category: { id: 'cat-1', name: 'Home' } },
      customer: {
        id: 'customer-2',
        email: 'c2@example.com',
        profile: { name: 'C2', phone: '9800000001' },
      },
      technician: {
        id: 'tech-2',
        email: 't2@example.com',
        profile: { name: 'T2', phone: '9800000002', avatar: null },
      },
    });

    mockKhaltiPost.mockResolvedValue({
      data: {
        pidx: 'pidx-2',
        total_amount: 150000,
        status: 'Completed',
        transaction_id: 'txn-2',
        fee: 30,
        refunded: false,
      },
    });

    mockedPrisma.payment.updateMany.mockResolvedValue({ count: 1 });
    mockedPrisma.order.update.mockResolvedValue({
      id: 'order-2',
      customerId: 'customer-2',
      technicianId: 'tech-2',
      totalAmount: 1500,
      paymentStatus: PaymentStatus.PAID,
      service: { name: 'Electrical', category: { id: 'cat-1', name: 'Home' } },
      customer: {
        id: 'customer-2',
        email: 'c2@example.com',
        profile: { name: 'C2', phone: '9800000001' },
      },
      technician: {
        id: 'tech-2',
        email: 't2@example.com',
        profile: { name: 'T2', phone: '9800000002', avatar: null },
      },
      payments: [],
    });
    mockedPrisma.bookingHistory.create.mockResolvedValue({ id: 'bh-2' });
    mockedPrisma.user.findMany.mockResolvedValue([{ id: 'admin-1' }]);

    const result = await verifyKhaltiPayment({
      pidx: 'pidx-2',
      orderId: 'order-2',
      customerId: 'customer-2',
    });

    expect(mockKhaltiPost).toHaveBeenCalledWith('/epayment/lookup/', { pidx: 'pidx-2' });
    expect(mockedPrisma.payment.updateMany).toHaveBeenCalledWith({
      where: { orderId: 'order-2', transactionId: 'pidx-2' },
      data: expect.objectContaining({
        status: PaymentStatus.PAID,
        transactionId: 'txn-2',
        paidAt: expect.any(Date),
      }),
    });
    expect(mockedPrisma.order.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'order-2' },
        data: {
          paymentStatus: PaymentStatus.PAID,
          paymentId: 'txn-2',
        },
      })
    );
    expect(result.paymentStatus).toBe(PaymentStatus.PAID);
  });

  it('should handle failed payment verification and mark payment failed', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order-3',
      customerId: 'customer-3',
      technicianId: 'tech-3',
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PENDING,
      totalAmount: 2000,
      service: { name: 'Cleaning', category: { id: 'cat-3', name: 'Home' } },
      customer: {
        id: 'customer-3',
        email: 'c3@example.com',
        profile: { name: 'C3', phone: '9800000003' },
      },
      technician: {
        id: 'tech-3',
        email: 't3@example.com',
        profile: { name: 'T3', phone: '9800000004', avatar: null },
      },
    });

    mockKhaltiPost.mockResolvedValue({
      data: {
        pidx: 'pidx-3',
        total_amount: 200000,
        status: 'Pending',
        transaction_id: 'txn-3',
        fee: 0,
        refunded: false,
      },
    });

    mockedPrisma.payment.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      verifyKhaltiPayment({
        pidx: 'pidx-3',
        orderId: 'order-3',
        customerId: 'customer-3',
      })
    ).rejects.toThrow('Payment not completed. Khalti status: Pending');

    expect(mockedPrisma.payment.updateMany).toHaveBeenCalledWith({
      where: { orderId: 'order-3', transactionId: 'pidx-3' },
      data: { status: PaymentStatus.FAILED },
    });
    expect(mockedPrisma.order.update).not.toHaveBeenCalled();
  });

  it('should fail verification on amount mismatch and mark payment failed', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order-amt-1',
      customerId: 'customer-amt-1',
      technicianId: 'tech-amt-1',
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PENDING,
      totalAmount: 1500,
      service: { name: 'Electrical', category: { id: 'cat-1', name: 'Home' } },
      customer: {
        id: 'customer-amt-1',
        email: 'ca1@example.com',
        profile: { name: 'CA1', phone: '9800001000' },
      },
      technician: {
        id: 'tech-amt-1',
        email: 'ta1@example.com',
        profile: { name: 'TA1', phone: '9800001001', avatar: null },
      },
    });

    mockKhaltiPost.mockResolvedValue({
      data: {
        pidx: 'pidx-amt-1',
        total_amount: 149000,
        status: 'Completed',
        transaction_id: 'txn-amt-1',
        fee: 30,
        refunded: false,
      },
    });

    mockedPrisma.payment.updateMany.mockResolvedValue({ count: 1 });

    await expect(
      verifyKhaltiPayment({
        pidx: 'pidx-amt-1',
        orderId: 'order-amt-1',
        customerId: 'customer-amt-1',
      })
    ).rejects.toThrow('Payment amount mismatch');

    expect(mockedPrisma.payment.updateMany).toHaveBeenCalledWith({
      where: { orderId: 'order-amt-1', transactionId: 'pidx-amt-1' },
      data: { status: PaymentStatus.FAILED },
    });
    expect(mockedPrisma.order.update).not.toHaveBeenCalled();
  });

  it('should prevent duplicate payment verification when order is already paid', async () => {
    const alreadyPaidOrder = {
      id: 'order-4',
      customerId: 'customer-4',
      technicianId: 'tech-4',
      status: OrderStatus.COMPLETED,
      paymentStatus: PaymentStatus.PAID,
      totalAmount: 1000,
    };

    mockedPrisma.order.findUnique.mockResolvedValue(alreadyPaidOrder);

    const result = await verifyKhaltiPayment({
      pidx: 'pidx-4',
      orderId: 'order-4',
      customerId: 'customer-4',
    });

    expect(result).toEqual(alreadyPaidOrder);
    expect(mockKhaltiPost).not.toHaveBeenCalled();
    expect(mockedPrisma.payment.updateMany).not.toHaveBeenCalled();
    expect(mockedPrisma.order.update).not.toHaveBeenCalled();
  });
});