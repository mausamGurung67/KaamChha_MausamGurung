import { DocumentType, KYCStatus, UserRole } from '@prisma/client';
import { submitKYC, verifyKYC } from '../../kyc.service';
import prisma from '../../../config/database';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    kYC: {
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
  },
}));

type MockDb = {
  user: {
    findUnique: jest.Mock;
  };
  kYC: {
    findUnique: jest.Mock;
    upsert: jest.Mock;
    update: jest.Mock;
  };
};

const mockedPrisma = prisma as unknown as MockDb;

describe('kyc logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject submission when KYC documents are missing', async () => {
    await expect(
      submitKYC({
        technicianId: 'tech-1',
        documentType: DocumentType.CITIZENSHIP,
        documentNumber: '1234567890',
        documentFront: '',
        documentBack: 'https://img.example/back.jpg',
        selfie: 'https://img.example/selfie.jpg',
      })
    ).rejects.toThrow('All KYC documents are required');

    expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockedPrisma.kYC.upsert).not.toHaveBeenCalled();
  });

  it('should verify KYC status from PENDING to APPROVED by admin', async () => {
    const pendingKyc = {
      id: 'kyc-1',
      technicianId: 'tech-1',
      documentType: DocumentType.CITIZENSHIP,
      documentNumber: '1234567890',
      documentFront: 'front-url',
      documentBack: 'back-url',
      selfie: 'selfie-url',
      status: KYCStatus.PENDING,
      verifiedBy: null,
      verifiedAt: null,
      rejectionReason: null,
      submittedAt: new Date('2026-01-01T00:00:00.000Z'),
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-01T00:00:00.000Z'),
    };

    const approvedKyc = {
      ...pendingKyc,
      status: KYCStatus.APPROVED,
      verifiedBy: 'admin-1',
      verifiedAt: new Date('2026-01-02T00:00:00.000Z'),
      technician: {
        id: 'tech-1',
        email: 'tech@example.com',
        profile: { name: 'Tech One' },
      },
      verifier: {
        id: 'admin-1',
        email: 'admin@example.com',
        profile: { name: 'Admin One' },
      },
    };

    mockedPrisma.kYC.findUnique.mockResolvedValue(pendingKyc);
    mockedPrisma.kYC.update.mockResolvedValue(approvedKyc);

    const result = await verifyKYC('kyc-1', {
      status: KYCStatus.APPROVED,
      verifiedBy: 'admin-1',
    });

    expect(mockedPrisma.kYC.findUnique).toHaveBeenCalledWith({ where: { id: 'kyc-1' } });
    expect(mockedPrisma.kYC.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'kyc-1' },
        data: expect.objectContaining({
          status: KYCStatus.APPROVED,
          verifiedBy: 'admin-1',
          rejectionReason: null,
        }),
      })
    );

    expect(result).toEqual(approvedKyc);
  });
});
