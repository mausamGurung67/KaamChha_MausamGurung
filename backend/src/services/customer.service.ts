import prisma from '../config/database';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export const getCustomerDashboard = async (customerId: string): Promise<any> => {
  const [
    totalOrders,
    pendingOrders,
    activeOrders,
    completedOrders,
    totalSpent,
    recentOrders,
  ] = await Promise.all([
    prisma.order.count({
      where: { customerId },
    }),
    prisma.order.count({
      where: {
        customerId,
        status: OrderStatus.PENDING,
      },
    }),
    prisma.order.count({
      where: {
        customerId,
        status: {
          in: [OrderStatus.CONFIRMED, OrderStatus.ASSIGNED, OrderStatus.IN_PROGRESS],
        },
      },
    }),
    prisma.order.count({
      where: {
        customerId,
        status: OrderStatus.COMPLETED,
      },
    }),
    prisma.order.aggregate({
      where: {
        customerId,
        paymentStatus: PaymentStatus.PAID,
      },
      _sum: {
        totalAmount: true,
      },
    }),
    prisma.order.findMany({
      where: { customerId },
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
        technician: {
          select: {
            id: true,
            profile: {
              select: {
                name: true,
                avatar: true,
              },
            },
          },
        },
      },
      take: 5,
      orderBy: { createdAt: 'desc' },
    }),
  ]);

  return {
    stats: {
      totalOrders,
      pendingOrders,
      activeOrders,
      completedOrders,
      totalSpent: Number(totalSpent._sum.totalAmount || 0),
    },
    recentOrders,
  };
};

export const getCustomerProfile = async (customerId: string): Promise<any> => {
  const user = await prisma.user.findUnique({
    where: { id: customerId },
    include: {
      profile: true,
      _count: {
        select: {
          orders: true,
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

export const updateCustomerProfile = async (
  customerId: string,
  data: {
    name?: string;
    phone?: string;
    address?: string;
    avatar?: string;
  }
): Promise<any> => {
  return prisma.profile.upsert({
    where: { userId: customerId },
    update: data,
    create: {
      userId: customerId,
      ...data,
    },
  });
};

