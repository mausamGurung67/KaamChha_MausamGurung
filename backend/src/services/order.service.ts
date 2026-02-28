import prisma from '../config/database';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { calculateCommission } from './commission.service';
import { findNearbyTechnicians } from './location.service';
import { getPaginationParams, createPaginationResponse } from '../utils/pagination.util';
import * as notificationService from './notification.service';

export interface CreateOrderData {
  customerId: string;
  serviceId: string;
  scheduledAt?: Date;
  serviceLatitude: number;
  serviceLongitude: number;
  serviceAddress: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  page?: number;
  limit?: number;
  startDate?: Date;
  endDate?: Date;
}

export const createOrder = async (data: CreateOrderData): Promise<any> => {
  // Verify service exists and is active
  const service = await prisma.service.findUnique({
    where: { id: data.serviceId },
    include: { category: true },
  });

  if (!service) {
    throw new Error('Service not found');
  }

  if (!service.isActive) {
    throw new Error('Service is not active');
  }

  // Calculate total amount
  const totalAmount = service.price;

  // Calculate commission
  const commission = calculateCommission(Number(totalAmount));

  // Create order
  const order = await prisma.order.create({
    data: {
      customerId: data.customerId,
      serviceId: data.serviceId,
      totalAmount,
      technicianAmount: commission.technicianAmount,
      platformAmount: commission.platformAmount,
      commissionRate: commission.commissionRate,
      scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
      serviceLatitude: data.serviceLatitude,
      serviceLongitude: data.serviceLongitude,
      serviceAddress: data.serviceAddress,
      status: OrderStatus.PENDING,
      paymentStatus: PaymentStatus.PENDING,
    },
    include: {
      service: {
        include: {
          category: true,
          creator: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      },
      customer: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              name: true,
              phone: true,
            },
          },
        },
      },
    },
  });

  // Create booking history entry
  await prisma.bookingHistory.create({
    data: {
      orderId: order.id,
      userId: data.customerId,
      action: 'ORDER_CREATED',
      status: OrderStatus.PENDING,
      notes: 'Order created by customer',
    },
  });

  // Real-time notification: notify all approved technicians
  notificationService.notifyBookingCreated(order).catch((err) =>
    console.error('[Notification] notifyBookingCreated failed:', err),
  );

  return order;
};

export const getOrderById = async (id: string, userId: string, userRole: UserRole): Promise<any> => {
  const order = await prisma.order.findUnique({
    where: { id },
    include: {
      service: {
        include: {
          category: true,
          creator: {
            select: {
              id: true,
              email: true,
              profile: {
                select: {
                  name: true,
                  avatar: true,
                },
              },
            },
          },
        },
      },
      customer: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              name: true,
              phone: true,
              address: true,
            },
          },
        },
      },
      technician: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              name: true,
              phone: true,
              avatar: true,
            },
          },
        },
      },
      payments: {
        orderBy: { createdAt: 'desc' },
      },
      bookingHistory: {
        orderBy: { createdAt: 'desc' },
        take: 20,
      },
    },
  });

  if (!order) {
    return null;
  }

  // Check access permissions
  if (userRole === UserRole.CUSTOMER && order.customerId !== userId) {
    throw new Error('Unauthorized to view this order');
  }

  if (userRole === UserRole.TECHNICIAN && order.technicianId !== userId) {
    throw new Error('Unauthorized to view this order');
  }

  return order;
};

export const listOrders = async (
  filters: OrderFilters,
  userId: string,
  userRole: UserRole
): Promise<{
  orders: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> => {
  const { page, limit, skip } = getPaginationParams(filters.page, filters.limit);

  const where: any = {};

  // Role-based filtering
  if (userRole === UserRole.CUSTOMER) {
    where.customerId = userId;
  } else if (userRole === UserRole.TECHNICIAN) {
    // Show orders assigned to this technician OR
    // ALL pending unassigned orders (first come first serve)
    where.OR = [
      { technicianId: userId },
      {
        technicianId: null,
        status: OrderStatus.PENDING,
      },
    ];
  }
  // Admin can see all orders (monitoring only)

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.paymentStatus) {
    where.paymentStatus = filters.paymentStatus;
  }

  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) {
      where.createdAt.gte = filters.startDate;
    }
    if (filters.endDate) {
      where.createdAt.lte = filters.endDate;
    }
  }

  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        service: {
          select: {
            id: true,
            name: true,
            image: true,
            category: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                phone: true,
              },
            },
          },
        },
        technician: {
          select: {
            id: true,
            email: true,
            profile: {
              select: {
                name: true,
                phone: true,
                avatar: true,
              },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.order.count({ where }),
  ]);

  const paginationResult = createPaginationResponse(orders, total, page, limit);
  return {
    orders: paginationResult.data,
    pagination: paginationResult.pagination,
  };
};

export const updateOrderStatus = async (
  id: string,
  status: OrderStatus,
  userId: string,
  userRole: UserRole,
  notes?: string
): Promise<any> => {
  const order = await prisma.order.findUnique({
    where: { id },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Check permissions
  if (userRole === UserRole.CUSTOMER && order.customerId !== userId) {
    throw new Error('Unauthorized to update this order');
  }

  if (userRole === UserRole.TECHNICIAN && order.technicianId !== userId) {
    throw new Error('Unauthorized to update this order');
  }

  // Validate status transitions
  const validTransitions: Record<OrderStatus, OrderStatus[]> = {
    PENDING: [OrderStatus.ACCEPTED, OrderStatus.REJECTED, OrderStatus.CONFIRMED, OrderStatus.CANCELLED],
    ACCEPTED: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
    REJECTED: [],
    CONFIRMED: [OrderStatus.ASSIGNED, OrderStatus.CANCELLED],
    ASSIGNED: [OrderStatus.IN_PROGRESS, OrderStatus.CANCELLED],
    IN_PROGRESS: [OrderStatus.COMPLETED_BY_TECHNICIAN, OrderStatus.COMPLETED, OrderStatus.CANCELLED],
    COMPLETED_BY_TECHNICIAN: [OrderStatus.COMPLETED],
    COMPLETED: [],
    CANCELLED: [],
  };

  if (!validTransitions[order.status].includes(status)) {
    throw new Error(`Invalid status transition from ${order.status} to ${status}`);
  }

  const updateData: any = { status };

  if (status === OrderStatus.COMPLETED) {
    updateData.completedAt = new Date();
  }

  const updatedOrder = await prisma.order.update({
    where: { id },
    data: updateData,
    include: {
      service: true,
      customer: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              name: true,
            },
          },
        },
      },
      technician: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              name: true,
            },
          },
        },
      },
    },
  });

  // Create booking history entry
  await prisma.bookingHistory.create({
    data: {
      orderId: id,
      userId,
      action: 'STATUS_UPDATED',
      status,
      notes: notes || `Status updated to ${status}`,
    },
  });

  // Real-time notification for status update
  notificationService.notifyBookingStatusUpdated(updatedOrder, status, userRole).catch((err) =>
    console.error('[Notification] notifyBookingStatusUpdated failed:', err),
  );

  return updatedOrder;
};

export const assignTechnician = async (
  orderId: string,
  technicianId: string,
  adminId: string
): Promise<any> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (order.status !== OrderStatus.CONFIRMED && order.status !== OrderStatus.PENDING) {
    throw new Error('Order must be in PENDING or CONFIRMED status to assign technician');
  }

  // Verify technician exists and is active
  const technician = await prisma.user.findUnique({
    where: { id: technicianId },
    include: { kyc: true },
  });

  if (!technician || technician.role !== UserRole.TECHNICIAN) {
    throw new Error('Invalid technician');
  }

  if (!technician.isActive) {
    throw new Error('Technician is not active');
  }

  if (!technician.kyc || technician.kyc.status !== 'APPROVED') {
    throw new Error('Technician KYC is not approved');
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      technicianId,
      status: OrderStatus.ASSIGNED,
    },
    include: {
      technician: {
        select: {
          id: true,
          email: true,
          profile: {
            select: {
              name: true,
              phone: true,
              avatar: true,
            },
          },
        },
      },
    },
  });

  // Create booking history entry
  await prisma.bookingHistory.create({
    data: {
      orderId,
      userId: adminId,
      action: 'TECHNICIAN_ASSIGNED',
      status: OrderStatus.ASSIGNED,
      notes: `Technician ${technician.email} assigned to order`,
    },
  });

  // Real-time notification for assignment
  notificationService.notifyBookingStatusUpdated(updatedOrder, OrderStatus.ASSIGNED, UserRole.ADMIN).catch((err) =>
    console.error('[Notification] notifyBookingStatusUpdated (assign) failed:', err),
  );

  return updatedOrder;
};

export const autoAssignTechnician = async (orderId: string, adminId: string): Promise<any> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { service: true },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  if (!order.serviceLatitude || !order.serviceLongitude) {
    throw new Error('Order location is required for auto-assignment');
  }

  // Find nearby technicians
  const radius = order.service.serviceRadius || 10; // Default 10km
  const nearbyTechnicians = await findNearbyTechnicians(
    order.serviceLatitude,
    order.serviceLongitude,
    radius
  );

  if (nearbyTechnicians.length === 0) {
    throw new Error('No technicians available in the area');
  }

  // Filter technicians with approved KYC
  const availableTechnicians = nearbyTechnicians.filter(
    (tech: any) => tech.kyc?.status === 'APPROVED' && tech.isActive
  );

  if (availableTechnicians.length === 0) {
    throw new Error('No available technicians with approved KYC in the area');
  }

  // Assign the closest technician
  const assignedTechnician = availableTechnicians[0];

  return assignTechnician(orderId, assignedTechnician.id, adminId);
};

export const cancelOrder = async (
  orderId: string,
  userId: string,
  userRole: UserRole,
  reason?: string
): Promise<any> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  // Check permissions
  if (userRole === UserRole.CUSTOMER && order.customerId !== userId) {
    throw new Error('Unauthorized to cancel this order');
  }

  if (userRole === UserRole.TECHNICIAN && order.technicianId !== userId) {
    throw new Error('Unauthorized to cancel this order');
  }

  // Check if order can be cancelled
  if (order.status === OrderStatus.COMPLETED) {
    throw new Error('Cannot cancel a completed order');
  }

  if (order.status === OrderStatus.CANCELLED) {
    throw new Error('Order is already cancelled');
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.CANCELLED,
    },
  });

  // Create booking history entry
  await prisma.bookingHistory.create({
    data: {
      orderId,
      userId,
      action: 'ORDER_CANCELLED',
      status: OrderStatus.CANCELLED,
      notes: reason || 'Order cancelled',
    },
  });

  // Real-time notification: notify the other party about cancellation
  notificationService.notifyBookingCancelled(order, userId, userRole).catch((err) =>
    console.error('[Notification] notifyBookingCancelled failed:', err),
  );

  return updatedOrder;
};

// ── Technician accepts a booking ──────────────────────
export const acceptOrder = async (orderId: string, technicianId: string): Promise<any> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new Error('Booking not found');
  if (order.status !== OrderStatus.PENDING) throw new Error('Booking is not in PENDING status');

  // Verify technician exists and has approved KYC
  const technician = await prisma.user.findUnique({
    where: { id: technicianId },
    include: { kyc: true },
  });

  if (!technician || technician.role !== UserRole.TECHNICIAN) throw new Error('Invalid technician');
  if (!technician.isActive) throw new Error('Technician is not active');
  if (!technician.kyc || technician.kyc.status !== 'APPROVED') throw new Error('Technician KYC not approved');

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      technicianId,
      status: OrderStatus.ACCEPTED,
    },
    include: {
      service: { include: { category: true } },
      customer: {
        select: { id: true, email: true, profile: { select: { name: true, phone: true } } },
      },
      technician: {
        select: { id: true, email: true, profile: { select: { name: true, phone: true, avatar: true } } },
      },
    },
  });

  await prisma.bookingHistory.create({
    data: {
      orderId,
      userId: technicianId,
      action: 'BOOKING_ACCEPTED',
      status: OrderStatus.ACCEPTED,
      notes: `Booking accepted by technician`,
    },
  });

  // Real-time notification: notify customer
  notificationService.notifyBookingAccepted(updatedOrder).catch((err) =>
    console.error('[Notification] notifyBookingAccepted failed:', err),
  );

  return updatedOrder;
};

// ── Technician rejects a booking ──────────────────────
export const rejectOrder = async (orderId: string, technicianId: string, reason?: string): Promise<any> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new Error('Booking not found');
  if (order.status !== OrderStatus.PENDING) throw new Error('Booking is not in PENDING status');

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.REJECTED,
    },
  });

  await prisma.bookingHistory.create({
    data: {
      orderId,
      userId: technicianId,
      action: 'BOOKING_REJECTED',
      status: OrderStatus.REJECTED,
      notes: reason || 'Booking rejected by technician',
    },
  });

  // Real-time notification: notify customer
  notificationService.notifyBookingRejected(updatedOrder).catch((err) =>
    console.error('[Notification] notifyBookingRejected failed:', err),
  );

  return updatedOrder;
};

// ── Technician marks booking as complete ──────────────
export const completeByTechnician = async (
  orderId: string,
  technicianId: string,
  data: { notes?: string; beforePhotos?: string[]; afterPhotos?: string[] }
): Promise<any> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new Error('Booking not found');
  if (order.technicianId !== technicianId) throw new Error('Unauthorized');
  if (order.status !== OrderStatus.IN_PROGRESS) throw new Error('Booking must be IN_PROGRESS');

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.COMPLETED_BY_TECHNICIAN,
      technicianNotes: data.notes || null,
      beforePhotos: data.beforePhotos || [],
      afterPhotos: data.afterPhotos || [],
    },
    include: {
      service: { include: { category: true } },
      customer: {
        select: { id: true, email: true, profile: { select: { name: true, phone: true } } },
      },
      technician: {
        select: { id: true, email: true, profile: { select: { name: true, phone: true, avatar: true } } },
      },
    },
  });

  await prisma.bookingHistory.create({
    data: {
      orderId,
      userId: technicianId,
      action: 'COMPLETED_BY_TECHNICIAN',
      status: OrderStatus.COMPLETED_BY_TECHNICIAN,
      notes: data.notes || 'Marked as completed by technician',
    },
  });

  // Real-time notification: notify customer about pending confirmation
  notificationService.notifyBookingStatusUpdated(
    updatedOrder,
    OrderStatus.COMPLETED_BY_TECHNICIAN,
    UserRole.TECHNICIAN,
  ).catch((err) =>
    console.error('[Notification] notifyBookingStatusUpdated (completedByTech) failed:', err),
  );

  return updatedOrder;
};

// ── Customer confirms completion ──────────────────────
export const confirmCompletion = async (orderId: string, customerId: string): Promise<any> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new Error('Booking not found');
  if (order.customerId !== customerId) throw new Error('Unauthorized');
  if (order.status !== OrderStatus.COMPLETED_BY_TECHNICIAN) {
    throw new Error('Booking must be marked as completed by technician first');
  }

  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: {
      status: OrderStatus.COMPLETED,
      completedAt: new Date(),
    },
    include: {
      service: { include: { category: true } },
      customer: {
        select: { id: true, email: true, profile: { select: { name: true, phone: true } } },
      },
      technician: {
        select: { id: true, email: true, profile: { select: { name: true, phone: true, avatar: true } } },
      },
    },
  });

  await prisma.bookingHistory.create({
    data: {
      orderId,
      userId: customerId,
      action: 'COMPLETION_CONFIRMED',
      status: OrderStatus.COMPLETED,
      notes: 'Customer confirmed completion',
    },
  });

  // Real-time notification: notify technician of confirmed completion
  notificationService.notifyBookingCompleted(updatedOrder).catch((err) =>
    console.error('[Notification] notifyBookingCompleted failed:', err),
  );

  return updatedOrder;
};

export const getOrderChats = async (
  orderId: string,
  userId: string,
  userRole: UserRole,
): Promise<any[]> => {
  // Verify user has access to this order
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { customerId: true, technicianId: true },
  });

  if (!order) {
    throw new Error('Order not found');
  }

  const isCustomer = order.customerId === userId;
  const isTechnician = order.technicianId === userId;
  const isAdmin = userRole === UserRole.ADMIN;

  if (!isCustomer && !isTechnician && !isAdmin) {
    throw new Error('Not authorized to view this chat');
  }

  const chats = await prisma.chat.findMany({
    where: { orderId },
    orderBy: { createdAt: 'asc' },
    include: {
      sender: {
        select: {
          id: true,
          email: true,
          role: true,
          profile: { select: { name: true, avatar: true } },
        },
      },
    },
  });

  return chats.map((c) => ({
    id: c.id,
    orderId: c.orderId,
    senderId: c.senderId,
    senderRole: c.sender.role,
    senderName: c.sender.profile?.name || c.sender.email,
    message: c.message,
    isRead: c.isRead,
    createdAt: c.createdAt,
  }));
};
