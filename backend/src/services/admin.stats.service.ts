import prisma from '../config/database';
import { OrderStatus, PaymentStatus, UserRole, KYCStatus } from '@prisma/client';

export const getPlatformStats = async (): Promise<any> => {
  const [
    totalUsers,
    totalCustomers,
    totalTechnicians,
    totalAdmins,
    activeUsers,
    totalOrders,
    pendingOrders,
    completedOrders,
    totalRevenue,
    platformRevenue,
    technicianEarnings,
    totalServices,
    activeServices,
    totalCategories,
    pendingKYCs,
    approvedKYCs,
    totalPayments,
    successfulPayments,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: UserRole.CUSTOMER } }),
    prisma.user.count({ where: { role: UserRole.TECHNICIAN } }),
    prisma.user.count({ where: { role: UserRole.ADMIN } }),
    prisma.user.count({ where: { isActive: true } }),
    prisma.order.count(),
    prisma.order.count({ where: { status: OrderStatus.PENDING } }),
    prisma.order.count({ where: { status: OrderStatus.COMPLETED } }),
    prisma.order.aggregate({
      where: { paymentStatus: PaymentStatus.PAID },
      _sum: { totalAmount: true },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: PaymentStatus.PAID },
      _sum: { platformAmount: true },
    }),
    prisma.order.aggregate({
      where: { paymentStatus: PaymentStatus.PAID },
      _sum: { technicianAmount: true },
    }),
    prisma.service.count(),
    prisma.service.count({ where: { isActive: true } }),
    prisma.category.count(),
    prisma.kYC.count({ where: { status: KYCStatus.PENDING } }),
    prisma.kYC.count({ where: { status: KYCStatus.APPROVED } }),
    prisma.payment.count(),
    prisma.payment.count({ where: { status: PaymentStatus.PAID } }),
  ]);

  return {
    users: {
      total: totalUsers,
      customers: totalCustomers,
      technicians: totalTechnicians,
      admins: totalAdmins,
      active: activeUsers,
    },
    orders: {
      total: totalOrders,
      pending: pendingOrders,
      completed: completedOrders,
    },
    revenue: {
      total: Number(totalRevenue._sum.totalAmount || 0),
      platform: Number(platformRevenue._sum.platformAmount || 0),
      technician: Number(technicianEarnings._sum.technicianAmount || 0),
    },
    services: {
      total: totalServices,
      active: activeServices,
    },
    categories: {
      total: totalCategories,
    },
    kyc: {
      pending: pendingKYCs,
      approved: approvedKYCs,
    },
    payments: {
      total: totalPayments,
      successful: successfulPayments,
      successRate: totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0,
    },
  };
};

export const getRevenueAnalytics = async (
  startDate?: Date,
  endDate?: Date
): Promise<any> => {
  const where: any = {
    paymentStatus: PaymentStatus.PAID,
  };

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  const [
    totalRevenue,
    platformRevenue,
    technicianEarnings,
    orders,
  ] = await Promise.all([
    prisma.order.aggregate({
      where,
      _sum: { totalAmount: true },
      _count: true,
    }),
    prisma.order.aggregate({
      where,
      _sum: { platformAmount: true },
    }),
    prisma.order.aggregate({
      where,
      _sum: { technicianAmount: true },
    }),
    prisma.order.findMany({
      where,
      select: {
        totalAmount: true,
        platformAmount: true,
        technicianAmount: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
  ]);

  // Calculate daily revenue manually
  const dailyRevenueMap = new Map<string, { revenue: number; orders: number }>();
  orders.forEach((order) => {
    const date = order.createdAt.toISOString().split('T')[0];
    const existing = dailyRevenueMap.get(date) || { revenue: 0, orders: 0 };
    dailyRevenueMap.set(date, {
      revenue: existing.revenue + Number(order.totalAmount),
      orders: existing.orders + 1,
    });
  });

  const dailyRevenue = Array.from(dailyRevenueMap.entries())
    .map(([date, data]) => ({
      date,
      revenue: data.revenue,
      orders: data.orders,
    }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);

  return {
    summary: {
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      platformRevenue: Number(platformRevenue._sum.platformAmount || 0),
      technicianEarnings: Number(technicianEarnings._sum.technicianAmount || 0),
      totalOrders: totalRevenue._count,
      averageOrderValue:
        totalRevenue._count > 0
          ? Number(totalRevenue._sum.totalAmount || 0) / totalRevenue._count
          : 0,
    },
    recentOrders: orders,
    dailyRevenue: dailyRevenue,
  };
};

export const getOrderAnalytics = async (
  startDate?: Date,
  endDate?: Date
): Promise<any> => {
  const where: any = {};

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  const [
    totalOrders,
    statusDistribution,
    paymentStatusDistribution,
    ordersByCategory,
  ] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.groupBy({
      by: ['status'],
      where,
      _count: true,
    }),
    prisma.order.groupBy({
      by: ['paymentStatus'],
      where,
      _count: true,
    }),
    prisma.order.groupBy({
      by: ['serviceId'],
      where,
      _count: true,
    }),
  ]);

  // Get category names for orders
  const categoryData = await Promise.all(
    ordersByCategory.map(async (item) => {
      const service = await prisma.service.findUnique({
        where: { id: item.serviceId },
        include: { category: true },
      });
      return {
        categoryId: service?.categoryId,
        categoryName: service?.category.name,
        count: item._count,
      };
    })
  );

  return {
    totalOrders,
    statusDistribution: statusDistribution.map((item) => ({
      status: item.status,
      count: item._count,
    })),
    paymentStatusDistribution: paymentStatusDistribution.map((item) => ({
      status: item.paymentStatus,
      count: item._count,
    })),
    ordersByCategory: categoryData,
  };
};

export const getUserGrowthAnalytics = async (
  startDate?: Date,
  endDate?: Date
): Promise<any> => {
  const where: any = {};

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = startDate;
    }
    if (endDate) {
      where.createdAt.lte = endDate;
    }
  }

  const [
    totalUsers,
    customers,
    technicians,
    allUsers,
  ] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.count({ where: { ...where, role: UserRole.CUSTOMER } }),
    prisma.user.count({ where: { ...where, role: UserRole.TECHNICIAN } }),
    prisma.user.findMany({
      where,
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 1000,
    }),
  ]);

  // Calculate daily growth manually
  const dailyGrowthMap = new Map<string, number>();
  allUsers.forEach((user) => {
    const date = user.createdAt.toISOString().split('T')[0];
    dailyGrowthMap.set(date, (dailyGrowthMap.get(date) || 0) + 1);
  });

  const dailyGrowth = Array.from(dailyGrowthMap.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 30);

  return {
    totalUsers,
    customers,
    technicians,
    dailyGrowth,
  };
};

export const getTechnicianPerformanceAnalytics = async (): Promise<any> => {
  const technicians = await prisma.user.findMany({
    where: { role: UserRole.TECHNICIAN },
    include: {
      technicianOrders: {
        where: { paymentStatus: PaymentStatus.PAID },
        select: {
          technicianAmount: true,
          status: true,
          completedAt: true,
        },
      },
      _count: {
        select: {
          technicianOrders: true,
        },
      },
    },
  });

  const techniciansWithProfile = await Promise.all(
    technicians.map(async (tech) => {
      const profile = await prisma.profile.findUnique({
        where: { userId: tech.id },
        select: { name: true },
      });
      return { ...tech, profile };
    })
  );

  const performance = techniciansWithProfile.map((tech) => {
    const completedOrders = tech.technicianOrders.filter(
      (o) => o.status === OrderStatus.COMPLETED
    );
    const totalEarnings = completedOrders.reduce(
      (sum, order) => sum + Number(order.technicianAmount || 0),
      0
    );

    return {
      technicianId: tech.id,
      email: tech.email,
      name: tech.profile?.name,
      totalOrders: tech._count.technicianOrders,
      completedOrders: completedOrders.length,
      totalEarnings,
      averageEarningsPerOrder:
        completedOrders.length > 0 ? totalEarnings / completedOrders.length : 0,
    };
  });

  return performance.sort((a, b) => b.totalEarnings - a.totalEarnings);
};

