import prisma from '../config/database';
import { OrderStatus, PaymentStatus, AvailabilityStatus } from '@prisma/client';

export const getTechnicianDashboard = async (technicianId: string): Promise<any> => {
  const [
    totalOrders,
    pendingOrders,
    activeOrders,
    completedOrders,
    totalEarnings,
    recentOrders,
    kycStatus,
    availability,
  ] = await Promise.all([
    prisma.order.count({
      where: { technicianId },
    }),
    prisma.order.count({
      where: {
        technicianId,
        status: OrderStatus.ASSIGNED,
      },
    }),
    prisma.order.count({
      where: {
        technicianId,
        status: OrderStatus.IN_PROGRESS,
      },
    }),
    prisma.order.count({
      where: {
        technicianId,
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
      },
    }),
    prisma.order.aggregate({
      where: {
        technicianId,
        status: OrderStatus.COMPLETED,
        paymentStatus: PaymentStatus.PAID,
      },
      _sum: {
        technicianAmount: true,
      },
    }),
    prisma.order.findMany({
      where: { technicianId },
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
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.kYC.findUnique({
      where: { technicianId },
      select: {
        status: true,
      },
    }),
    prisma.availability.findUnique({
      where: { technicianId },
    }),
  ]);

  return {
    stats: {
      totalOrders,
      pendingOrders,
      activeOrders,
      completedOrders,
      totalEarnings: Number(totalEarnings._sum.technicianAmount || 0),
      kycStatus: kycStatus?.status || 'NOT_SUBMITTED',
      availabilityStatus: availability?.status || AvailabilityStatus.UNAVAILABLE,
    },
    recentOrders,
  };
};

export const getTechnicianProfile = async (technicianId: string): Promise<any> => {
  const user = await prisma.user.findUnique({
    where: { id: technicianId },
    include: {
      profile: true,
      kyc: true,
      _count: {
        select: {
          technicianOrders: true,
          createdServices: true,
        },
      },
    },
  });

  if (!user) {
    return null;
  }

  const { password, ...userWithoutPassword } = user;
  return userWithoutPassword;
};

export const getAvailability = async (technicianId: string) => {
  const availability = await prisma.availability.findUnique({ where: { technicianId } });
  if (availability) return availability;

  return prisma.availability.create({
    data: {
      technicianId,
    },
  });
};

export const updateAvailability = async (
  technicianId: string,
  status: AvailabilityStatus,
  reason?: string
) => {
  return prisma.availability.upsert({
    where: { technicianId },
    update: {
      status,
      reason: status === AvailabilityStatus.UNAVAILABLE ? reason ?? null : null,
    },
    create: {
      technicianId,
      status,
      reason: status === AvailabilityStatus.UNAVAILABLE ? reason ?? null : null,
    },
  });
};

export const updateTechnicianProfile = async (
  technicianId: string,
  data: {
    name?: string;
    phone?: string;
    address?: string;
    avatar?: string;
  }
): Promise<any> => {
  return prisma.profile.upsert({
    where: { userId: technicianId },
    update: data,
    create: {
      userId: technicianId,
      ...data,
    },
  });
};

export const getTechnicianEarnings = async (
  technicianId: string,
  startDate?: Date,
  endDate?: Date
): Promise<any> => {
  const where: any = {
    technicianId,
    status: OrderStatus.COMPLETED,
    paymentStatus: PaymentStatus.PAID,
  };

  if (startDate || endDate) {
    where.completedAt = {};
    if (startDate) {
      where.completedAt.gte = startDate;
    }
    if (endDate) {
      where.completedAt.lte = endDate;
    }
  }

  const [earnings, orders] = await Promise.all([
    prisma.order.aggregate({
      where,
      _sum: {
        technicianAmount: true,
      },
      _count: true,
    }),
    prisma.order.findMany({
      where,
      select: {
        id: true,
        totalAmount: true,
        technicianAmount: true,
        completedAt: true,
        service: {
          select: {
            name: true,
          },
        },
      },
      orderBy: { completedAt: 'desc' },
    }),
  ]);

  return {
    totalEarnings: Number(earnings._sum.technicianAmount || 0),
    totalOrders: earnings._count,
    orders,
  };
};

