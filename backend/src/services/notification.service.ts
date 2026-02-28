import prisma from '../config/database';
import { NotificationType, UserRole } from '@prisma/client';
import { getIO } from '../socket';

// ── Types ─────────────────────────────────────────────

export interface CreateNotificationData {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
}

export interface NotificationFilters {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
}

// ── Helpers ───────────────────────────────────────────

/**
 * Create a notification, persist it to DB, and emit via Socket.IO.
 * Socket failure is non-blocking.
 */
export const createNotification = async (
  input: CreateNotificationData,
): Promise<void> => {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        data: input.data ? (input.data as any) : undefined,
      },
    });

    // Emit real-time push
    try {
      const io = getIO();
      io.to(`user:${input.userId}`).emit('notification', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        data: notification.data,
        isRead: false,
        createdAt: notification.createdAt.toISOString(),
      });
    } catch {
      // socket emission must not break the flow
    }
  } catch (err) {
    console.error('[Notification] Failed to create notification:', err);
  }
};

/**
 * Batch-insert notifications for multiple users using a single DB call,
 * then emit via Socket.IO per user room.
 */
export const notifyMany = async (
  userIds: string[],
  type: NotificationType,
  title: string,
  message: string,
  data?: Record<string, unknown>,
): Promise<void> => {
  if (userIds.length === 0) return;

  try {
    // Single batch insert instead of N individual inserts
    const records = userIds.map((userId) => ({
      userId,
      type,
      title,
      message,
      data: data ? (data as any) : undefined,
    }));

    await prisma.notification.createMany({ data: records });

    // Emit to each user's room — no DB overhead per emit
    try {
      const io = getIO();
      const now = new Date().toISOString();
      for (const userId of userIds) {
        io.to(`user:${userId}`).emit('notification', {
          type,
          title,
          message,
          data: data ?? null,
          isRead: false,
          createdAt: now,
        });
      }
    } catch {
      // socket emission must not break the flow
    }
  } catch (err) {
    console.error('[Notification] Batch create failed:', err);
  }
};

// ── Query helpers ─────────────────────────────────────

export const getNotifications = async (
  userId: string,
  filters: NotificationFilters = {},
) => {
  const page = Math.max(1, filters.page ?? 1);
  const limit = Math.min(50, Math.max(1, filters.limit ?? 20));
  const skip = (page - 1) * limit;

  const where: any = { userId };
  if (filters.unreadOnly) where.isRead = false;

  const [notifications, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ]);

  return {
    notifications,
    unreadCount,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNext: skip + limit < total,
      hasPrev: page > 1,
    },
  };
};

export const markAsRead = async (
  notificationId: string,
  userId: string,
): Promise<void> => {
  await prisma.notification.updateMany({
    where: { id: notificationId, userId },
    data: { isRead: true },
  });
};

export const markAllAsRead = async (userId: string): Promise<void> => {
  await prisma.notification.updateMany({
    where: { userId, isRead: false },
    data: { isRead: true },
  });
};

export const getUnreadCount = async (userId: string): Promise<number> => {
  return prisma.notification.count({
    where: { userId, isRead: false },
  });
};

// ── High-level notification senders for each event ────

export const notifyBookingCreated = async (order: any): Promise<void> => {
  // Notify all active technicians about new booking
  const technicians = await prisma.user.findMany({
    where: {
      role: UserRole.TECHNICIAN,
      isActive: true,
      kyc: { status: 'APPROVED' },
    },
    select: { id: true },
  });

  const payload = {
    orderId: order.id,
    serviceName: order.service?.name || 'Service',
    customerName: order.customer?.profile?.name || 'Customer',
    amount: Number(order.totalAmount),
  };

  await notifyMany(
    technicians.map((t) => t.id),
    NotificationType.BOOKING_CREATED,
    'New Booking Request',
    `New booking for ${payload.serviceName} — NPR ${payload.amount.toLocaleString()}`,
    payload,
  );
};

export const notifyBookingAccepted = async (order: any): Promise<void> => {
  const payload = {
    orderId: order.id,
    serviceName: order.service?.name || 'Service',
    technicianName: order.technician?.profile?.name || 'Technician',
  };

  // Notify customer
  await createNotification({
    userId: order.customerId,
    type: NotificationType.BOOKING_ACCEPTED,
    title: 'Booking Accepted',
    message: `${payload.technicianName} accepted your booking for ${payload.serviceName}`,
    data: payload,
  });
};

export const notifyBookingRejected = async (order: any): Promise<void> => {
  const payload = {
    orderId: order.id,
    serviceName: order.service?.name || order.serviceId,
  };

  // Notify customer
  await createNotification({
    userId: order.customerId,
    type: NotificationType.BOOKING_REJECTED,
    title: 'Booking Rejected',
    message: `Your booking for ${payload.serviceName} was not accepted. Please try again.`,
    data: payload,
  });
};

export const notifyBookingCancelled = async (
  order: any,
  cancelledByUserId: string,
  cancelledByRole: UserRole,
): Promise<void> => {
  const payload = { orderId: order.id };

  // Notify the OTHER party
  if (cancelledByRole === UserRole.CUSTOMER && order.technicianId) {
    await createNotification({
      userId: order.technicianId,
      type: NotificationType.BOOKING_CANCELLED,
      title: 'Booking Cancelled',
      message: `A customer cancelled their booking (ID: ${order.id.slice(-8)})`,
      data: payload,
    });
  } else if (cancelledByRole === UserRole.TECHNICIAN) {
    await createNotification({
      userId: order.customerId,
      type: NotificationType.BOOKING_CANCELLED,
      title: 'Booking Cancelled',
      message: `The technician cancelled your booking (ID: ${order.id.slice(-8)})`,
      data: payload,
    });
  } else if (cancelledByRole === UserRole.ADMIN) {
    // Admin cancelled — notify both
    const targets = [order.customerId];
    if (order.technicianId) targets.push(order.technicianId);
    await notifyMany(
      targets,
      NotificationType.BOOKING_CANCELLED,
      'Booking Cancelled by Admin',
      `Booking (ID: ${order.id.slice(-8)}) has been cancelled by admin`,
      payload,
    );
  }
};

export const notifyBookingStatusUpdated = async (
  order: any,
  newStatus: string,
  updatedByRole: UserRole,
): Promise<void> => {
  const statusLabels: Record<string, string> = {
    PENDING: 'Pending',
    ACCEPTED: 'Accepted',
    CONFIRMED: 'Confirmed',
    ASSIGNED: 'Assigned',
    IN_PROGRESS: 'In Progress',
    COMPLETED_BY_TECHNICIAN: 'Completed by Technician',
    COMPLETED: 'Completed',
  };

  const label = statusLabels[newStatus] || newStatus;
  const payload = {
    orderId: order.id,
    status: newStatus,
    serviceName: order.service?.name || 'Service',
  };

  // Notify customer
  if (updatedByRole !== UserRole.CUSTOMER) {
    await createNotification({
      userId: order.customerId,
      type: NotificationType.BOOKING_STATUS_UPDATED,
      title: 'Booking Updated',
      message: `Your booking for ${payload.serviceName} is now "${label}"`,
      data: payload,
    });
  }

  // Notify technician
  if (updatedByRole !== UserRole.TECHNICIAN && order.technicianId) {
    await createNotification({
      userId: order.technicianId,
      type: NotificationType.BOOKING_STATUS_UPDATED,
      title: 'Booking Updated',
      message: `Booking for ${payload.serviceName} is now "${label}"`,
      data: payload,
    });
  }
};

export const notifyBookingCompleted = async (order: any): Promise<void> => {
  const payload = {
    orderId: order.id,
    serviceName: order.service?.name || 'Service',
  };

  // Notify technician that customer confirmed completion
  if (order.technicianId) {
    await createNotification({
      userId: order.technicianId,
      type: NotificationType.BOOKING_COMPLETED,
      title: 'Booking Completed',
      message: `Customer confirmed completion for ${payload.serviceName}. Payment will follow.`,
      data: payload,
    });
  }
};

export const notifyPaymentSuccess = async (order: any, paymentMethod: string): Promise<void> => {
  const payload = {
    orderId: order.id,
    amount: Number(order.totalAmount),
    paymentMethod,
    serviceName: order.service?.name || 'Service',
  };

  // Notify technician
  if (order.technicianId) {
    await createNotification({
      userId: order.technicianId,
      type: NotificationType.PAYMENT_SUCCESS,
      title: 'Payment Received',
      message: `Payment of NPR ${payload.amount.toLocaleString()} received for ${payload.serviceName}`,
      data: payload,
    });
  }

  // Notify customer
  await createNotification({
    userId: order.customerId,
    type: NotificationType.PAYMENT_SUCCESS,
    title: 'Payment Successful',
    message: `Your payment of NPR ${payload.amount.toLocaleString()} for ${payload.serviceName} was successful`,
    data: payload,
  });
};

export const notifyReviewSubmitted = async (
  review: any,
  order: any,
  technicianId: string,
): Promise<void> => {
  const payload = {
    orderId: order.id,
    reviewId: review.id,
    rating: review.rating,
    serviceName: order.service?.name || review.service?.name || 'Service',
  };

  // Notify technician about the review
  await createNotification({
    userId: technicianId,
    type: NotificationType.REVIEW_SUBMITTED,
    title: 'New Review',
    message: `You received a ${review.rating}-star review for ${payload.serviceName}`,
    data: payload,
  });
};
