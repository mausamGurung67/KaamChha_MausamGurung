import prisma from '../config/database';
import { ServiceRequest, ServiceRequestStatus, UserRole } from '@prisma/client';

export interface CreateServiceRequestData {
  title: string;
  description: string;
  category: string;
  budget?: number;
  location: string;
  customerId: string;
}

export interface ServiceRequestFilters {
  status?: ServiceRequestStatus;
  category?: string;
  search?: string;
  customerId?: string;
  assignedTechnicianId?: string;
  page?: number;
  limit?: number;
}

export const createServiceRequest = async (
  data: CreateServiceRequestData
): Promise<ServiceRequest> => {
  return prisma.serviceRequest.create({
    data: {
      title: data.title,
      description: data.description,
      category: data.category,
      budget: data.budget,
      location: data.location,
      customerId: data.customerId,
    },
    include: {
      customer: {
        select: {
          id: true,
          email: true,
          profile: {
            select: { name: true, avatar: true },
          },
        },
      },
    },
  });
};

export const getAllServiceRequests = async (
  filters: ServiceRequestFilters = {}
): Promise<{
  serviceRequests: ServiceRequest[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}> => {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const skip = (page - 1) * limit;

  const where: any = {};

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.category) {
    where.category = { contains: filters.category, mode: 'insensitive' };
  }

  if (filters.customerId) {
    where.customerId = filters.customerId;
  }

  if (filters.assignedTechnicianId) {
    where.assignedTechnicianId = filters.assignedTechnicianId;
  }

  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: 'insensitive' } },
      { description: { contains: filters.search, mode: 'insensitive' } },
      { category: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const [serviceRequests, total] = await Promise.all([
    prisma.serviceRequest.findMany({
      where,
      include: {
        customer: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { name: true, avatar: true },
            },
          },
        },
        assignedTechnician: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { name: true, avatar: true },
            },
          },
        },
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
    }),
    prisma.serviceRequest.count({ where }),
  ]);

  return {
    serviceRequests: serviceRequests as any,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const getServiceRequestById = async (
  id: string
): Promise<ServiceRequest | null> => {
  return prisma.serviceRequest.findUnique({
    where: { id },
    include: {
      customer: {
        select: {
          id: true,
          email: true,
          profile: {
            select: { name: true, avatar: true, phone: true, address: true },
          },
        },
      },
      assignedTechnician: {
        select: {
          id: true,
          email: true,
          profile: {
            select: { name: true, avatar: true, phone: true },
          },
        },
      },
    },
  }) as any;
};

export const getMyServiceRequests = async (
  customerId: string
): Promise<ServiceRequest[]> => {
  return prisma.serviceRequest.findMany({
    where: { customerId },
    include: {
      assignedTechnician: {
        select: {
          id: true,
          email: true,
          profile: {
            select: { name: true, avatar: true },
          },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
};

export const updateServiceRequestStatus = async (
  id: string,
  status: ServiceRequestStatus,
  userId: string,
  userRole: UserRole
): Promise<ServiceRequest> => {
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id },
  });

  if (!serviceRequest) {
    throw new Error('Service request not found');
  }

  // Only admin or the customer who created it can cancel
  if (status === ServiceRequestStatus.CANCELLED) {
    if (
      userRole !== UserRole.ADMIN &&
      serviceRequest.customerId !== userId
    ) {
      throw new Error('Unauthorized to cancel this service request');
    }
  }

  // Only admin can mark as completed
  if (status === ServiceRequestStatus.COMPLETED) {
    if (userRole !== UserRole.ADMIN && userRole !== UserRole.TECHNICIAN) {
      throw new Error('Unauthorized to complete this service request');
    }
  }

  return prisma.serviceRequest.update({
    where: { id },
    data: { status },
    include: {
      customer: {
        select: {
          id: true,
          email: true,
          profile: {
            select: { name: true, avatar: true },
          },
        },
      },
      assignedTechnician: {
        select: {
          id: true,
          email: true,
          profile: {
            select: { name: true, avatar: true },
          },
        },
      },
    },
  });
};

export const assignTechnician = async (
  id: string,
  technicianId: string,
  userId: string,
  userRole: UserRole
): Promise<ServiceRequest> => {
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id },
  });

  if (!serviceRequest) {
    throw new Error('Service request not found');
  }

  if (serviceRequest.status !== ServiceRequestStatus.OPEN) {
    throw new Error('Service request is not open for assignment');
  }

  // Only admin or the technician themselves can assign
  if (userRole === UserRole.TECHNICIAN && technicianId !== userId) {
    throw new Error('Technicians can only assign themselves');
  }

  if (userRole === UserRole.CUSTOMER) {
    throw new Error('Customers cannot assign technicians');
  }

  // Verify technician exists and has approved KYC
  const technician = await prisma.user.findUnique({
    where: { id: technicianId },
    include: { kyc: true },
  });

  if (!technician || technician.role !== UserRole.TECHNICIAN) {
    throw new Error('Invalid technician');
  }

  if (!technician.kyc || technician.kyc.status !== 'APPROVED') {
    throw new Error('Technician KYC not approved');
  }

  return prisma.serviceRequest.update({
    where: { id },
    data: {
      assignedTechnicianId: technicianId,
      status: ServiceRequestStatus.ASSIGNED,
    },
    include: {
      customer: {
        select: {
          id: true,
          email: true,
          profile: {
            select: { name: true, avatar: true },
          },
        },
      },
      assignedTechnician: {
        select: {
          id: true,
          email: true,
          profile: {
            select: { name: true, avatar: true },
          },
        },
      },
    },
  });
};

export const deleteServiceRequest = async (
  id: string,
  userId: string,
  userRole: UserRole
): Promise<void> => {
  const serviceRequest = await prisma.serviceRequest.findUnique({
    where: { id },
  });

  if (!serviceRequest) {
    throw new Error('Service request not found');
  }

  if (userRole !== UserRole.ADMIN && serviceRequest.customerId !== userId) {
    throw new Error('Unauthorized to delete this service request');
  }

  await prisma.serviceRequest.delete({
    where: { id },
  });
};
