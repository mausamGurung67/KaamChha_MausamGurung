import { NotificationType } from '@prisma/client';
import prisma from '../../../config/database';
import { notifyBookingCreated, notifyPaymentSuccess } from '../../notification.service';

const mockEmit = jest.fn();
const mockTo = jest.fn(() => ({ emit: mockEmit }));

jest.mock('../../../socket', () => ({
  __esModule: true,
  getIO: jest.fn(() => ({
    to: mockTo,
  })),
}));

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
    },
    notification: {
      createMany: jest.fn(),
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

type MockDb = {
  user: {
    findMany: jest.Mock;
  };
  notification: {
    createMany: jest.Mock;
    create: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    updateMany: jest.Mock;
  };
};

const mockedPrisma = prisma as unknown as MockDb;

describe('notification logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should trigger notifications on booking creation', async () => {
    mockedPrisma.user.findMany.mockResolvedValue([
      { id: 'tech-1' },
      { id: 'tech-2' },
    ]);
    mockedPrisma.notification.createMany.mockResolvedValue({ count: 2 });

    await notifyBookingCreated({
      id: 'order-1',
      totalAmount: 2500,
      service: { name: 'Plumbing' },
      customer: { profile: { name: 'Customer One' } },
    });

    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith({
      where: {
        role: 'TECHNICIAN',
        isActive: true,
        kyc: { status: 'APPROVED' },
      },
      select: { id: true },
    });

    expect(mockedPrisma.notification.createMany).toHaveBeenCalledWith({
      data: expect.arrayContaining([
        expect.objectContaining({
          userId: 'tech-1',
          type: NotificationType.BOOKING_CREATED,
          title: 'New Booking Request',
        }),
        expect.objectContaining({
          userId: 'tech-2',
          type: NotificationType.BOOKING_CREATED,
          title: 'New Booking Request',
        }),
      ]),
    });

    expect(mockTo).toHaveBeenCalledWith('user:tech-1');
    expect(mockTo).toHaveBeenCalledWith('user:tech-2');
    expect(mockEmit).toHaveBeenCalledWith(
      'notification',
      expect.objectContaining({
        type: NotificationType.BOOKING_CREATED,
        title: 'New Booking Request',
      }),
    );
  });

  it('should trigger payment notifications for technician and customer', async () => {
    mockedPrisma.notification.create
      .mockResolvedValueOnce({
        id: 'noti-1',
        type: NotificationType.PAYMENT_SUCCESS,
        title: 'Payment Received',
        message: 'Payment received',
        data: null,
        createdAt: new Date('2026-04-04T12:00:00.000Z'),
      })
      .mockResolvedValueOnce({
        id: 'noti-2',
        type: NotificationType.PAYMENT_SUCCESS,
        title: 'Payment Successful',
        message: 'Payment successful',
        data: null,
        createdAt: new Date('2026-04-04T12:00:01.000Z'),
      });

    await notifyPaymentSuccess(
      {
        id: 'order-2',
        customerId: 'customer-2',
        technicianId: 'tech-2',
        totalAmount: 1800,
        service: { name: 'Electrical' },
      },
      'KHALTI',
    );

    expect(mockedPrisma.notification.create).toHaveBeenCalledTimes(2);
    expect(mockedPrisma.notification.create).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'tech-2',
          type: NotificationType.PAYMENT_SUCCESS,
          title: 'Payment Received',
        }),
      }),
    );
    expect(mockedPrisma.notification.create).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'customer-2',
          type: NotificationType.PAYMENT_SUCCESS,
          title: 'Payment Successful',
        }),
      }),
    );

    expect(mockTo).toHaveBeenCalledWith('user:tech-2');
    expect(mockTo).toHaveBeenCalledWith('user:customer-2');
    expect(mockEmit).toHaveBeenCalledWith(
      'notification',
      expect.objectContaining({
        type: NotificationType.PAYMENT_SUCCESS,
      }),
    );
  });

  it('should skip booking notifications when there are no active approved technicians', async () => {
    mockedPrisma.user.findMany.mockResolvedValue([]);

    await notifyBookingCreated({
      id: 'order-empty-1',
      totalAmount: 1200,
      service: { name: 'Gardening' },
      customer: { profile: { name: 'Customer Empty' } },
    });

    expect(mockedPrisma.user.findMany).toHaveBeenCalled();
    expect(mockedPrisma.notification.createMany).not.toHaveBeenCalled();
    expect(mockTo).not.toHaveBeenCalled();
  });
});