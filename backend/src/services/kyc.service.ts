import prisma from '../config/database';
import { KYC, KYCStatus, DocumentType } from '@prisma/client';

export interface SubmitKYCData {
  technicianId: string;
  documentType: DocumentType;
  documentNumber: string;
  documentFront: string;
  documentBack: string;
  selfie: string;
}

export interface VerifyKYCData {
  status: KYCStatus;
  verifiedBy: string;
  rejectionReason?: string;
}

export interface KYCListFilters {
  status?: KYCStatus;
  page?: number;
  limit?: number;
}

export const submitKYC = async (data: SubmitKYCData): Promise<KYC> => {
  if (
    !data.documentType ||
    !data.documentNumber?.trim() ||
    !data.documentFront?.trim() ||
    !data.documentBack?.trim() ||
    !data.selfie?.trim()
  ) {
    throw new Error('All KYC documents are required');
  }

  // Check if user is a technician
  const user = await prisma.user.findUnique({
    where: { id: data.technicianId },
  });

  if (!user || user.role !== 'TECHNICIAN') {
    throw new Error('Only technicians can submit KYC');
  }

  // Check if KYC already exists
  const existingKYC = await prisma.kYC.findUnique({
    where: { technicianId: data.technicianId },
  });

  if (existingKYC && existingKYC.status === 'APPROVED') {
    throw new Error('KYC is already approved');
  }

  if (existingKYC && existingKYC.status === 'PENDING') {
    throw new Error('KYC submission is already pending review');
  }

  // Create or update KYC
  const kyc = await prisma.kYC.upsert({
    where: { technicianId: data.technicianId },
    update: {
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      documentFront: data.documentFront,
      documentBack: data.documentBack,
      selfie: data.selfie,
      status: 'PENDING',
      submittedAt: new Date(),
      rejectionReason: null,
    },
    create: {
      technicianId: data.technicianId,
      documentType: data.documentType,
      documentNumber: data.documentNumber,
      documentFront: data.documentFront,
      documentBack: data.documentBack,
      selfie: data.selfie,
      status: 'PENDING',
    },
    include: {
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

  // TODO: Emit socket notification to technician (socket service not implemented)
  // emitKYCNotification(data.technicianId, {
  //   type: 'KYC_SUBMITTED',
  //   kyc: {
  //     id: kyc.id,
  //     status: kyc.status,
  //     submittedAt: kyc.submittedAt,
  //   },
  //   message: 'Your KYC documents have been submitted and are pending review.',
  // });

  return kyc;
};

export const getKYCById = async (id: string): Promise<KYC | null> => {
  return prisma.kYC.findUnique({
    where: { id },
    include: {
      technician: {
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
      verifier: {
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
};

export const getKYCByTechnicianId = async (technicianId: string): Promise<KYC | null> => {
  return prisma.kYC.findUnique({
    where: { technicianId },
    include: {
      technician: {
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
      verifier: {
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
};

export const listKYCs = async (filters: KYCListFilters = {}): Promise<{
  kycs: KYC[];
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

  const [kycs, total] = await Promise.all([
    prisma.kYC.findMany({
      where,
      include: {
        technician: {
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
        verifier: {
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
      skip,
      take: limit,
      orderBy: { submittedAt: 'desc' },
    }),
    prisma.kYC.count({ where }),
  ]);

  return {
    kycs: kycs as any,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
};

export const verifyKYC = async (
  id: string,
  data: VerifyKYCData
): Promise<KYC> => {
  const kyc = await prisma.kYC.findUnique({
    where: { id },
  });

  if (!kyc) {
    throw new Error('KYC not found');
  }

  if (kyc.status !== 'PENDING') {
    throw new Error('KYC is not pending verification');
  }

  const updateData: any = {
    status: data.status,
    verifiedBy: data.verifiedBy,
    verifiedAt: new Date(),
  };

  if (data.status === 'REJECTED' && data.rejectionReason) {
    updateData.rejectionReason = data.rejectionReason;
  } else if (data.status === 'APPROVED') {
    updateData.rejectionReason = null;
  }

  const updatedKYC = await prisma.kYC.update({
    where: { id },
    data: updateData,
    include: {
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
      verifier: {
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

  // TODO: Emit socket notification to technician (socket service not implemented)
  // if (data.status === 'APPROVED') {
  //   emitKYCNotification(kyc.technicianId, {
  //     type: 'KYC_APPROVED',
  //     kyc: {
  //       id: updatedKYC.id,
  //       status: updatedKYC.status,
  //       verifiedAt: updatedKYC.verifiedAt,
  //     },
  //     message: 'Your KYC has been approved! You can now create services.',
  //   });
  // } else if (data.status === 'REJECTED') {
  //   emitKYCNotification(kyc.technicianId, {
  //     type: 'KYC_REJECTED',
  //     kyc: {
  //       id: updatedKYC.id,
  //       status: updatedKYC.status,
  //       rejectionReason: updatedKYC.rejectionReason,
  //       verifiedAt: updatedKYC.verifiedAt,
  //     },
  //     message: data.rejectionReason 
  //       ? `Your KYC has been rejected: ${data.rejectionReason}`
  //       : 'Your KYC has been rejected. Please resubmit with correct documents.',
  //   });
  // }

  return updatedKYC;
};

