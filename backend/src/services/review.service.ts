import prisma from '../config/database';
import { OrderStatus, PaymentStatus, UserRole } from '@prisma/client';
import { getIO } from '../socket';
import * as notificationService from './notification.service';

// ── Types ─────────────────────────────────────────────

export interface CreateReviewData {
  orderId: string;
  customerId: string;
  rating: number; // 1-5
  comment?: string;
}

export interface ReviewFilters {
  technicianId?: string;
  serviceId?: string;
  page?: number;
  limit?: number;
}

// ── Create review ─────────────────────────────────────

export const createReview = async (data: CreateReviewData): Promise<any> => {
  // 1. Fetch the order with relations
  const order = await prisma.order.findUnique({
    where: { id: data.orderId },
    include: {
      review: true,
      service: { select: { id: true, name: true } },
      customer: {
        select: {
          id: true,
          email: true,
          profile: { select: { name: true, avatar: true } },
        },
      },
      technician: {
        select: {
          id: true,
          email: true,
          profile: { select: { name: true, avatar: true } },
        },
      },
    },
  });

  if (!order) {
    throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  }

  // 2. Verify the customer owns this order
  if (order.customerId !== data.customerId) {
    throw Object.assign(new Error('Unauthorized: you do not own this order'), { statusCode: 403 });
  }

  // 3. Order must be COMPLETED
  if (order.status !== OrderStatus.COMPLETED) {
    throw Object.assign(
      new Error(`Order must be COMPLETED to leave a review. Current status: ${order.status}`),
      { statusCode: 400 }
    );
  }

  // 4. Payment must be PAID
  if (order.paymentStatus !== PaymentStatus.PAID) {
    throw Object.assign(
      new Error('Payment must be completed before leaving a review'),
      { statusCode: 400 }
    );
  }

  // 5. Check for duplicate review
  if (order.review) {
    throw Object.assign(
      new Error('You have already reviewed this order'),
      { statusCode: 409 }
    );
  }

  // 6. Must have an assigned technician
  if (!order.technicianId) {
    throw Object.assign(
      new Error('Cannot review an order without an assigned technician'),
      { statusCode: 400 }
    );
  }

  // 7. Validate rating range
  if (data.rating < 1 || data.rating > 5) {
    throw Object.assign(
      new Error('Rating must be between 1 and 5'),
      { statusCode: 400 }
    );
  }

  // 8. Create the review
  const review = await prisma.review.create({
    data: {
      orderId: data.orderId,
      customerId: data.customerId,
      technicianId: order.technicianId,
      serviceId: order.serviceId,
      rating: data.rating,
      comment: data.comment?.trim() || null,
      isApproved: true, // Auto-approve for now
    },
    include: {
      customer: {
        select: {
          id: true,
          email: true,
          profile: { select: { name: true, avatar: true } },
        },
      },
      service: { select: { id: true, name: true } },
      order: {
        select: {
          id: true,
          totalAmount: true,
          completedAt: true,
        },
      },
    },
  });

  // 9. Calculate updated average rating for the technician
  const averageResult = await prisma.review.aggregate({
    where: {
      technicianId: order.technicianId,
      isApproved: true,
    },
    _avg: { rating: true },
    _count: { rating: true },
  });

  const averageRating = Math.round((averageResult._avg.rating ?? 0) * 10) / 10;
  const totalReviews = averageResult._count.rating;

  // 10. Emit real-time socket events
  try {
    const io = getIO();

    const reviewPayload = {
      review: {
        id: review.id,
        orderId: review.orderId,
        rating: review.rating,
        comment: review.comment,
        createdAt: review.createdAt,
        customer: review.customer,
        service: review.service,
      },
      technicianId: order.technicianId,
      averageRating,
      totalReviews,
    };

    // Notify the technician
    io.to(`user:${order.technicianId}`).emit('newReview', reviewPayload);

    // Notify admin(s)
    const admins = await prisma.user.findMany({
      where: { role: UserRole.ADMIN, isActive: true },
      select: { id: true },
    });

    for (const admin of admins) {
      io.to(`user:${admin.id}`).emit('newReview', reviewPayload);
    }

    // Confirm to the customer
    io.to(`user:${data.customerId}`).emit('reviewSubmitted', reviewPayload);
  } catch (socketError) {
    console.error('[Review] Socket emit error:', socketError);
  }

  // Persist notification for the technician
  notificationService.notifyReviewSubmitted(review, order, order.technicianId!).catch((err) =>
    console.error('[Notification] notifyReviewSubmitted failed:', err),
  );

  return {
    review,
    averageRating,
    totalReviews,
  };
};

// ── Get reviews for a technician ──────────────────────

export const getTechnicianReviews = async (
  technicianId: string,
  page = 1,
  limit = 10
): Promise<{
  reviews: any[];
  averageRating: number;
  totalReviews: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> => {
  const skip = (page - 1) * limit;

  const [reviews, total, aggregation] = await Promise.all([
    prisma.review.findMany({
      where: { technicianId, isApproved: true },
      include: {
        customer: {
          select: {
            id: true,
            profile: { select: { name: true, avatar: true } },
          },
        },
        service: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { technicianId, isApproved: true } }),
    prisma.review.aggregate({
      where: { technicianId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const averageRating = Math.round((aggregation._avg.rating ?? 0) * 10) / 10;
  const totalReviews = aggregation._count.rating;
  const totalPages = Math.ceil(total / limit);

  return {
    reviews,
    averageRating,
    totalReviews,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

// ── Get reviews for a service ─────────────────────────

export const getServiceReviews = async (
  serviceId: string,
  page = 1,
  limit = 10
): Promise<{
  reviews: any[];
  averageRating: number;
  totalReviews: number;
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}> => {
  const skip = (page - 1) * limit;

  const [reviews, total, aggregation] = await Promise.all([
    prisma.review.findMany({
      where: { serviceId, isApproved: true },
      include: {
        customer: {
          select: {
            id: true,
            profile: { select: { name: true, avatar: true } },
          },
        },
        service: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where: { serviceId, isApproved: true } }),
    prisma.review.aggregate({
      where: { serviceId, isApproved: true },
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const averageRating = Math.round((aggregation._avg.rating ?? 0) * 10) / 10;
  const totalReviews = aggregation._count.rating;
  const totalPages = Math.ceil(total / limit);

  return {
    reviews,
    averageRating,
    totalReviews,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  };
};

// ── Get review for a specific order ───────────────────

export const getOrderReview = async (orderId: string, userId: string, userRole: UserRole): Promise<any> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { customerId: true, technicianId: true },
  });

  if (!order) {
    throw Object.assign(new Error('Order not found'), { statusCode: 404 });
  }

  // Only the customer, technician, or admin can view the review
  const isCustomer = order.customerId === userId;
  const isTechnician = order.technicianId === userId;
  const isAdmin = userRole === UserRole.ADMIN;

  if (!isCustomer && !isTechnician && !isAdmin) {
    throw Object.assign(new Error('Unauthorized'), { statusCode: 403 });
  }

  const review = await prisma.review.findUnique({
    where: { orderId },
    include: {
      customer: {
        select: {
          id: true,
          profile: { select: { name: true, avatar: true } },
        },
      },
      service: { select: { id: true, name: true } },
    },
  });

  return review;
};

// ── Check if order can be reviewed ────────────────────

export const canReviewOrder = async (orderId: string, customerId: string): Promise<boolean> => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: {
      customerId: true,
      status: true,
      paymentStatus: true,
      technicianId: true,
      review: { select: { id: true } },
    },
  });

  if (!order) return false;
  if (order.customerId !== customerId) return false;
  if (order.status !== OrderStatus.COMPLETED) return false;
  if (order.paymentStatus !== PaymentStatus.PAID) return false;
  if (!order.technicianId) return false;
  if (order.review) return false;

  return true;
};

// ── Get technician average rating ─────────────────────

export const getTechnicianRating = async (
  technicianId: string
): Promise<{ averageRating: number; totalReviews: number }> => {
  const result = await prisma.review.aggregate({
    where: { technicianId, isApproved: true },
    _avg: { rating: true },
    _count: { rating: true },
  });

  return {
    averageRating: Math.round((result._avg.rating ?? 0) * 10) / 10,
    totalReviews: result._count.rating,
  };
};

// ── Admin: List all reviews (with filters) ────────────

export interface AdminReviewFilters {
  search?: string;
  rating?: number;
  isApproved?: boolean;
  page?: number;
  limit?: number;
}

export const getAllReviews = async (filters: AdminReviewFilters = {}): Promise<any> => {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters.rating) {
    where.rating = filters.rating;
  }

  if (filters.isApproved !== undefined) {
    where.isApproved = filters.isApproved;
  }

  if (filters.search) {
    where.OR = [
      { comment: { contains: filters.search, mode: 'insensitive' } },
      { customer: { profile: { name: { contains: filters.search, mode: 'insensitive' } } } },
      { service: { name: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  const [reviews, total, aggregation] = await Promise.all([
    prisma.review.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, avatar: true } },
          },
        },
        technician: {
          select: {
            id: true,
            email: true,
            profile: { select: { name: true, avatar: true } },
          },
        },
        service: { select: { id: true, name: true } },
        order: { select: { id: true, totalAmount: true, completedAt: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.review.count({ where }),
    prisma.review.aggregate({
      _avg: { rating: true },
      _count: { rating: true },
    }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return {
    reviews,
    total,
    page,
    limit,
    totalPages,
    overallStats: {
      averageRating: Math.round((aggregation._avg.rating ?? 0) * 10) / 10,
      totalReviews: aggregation._count.rating,
    },
  };
};

// ── Admin: Toggle review approval ─────────────────────

export const toggleReviewApproval = async (id: string): Promise<any> => {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) {
    throw Object.assign(new Error('Review not found'), { statusCode: 404 });
  }

  return prisma.review.update({
    where: { id },
    data: { isApproved: !review.isApproved },
    include: {
      customer: {
        select: {
          id: true,
          profile: { select: { name: true, avatar: true } },
        },
      },
      service: { select: { id: true, name: true } },
    },
  });
};

// ── Admin: Delete a review ────────────────────────────

export const deleteReview = async (id: string): Promise<void> => {
  const review = await prisma.review.findUnique({ where: { id } });
  if (!review) {
    throw Object.assign(new Error('Review not found'), { statusCode: 404 });
  }

  await prisma.review.delete({ where: { id } });
};

// ── Public: Get latest approved reviews ───────────────

export const getLatestReviews = async (limit = 6): Promise<any[]> => {
  return prisma.review.findMany({
    where: { isApproved: true },
    include: {
      customer: {
        select: {
          id: true,
          profile: { select: { name: true, avatar: true } },
        },
      },
      service: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });
};
