import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import {
  assignTechnician,
  cancelOrder,
  completeByTechnician,
  confirmCompletion,
  createOrder,
  CreateOrderData,
  getOrderById,
  listOrders,
  updateOrderStatus,
} from '../../order.service';
import prisma from '../../../config/database';
import { calculateCommission } from '../../commission.service';
import * as notificationService from '../../notification.service';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    service: {
      findUnique: jest.fn(),
    },
    order: {
      create: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    bookingHistory: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../commission.service', () => ({
  calculateCommission: jest.fn(),
}));

jest.mock('../../notification.service', () => ({
  notifyBookingCreated: jest.fn(),
  notifyBookingStatusUpdated: jest.fn(),
  notifyBookingCompleted: jest.fn(),
  notifyBookingCancelled: jest.fn(),
}));

type MockDb = {
  service: {
    findUnique: jest.Mock;
  };
  order: {
    create: jest.Mock;
    findUnique: jest.Mock;
    findMany: jest.Mock;
    count: jest.Mock;
    update: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
  };
  bookingHistory: {
    create: jest.Mock;
  };
};

const mockedPrisma = prisma as unknown as MockDb;
const mockedCalculateCommission = calculateCommission as jest.MockedFunction<typeof calculateCommission>;
const mockedNotifyBookingCreated = notificationService.notifyBookingCreated as jest.MockedFunction<
  typeof notificationService.notifyBookingCreated
>;
const mockedNotifyBookingStatusUpdated =
  notificationService.notifyBookingStatusUpdated as jest.MockedFunction<
    typeof notificationService.notifyBookingStatusUpdated
  >;
const mockedNotifyBookingCompleted = notificationService.notifyBookingCompleted as jest.MockedFunction<
  typeof notificationService.notifyBookingCompleted
>;
const mockedNotifyBookingCancelled = notificationService.notifyBookingCancelled as jest.MockedFunction<
  typeof notificationService.notifyBookingCancelled
>;

describe('booking logic (createOrder)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNotifyBookingCreated.mockResolvedValue();
    mockedNotifyBookingStatusUpdated.mockResolvedValue();
    mockedNotifyBookingCompleted.mockResolvedValue();
    mockedNotifyBookingCancelled.mockResolvedValue();
  });

  it('should validate missing required booking fields', async () => {
    const payload = {
      customerId: 'customer-1',
      serviceId: '',
      serviceLatitude: 27.7172,
      serviceLongitude: 85.324,
      serviceAddress: '',
    } as CreateOrderData;

    await expect(createOrder(payload)).rejects.toThrow('Missing required booking fields');

    expect(mockedPrisma.service.findUnique).not.toHaveBeenCalled();
    expect(mockedPrisma.order.create).not.toHaveBeenCalled();
  });

  it('should create valid booking', async () => {
    const payload: CreateOrderData = {
      customerId: 'customer-1',
      serviceId: 'service-1',
      scheduledAt: new Date('2026-04-05T10:00:00.000Z'),
      serviceLatitude: 27.7172,
      serviceLongitude: 85.324,
      serviceAddress: 'Baneshwor, Kathmandu',
    };

    const mockService = {
      id: 'service-1',
      isActive: true,
      price: 1500,
      category: { id: 'cat-1', name: 'Electrical' },
    };

    const mockOrder = {
      id: 'order-1',
      customerId: payload.customerId,
      serviceId: payload.serviceId,
      totalAmount: 1500,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
      serviceLatitude: payload.serviceLatitude,
      serviceLongitude: payload.serviceLongitude,
      serviceAddress: payload.serviceAddress,
    };

    mockedPrisma.service.findUnique.mockResolvedValue(mockService);
    mockedCalculateCommission.mockReturnValue({
      totalAmount: 1500,
      technicianAmount: 1200,
      platformAmount: 300,
      commissionRate: 0.8,
    });
    mockedPrisma.order.create.mockResolvedValue(mockOrder);
    mockedPrisma.bookingHistory.create.mockResolvedValue({ id: 'bh-1' });

    const result = await createOrder(payload);

    expect(mockedPrisma.service.findUnique).toHaveBeenCalledWith({
      where: { id: payload.serviceId },
      include: { category: true },
    });
    expect(mockedCalculateCommission).toHaveBeenCalledWith(1500);
    expect(mockedPrisma.order.create).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          totalAmount: 1500,
          technicianAmount: 1200,
          platformAmount: 300,
          commissionRate: 0.8,
        }),
      })
    );
    expect(mockedPrisma.bookingHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order-1',
        userId: payload.customerId,
        action: 'ORDER_CREATED',
      }),
    });

    expect(result).toEqual(mockOrder);
  });

  it('should set default booking status to PENDING', async () => {
    const payload: CreateOrderData = {
      customerId: 'customer-2',
      serviceId: 'service-2',
      serviceLatitude: 27.7172,
      serviceLongitude: 85.324,
      serviceAddress: 'Koteshwor, Kathmandu',
    };

    mockedPrisma.service.findUnique.mockResolvedValue({
      id: 'service-2',
      isActive: true,
      price: 2200,
      category: { id: 'cat-2', name: 'Plumbing' },
    });
    mockedCalculateCommission.mockReturnValue({
      totalAmount: 2200,
      technicianAmount: 1760,
      platformAmount: 440,
      commissionRate: 0.8,
    });
    mockedPrisma.order.create.mockResolvedValue({
      id: 'order-2',
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    });
    mockedPrisma.bookingHistory.create.mockResolvedValue({ id: 'bh-2' });

    await createOrder(payload);

    expect(mockedPrisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: OrderStatus.PENDING,
        }),
      })
    );
  });

  it('should use location/address chosen from map in booking payload', async () => {
    const payload: CreateOrderData = {
      customerId: 'customer-99',
      serviceId: 'service-99',
      serviceLatitude: 27.7001,
      serviceLongitude: 85.3333,
      serviceAddress: 'New Road, Kathmandu',
    };

    mockedPrisma.service.findUnique.mockResolvedValue({
      id: 'service-99',
      isActive: true,
      price: 1000,
      category: { id: 'cat-2' },
    });
    mockedCalculateCommission.mockReturnValue({
      totalAmount: 1000,
      technicianAmount: 800,
      platformAmount: 200,
      commissionRate: 0.8,
    });
    mockedPrisma.order.create.mockResolvedValue({ id: 'order-99' });
    mockedPrisma.bookingHistory.create.mockResolvedValue({ id: 'bh-99' });

    await createOrder(payload);

    expect(mockedPrisma.order.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          serviceLatitude: 27.7001,
          serviceLongitude: 85.3333,
          serviceAddress: 'New Road, Kathmandu',
        }),
      })
    );
  });

  it('should support booking flow from PENDING to COMPLETED through technician evidence and customer confirmation', async () => {
    const orderId = 'order-flow-1';
    const technicianId = 'tech-1';
    const customerId = 'customer-1';

    mockedPrisma.order.findUnique
      .mockResolvedValueOnce({
        id: orderId,
        status: OrderStatus.IN_PROGRESS,
        technicianId,
        customerId,
      })
      .mockResolvedValueOnce({
        id: orderId,
        status: OrderStatus.COMPLETED_BY_TECHNICIAN,
        technicianId,
        customerId,
      });

    mockedPrisma.order.update
      .mockResolvedValueOnce({
        id: orderId,
        status: OrderStatus.COMPLETED_BY_TECHNICIAN,
        customerId,
        technicianId,
      })
      .mockResolvedValueOnce({
        id: orderId,
        status: OrderStatus.COMPLETED,
        customerId,
        technicianId,
        completedAt: new Date('2026-04-04T09:00:00.000Z'),
      });

    mockedPrisma.bookingHistory.create.mockResolvedValue({ id: 'bh-flow-1' });

    const submitted = await completeByTechnician(orderId, technicianId, {
      notes: 'Work done and evidence attached',
      beforePhotos: ['https://img.example/before.jpg'],
      afterPhotos: ['https://img.example/after.jpg'],
    });

    const confirmed = await confirmCompletion(orderId, customerId);

    expect(submitted.status).toBe(OrderStatus.COMPLETED_BY_TECHNICIAN);
    expect(confirmed.status).toBe(OrderStatus.COMPLETED);

    expect(mockedNotifyBookingStatusUpdated).toHaveBeenCalledWith(
      expect.objectContaining({ id: orderId }),
      OrderStatus.COMPLETED_BY_TECHNICIAN,
      'TECHNICIAN'
    );
    expect(mockedNotifyBookingCompleted).toHaveBeenCalledWith(
      expect.objectContaining({ id: orderId })
    );
  });

  it('should reject invalid status transition from COMPLETED to PENDING', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order-3',
      customerId: 'customer-3',
      technicianId: 'tech-3',
      status: OrderStatus.COMPLETED,
    });

    await expect(
      updateOrderStatus('order-3', OrderStatus.PENDING, 'customer-3', 'CUSTOMER')
    ).rejects.toThrow('Invalid status transition from COMPLETED to PENDING');

    expect(mockedPrisma.order.update).not.toHaveBeenCalled();
    expect(mockedNotifyBookingStatusUpdated).not.toHaveBeenCalled();
  });

  it('should allow customer to verify completion only after technician submits evidence', async () => {
    const orderId = 'order-4';
    const customerId = 'customer-4';

    mockedPrisma.order.findUnique.mockResolvedValueOnce({
      id: orderId,
      customerId,
      technicianId: 'tech-4',
      status: OrderStatus.IN_PROGRESS,
    });

    await expect(confirmCompletion(orderId, customerId)).rejects.toThrow(
      'Booking must be marked as completed by technician first'
    );

    mockedPrisma.order.findUnique.mockResolvedValueOnce({
      id: orderId,
      customerId,
      technicianId: 'tech-4',
      status: OrderStatus.COMPLETED_BY_TECHNICIAN,
    });
    mockedPrisma.order.update.mockResolvedValueOnce({
      id: orderId,
      customerId,
      technicianId: 'tech-4',
      status: OrderStatus.COMPLETED,
      completedAt: new Date('2026-04-04T10:00:00.000Z'),
    });
    mockedPrisma.bookingHistory.create.mockResolvedValueOnce({ id: 'bh-4' });

    const confirmed = await confirmCompletion(orderId, customerId);

    expect(confirmed.status).toBe(OrderStatus.COMPLETED);
    expect(mockedNotifyBookingCompleted).toHaveBeenCalledWith(
      expect.objectContaining({ id: orderId, status: OrderStatus.COMPLETED })
    );
  });

  it('should enforce view permissions on getOrderById for non-owner customer', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order-view-1',
      customerId: 'customer-owner',
      technicianId: 'tech-owner',
    });

    await expect(getOrderById('order-view-1', 'other-customer', UserRole.CUSTOMER)).rejects.toThrow(
      'Unauthorized to view this order'
    );
  });

  it('should include pending unassigned orders when technician lists orders', async () => {
    mockedPrisma.order.findMany.mockResolvedValue([{ id: 'order-list-1' }]);
    mockedPrisma.order.count.mockResolvedValue(1);

    const result = await listOrders({}, 'tech-list-1', UserRole.TECHNICIAN);

    expect(mockedPrisma.order.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          OR: [
            { technicianId: 'tech-list-1' },
            { technicianId: null, status: OrderStatus.PENDING },
          ],
        },
      })
    );
    expect(result.orders).toEqual([{ id: 'order-list-1' }]);
  });

  it('should cancel order for authorized customer and create cancellation history', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order-cancel-1',
      customerId: 'customer-cancel-1',
      technicianId: 'tech-cancel-1',
      status: OrderStatus.ASSIGNED,
    });
    mockedPrisma.order.update.mockResolvedValue({ id: 'order-cancel-1', status: OrderStatus.CANCELLED });
    mockedPrisma.bookingHistory.create.mockResolvedValue({ id: 'bh-cancel-1' });

    const result = await cancelOrder('order-cancel-1', 'customer-cancel-1', UserRole.CUSTOMER, 'Plan changed');

    expect(result.status).toBe(OrderStatus.CANCELLED);
    expect(mockedPrisma.bookingHistory.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        orderId: 'order-cancel-1',
        action: 'ORDER_CANCELLED',
        status: OrderStatus.CANCELLED,
      }),
    });
  });

  it('should reject assignTechnician when technician KYC is not approved', async () => {
    mockedPrisma.order.findUnique.mockResolvedValue({
      id: 'order-assign-1',
      status: OrderStatus.PENDING,
    });
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'tech-assign-1',
      role: UserRole.TECHNICIAN,
      isActive: true,
      kyc: { status: 'PENDING' },
    });

    await expect(assignTechnician('order-assign-1', 'tech-assign-1', 'admin-1')).rejects.toThrow(
      'Technician KYC is not approved'
    );

    expect(mockedPrisma.order.update).not.toHaveBeenCalled();
  });
});
