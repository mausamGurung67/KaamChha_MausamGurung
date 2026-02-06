import prisma from '../config/database';
import { UserRole, User } from '@prisma/client';
import { getPaginationParams, createPaginationResponse } from '../utils/pagination.util';

export interface UserListFilters {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface TechnicianListFilters {
  kycStatus?: 'PENDING' | 'APPROVED' | 'REJECTED';
  isActive?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export const listUsers = async (filters: UserListFilters = {}): Promise<{
  users: any[];
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

  if (filters.role) {
    where.role = filters.role;
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.search) {
    where.OR = [
      { email: { contains: filters.search, mode: 'insensitive' } },
      { profile: { name: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      include: {
        profile: true,
        kyc: true,
        _count: {
          select: {
            orders: true,
            technicianOrders: true,
            createdServices: true,
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  // Remove password from response
  const usersWithoutPassword = users.map(({ password, ...user }) => user);

  const paginationResult = createPaginationResponse(usersWithoutPassword, total, page, limit);
  return {
    users: paginationResult.data,
    pagination: paginationResult.pagination,
  };
};

export const getUserById = async (id: string): Promise<any> => {
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      profile: true,
      kyc: true,
      orders: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      technicianOrders: {
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          service: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
      createdServices: {
        take: 10,
        orderBy: { createdAt: 'desc' },
      },
      _count: {
        select: {
          orders: true,
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

export const updateUser = async (
  id: string,
  data: {
    isActive?: boolean;
    isLocked?: boolean;
    role?: UserRole;
  }
): Promise<User> => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const updateData: any = {};

  if (data.isActive !== undefined) {
    updateData.isActive = data.isActive;
  }

  if (data.isLocked !== undefined) {
    updateData.isLocked = data.isLocked;
    if (!data.isLocked) {
      updateData.lockedUntil = null;
      updateData.loginAttempts = 0;
      updateData.otpAttempts = 0;
    }
  }

  if (data.role !== undefined) {
    updateData.role = data.role;
  }

  return prisma.user.update({
    where: { id },
    data: updateData,
  });
};

export const unlockUser = async (id: string): Promise<User> => {
  return updateUser(id, {
    isLocked: false,
  });
};

export const deleteUser = async (id: string): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Check if user has active orders
  const activeOrders = await prisma.order.count({
    where: {
      OR: [
        { customerId: id, status: { not: 'COMPLETED' } },
        { technicianId: id, status: { not: 'COMPLETED' } },
      ],
    },
  });

  if (activeOrders > 0) {
    throw new Error('Cannot delete user with active orders');
  }

  await prisma.user.delete({
    where: { id },
  });
};

export const listTechnicians = async (filters: TechnicianListFilters = {}): Promise<{
  technicians: any[];
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

  const where: any = {
    role: UserRole.TECHNICIAN,
  };

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.kycStatus) {
    where.kyc = {
      status: filters.kycStatus,
    };
  }

  if (filters.search) {
    where.OR = [
      { email: { contains: filters.search, mode: 'insensitive' } },
      { profile: { name: { contains: filters.search, mode: 'insensitive' } } },
    ];
  }

  const [technicians, total] = await Promise.all([
    prisma.user.findMany({
      where,
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
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);

  // Remove password from response
  const techniciansWithoutPassword = technicians.map(({ password, ...tech }) => tech);

  const paginationResult = createPaginationResponse(techniciansWithoutPassword, total, page, limit);
  return {
    technicians: paginationResult.data,
    pagination: paginationResult.pagination,
  };
};

export const getTechnicianStats = async (): Promise<any> => {
  const [
    totalTechnicians,
    activeTechnicians,
    pendingKYC,
    approvedKYC,
    rejectedKYC,
  ] = await Promise.all([
    prisma.user.count({
      where: { role: UserRole.TECHNICIAN },
    }),
    prisma.user.count({
      where: { role: UserRole.TECHNICIAN, isActive: true },
    }),
    prisma.kYC.count({
      where: { status: 'PENDING' },
    }),
    prisma.kYC.count({
      where: { status: 'APPROVED' },
    }),
    prisma.kYC.count({
      where: { status: 'REJECTED' },
    }),
  ]);

  return {
    totalTechnicians,
    activeTechnicians,
    inactiveTechnicians: totalTechnicians - activeTechnicians,
    pendingKYC,
    approvedKYC,
    rejectedKYC,
  };
};

