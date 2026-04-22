import prisma from '../config/database';
import { Service, UserRole } from '@prisma/client';

export interface CreateServiceData {
  categoryId: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  image?: string;
  images?: string[];
  inclusions?: string[];
  serviceRadius?: number;
  createdBy: string;
}

export interface UpdateServiceData {
  categoryId?: string;
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  image?: string;
  images?: string[];
  inclusions?: string[];
  isActive?: boolean;
  serviceRadius?: number;
}

export interface ServiceFilters {
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  isActive?: string; // 'true', 'false', or 'all'
  page?: number;
  limit?: number;
}

export const createService = async (data: CreateServiceData): Promise<Service> => {
  // Verify category exists
  const category = await prisma.category.findUnique({
    where: { id: data.categoryId },
  });

  if (!category) {
    throw new Error('Category not found');
  }

  if (!category.isActive) {
    throw new Error('Category is not active');
  }

  // For technicians, check KYC status
  const user = await prisma.user.findUnique({
    where: { id: data.createdBy },
    include: { kyc: true },
  });

  if (user?.role === UserRole.TECHNICIAN) {
    if (!user.kyc || user.kyc.status !== 'APPROVED') {
      throw new Error('KYC verification required to create services');
    }
  }

  return prisma.service.create({
    data,
  });
};

export const getAllServices = async (filters: ServiceFilters = {}): Promise<{
  services: Service[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;

  const where: any = {};

  // Default to active-only unless 'all' is passed
  if (filters.isActive === 'all') {
    // no filter
  } else if (filters.isActive === 'false') {
    where.isActive = false;
  } else {
    where.isActive = true;
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    where.price = {};
    if (filters.minPrice !== undefined) {
      where.price.gte = filters.minPrice;
    }
    if (filters.maxPrice !== undefined) {
      where.price.lte = filters.maxPrice;
    }
  }

  const [services, total] = await Promise.all([
    prisma.service.findMany({
      where,
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
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.service.count({ where }),
  ]);

  return {
    services: services as any,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getServiceById = async (id: string): Promise<Service | null> => {
  return prisma.service.findUnique({
    where: { id },
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
  }) as any;
};

export const getServicesByCreator = async (creatorId: string): Promise<Service[]> => {
  return prisma.service.findMany({
    where: { createdBy: creatorId },
    include: {
      category: true,
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateService = async (
  id: string,
  data: UpdateServiceData,
  userId: string,
  userRole: UserRole
): Promise<Service> => {
  const service = await prisma.service.findUnique({
    where: { id },
  });

  if (!service) {
    throw new Error('Service not found');
  }

  // Only admin or service creator can update
  if (userRole !== UserRole.ADMIN && service.createdBy !== userId) {
    throw new Error('Unauthorized to update this service');
  }

  if (data.categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category || !category.isActive) {
      throw new Error('Category not found or not active');
    }
  }

  return prisma.service.update({
    where: { id },
    data,
  });
};

export const deleteService = async (
  id: string,
  userId: string,
  userRole: UserRole
): Promise<void> => {
  const service = await prisma.service.findUnique({
    where: { id },
  });

  if (!service) {
    throw new Error('Service not found');
  }

  // Only admin or service creator can delete
  if (userRole !== UserRole.ADMIN && service.createdBy !== userId) {
    throw new Error('Unauthorized to delete this service');
  }

  await prisma.service.delete({
    where: { id },
  });
};

export const createSystemService = async (
  data: CreateServiceData,
  userRole: UserRole
): Promise<Service> => {
  if (userRole !== UserRole.ADMIN) {
    throw new Error('Only admin can create system services');
  }

  return createService(data);
};

export const updateSystemService = async (
  id: string,
  data: UpdateServiceData,
  userId: string,
  userRole: UserRole
): Promise<Service> => {
  if (userRole !== UserRole.ADMIN) {
    throw new Error('Only admin can update system services');
  }

  return updateService(id, data, userId, userRole);
};

export const deleteSystemService = async (
  id: string,
  userId: string,
  userRole: UserRole
): Promise<void> => {
  if (userRole !== UserRole.ADMIN) {
    throw new Error('Only admin can delete system services');
  }

  return deleteService(id, userId, userRole);
};

