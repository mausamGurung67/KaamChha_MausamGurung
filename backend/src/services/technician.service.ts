import prisma from '../config/database';
import { OrderStatus, PaymentStatus } from '@prisma/client';

export const getTechnicianDashboard = async (technicianId: string): Promise<any> => {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  // Get last 6 months for chart data
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

  const [
    totalOrders,
    pendingOrders,
    activeOrders,
    completedOrders,
    totalEarnings,
    thisMonthEarnings,
    recentOrders,
    kycStatus,
    averageRating,
    monthlyEarningsRaw,
    monthlyJobsRaw,
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
        status: {
          in: [OrderStatus.COMPLETED_BY_TECHNICIAN, OrderStatus.COMPLETED],
        },
      },
    }),
    prisma.order.aggregate({
      where: {
        technicianId,
        status: {
          in: [OrderStatus.COMPLETED_BY_TECHNICIAN, OrderStatus.COMPLETED],
        },
      },
      _sum: {
        technicianAmount: true,
      },
    }),
    // This month earnings
    prisma.order.aggregate({
      where: {
        technicianId,
        status: {
          in: [OrderStatus.COMPLETED_BY_TECHNICIAN, OrderStatus.COMPLETED],
        },
        completedAt: {
          gte: startOfMonth,
          lte: endOfMonth,
        },
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
    // Average rating
    prisma.review.aggregate({
      where: { technicianId },
      _avg: { rating: true },
      _count: { rating: true },
    }),
    // Monthly earnings for the last 6 months
    prisma.order.findMany({
      where: {
        technicianId,
        status: {
          in: [OrderStatus.COMPLETED_BY_TECHNICIAN, OrderStatus.COMPLETED],
        },
        completedAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        technicianAmount: true,
        completedAt: true,
      },
    }),
    // Monthly completed jobs for the last 6 months
    prisma.order.findMany({
      where: {
        technicianId,
        status: {
          in: [OrderStatus.COMPLETED_BY_TECHNICIAN, OrderStatus.COMPLETED],
        },
        completedAt: {
          gte: sixMonthsAgo,
        },
      },
      select: {
        completedAt: true,
      },
    }),
  ]);

  // Build monthly earnings chart data
  const monthlyData: { month: string; earnings: number; jobs: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' });

    const monthEarnings = monthlyEarningsRaw
      .filter((o) => {
        if (!o.completedAt) return false;
        const od = new Date(o.completedAt);
        return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
      })
      .reduce((sum, o) => sum + Number(o.technicianAmount || 0), 0);

    const monthJobs = monthlyJobsRaw.filter((o) => {
      if (!o.completedAt) return false;
      const od = new Date(o.completedAt);
      return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
    }).length;

    monthlyData.push({ month: monthLabel, earnings: monthEarnings, jobs: monthJobs });
  }

  return {
    stats: {
      totalOrders,
      pendingOrders,
      activeOrders,
      completedOrders,
      totalEarnings: Number(totalEarnings._sum.technicianAmount || 0),
      thisMonthEarnings: Number(thisMonthEarnings._sum.technicianAmount || 0),
      averageRating: averageRating._avg.rating ? Number(averageRating._avg.rating.toFixed(1)) : 0,
      totalReviews: averageRating._count.rating,
      kycStatus: kycStatus?.status || 'NOT_SUBMITTED',
    },
    recentOrders,
    monthlyData,
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

export const updateTechnicianProfile = async (
  technicianId: string,
  data: {
    name?: string;
    phone?: string;
    address?: string;
    avatar?: string;
  }
): Promise<any> => {
  const hasUpdatableField =
    data.name !== undefined ||
    data.phone !== undefined ||
    data.address !== undefined ||
    data.avatar !== undefined;

  if (!hasUpdatableField) {
    throw new Error('At least one profile field is required');
  }

  if (data.name !== undefined && data.name.trim().length < 2) {
    throw new Error('Name must be at least 2 characters');
  }

  if (data.phone !== undefined && !/^\d{10}$/.test(data.phone)) {
    throw new Error('Phone number must be exactly 10 digits');
  }

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
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const baseCompletedWhere = {
    technicianId,
    status: {
      in: [OrderStatus.COMPLETED_BY_TECHNICIAN, OrderStatus.COMPLETED],
    },
  };

  const [
    totalEarningsAgg,
    thisMonthEarningsAgg,
    completedPaymentsAgg,
    pendingPaymentsAgg,
    monthlyOrdersRaw,
    recentPayments,
  ] = await Promise.all([
    // Total earnings (all time)
    prisma.order.aggregate({
      where: baseCompletedWhere,
      _sum: { technicianAmount: true },
      _count: true,
    }),
    // This month earnings
    prisma.order.aggregate({
      where: {
        ...baseCompletedWhere,
        completedAt: { gte: startOfMonth, lte: endOfMonth },
      },
      _sum: { technicianAmount: true },
      _count: true,
    }),
    // Completed payments (PAID orders)
    prisma.order.aggregate({
      where: {
        technicianId,
        status: {
          in: [OrderStatus.COMPLETED_BY_TECHNICIAN, OrderStatus.COMPLETED],
        },
        paymentStatus: PaymentStatus.PAID,
      },
      _sum: { technicianAmount: true },
      _count: true,
    }),
    // Pending payments (completed but not yet paid)
    prisma.order.aggregate({
      where: {
        technicianId,
        status: {
          in: [OrderStatus.COMPLETED_BY_TECHNICIAN, OrderStatus.COMPLETED],
        },
        paymentStatus: PaymentStatus.PENDING,
      },
      _sum: { technicianAmount: true },
      _count: true,
    }),
    // Monthly data for last 12 months
    prisma.order.findMany({
      where: {
        ...baseCompletedWhere,
        completedAt: { gte: twelveMonthsAgo },
      },
      select: {
        technicianAmount: true,
        completedAt: true,
        paymentStatus: true,
      },
    }),
    // Recent payment transactions
    prisma.order.findMany({
      where: baseCompletedWhere,
      select: {
        id: true,
        totalAmount: true,
        technicianAmount: true,
        completedAt: true,
        paymentStatus: true,
        service: { select: { name: true } },
        customer: { select: { profile: { select: { name: true } } } },
      },
      orderBy: { completedAt: 'desc' },
      take: 10,
    }),
  ]);

  // Build monthly chart data (12 months)
  const monthlyChart: { month: string; earnings: number; jobs: number }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthLabel = d.toLocaleString('default', { month: 'short', year: 'numeric' });

    const monthEarnings = monthlyOrdersRaw
      .filter((o) => {
        if (!o.completedAt) return false;
        const od = new Date(o.completedAt);
        return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
      })
      .reduce((sum, o) => sum + Number(o.technicianAmount || 0), 0);

    const monthJobs = monthlyOrdersRaw.filter((o) => {
      if (!o.completedAt) return false;
      const od = new Date(o.completedAt);
      return od.getFullYear() === d.getFullYear() && od.getMonth() === d.getMonth();
    }).length;

    monthlyChart.push({ month: monthLabel, earnings: monthEarnings, jobs: monthJobs });
  }

  return {
    totalEarnings: Number(totalEarningsAgg._sum.technicianAmount || 0),
    totalCompletedOrders: totalEarningsAgg._count,
    thisMonthEarnings: Number(thisMonthEarningsAgg._sum.technicianAmount || 0),
    thisMonthOrders: thisMonthEarningsAgg._count,
    completedPayments: Number(completedPaymentsAgg._sum.technicianAmount || 0),
    completedPaymentCount: completedPaymentsAgg._count,
    pendingPayments: Number(pendingPaymentsAgg._sum.technicianAmount || 0),
    pendingPaymentCount: pendingPaymentsAgg._count,
    monthlyChart,
    recentPayments,
  };
};

