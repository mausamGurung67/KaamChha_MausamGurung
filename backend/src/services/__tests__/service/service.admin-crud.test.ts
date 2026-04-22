import { UserRole } from '@prisma/client';
import {
  createSystemService,
  updateSystemService,
  deleteSystemService,
  CreateServiceData,
  createService,
  updateService,
} from '../../service.service';
import prisma from '../../../config/database';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    category: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    service: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

type MockDb = {
  category: {
    findUnique: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
  };
  service: {
    create: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
    delete: jest.Mock;
  };
};

const mockedPrisma = prisma as unknown as MockDb;

describe('admin-controlled service CRUD', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should allow admin to create system service', async () => {
    const payload: CreateServiceData = {
      categoryId: 'cat-1',
      name: 'System Plumbing Service',
      description: 'Admin posted standard plumbing package',
      price: 2500,
      duration: 90,
      createdBy: 'admin-1',
    };

    mockedPrisma.category.findUnique.mockResolvedValue({ id: 'cat-1', isActive: true });
    mockedPrisma.user.findUnique.mockResolvedValue({ id: 'admin-1', role: UserRole.ADMIN });
    mockedPrisma.service.create.mockResolvedValue({ id: 'service-1', ...payload });

    const result = await createSystemService(payload, UserRole.ADMIN);

    expect(mockedPrisma.service.create).toHaveBeenCalledWith({ data: payload });
    expect(result).toEqual({ id: 'service-1', ...payload });
  });

  it('should allow admin to update system service', async () => {
    mockedPrisma.service.findUnique.mockResolvedValue({ id: 'service-1', createdBy: 'admin-1' });
    mockedPrisma.service.update.mockResolvedValue({ id: 'service-1', name: 'Updated Name' });

    const result = await updateSystemService(
      'service-1',
      { name: 'Updated Name' },
      'admin-1',
      UserRole.ADMIN
    );

    expect(mockedPrisma.service.update).toHaveBeenCalledWith({
      where: { id: 'service-1' },
      data: { name: 'Updated Name' },
    });
    expect(result).toEqual({ id: 'service-1', name: 'Updated Name' });
  });

  it('should allow admin to delete system service', async () => {
    mockedPrisma.service.findUnique.mockResolvedValue({ id: 'service-1', createdBy: 'admin-1' });
    mockedPrisma.service.delete.mockResolvedValue({ id: 'service-1' });

    await deleteSystemService('service-1', 'admin-1', UserRole.ADMIN);

    expect(mockedPrisma.service.delete).toHaveBeenCalledWith({ where: { id: 'service-1' } });
  });

  it('should reject non-admin from service CRUD operations', async () => {
    const payload: CreateServiceData = {
      categoryId: 'cat-1',
      name: 'Not allowed service',
      price: 1000,
      duration: 60,
      createdBy: 'user-1',
    };

    await expect(createSystemService(payload, UserRole.TECHNICIAN)).rejects.toThrow(
      'Only admin can create system services'
    );
    await expect(
      updateSystemService('service-1', { name: 'Denied' }, 'user-1', UserRole.CUSTOMER)
    ).rejects.toThrow('Only admin can update system services');
    await expect(deleteSystemService('service-1', 'user-1', UserRole.TECHNICIAN)).rejects.toThrow(
      'Only admin can delete system services'
    );

    expect(mockedPrisma.service.create).not.toHaveBeenCalled();
    expect(mockedPrisma.service.update).not.toHaveBeenCalled();
    expect(mockedPrisma.service.delete).not.toHaveBeenCalled();
  });

  it('should reject service creation when technician KYC is not approved', async () => {
    const payload: CreateServiceData = {
      categoryId: 'cat-2',
      name: 'Technician Service',
      description: 'Technician custom service',
      price: 1600,
      duration: 75,
      createdBy: 'tech-2',
    };

    mockedPrisma.category.findUnique.mockResolvedValue({ id: 'cat-2', isActive: true });
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'tech-2',
      role: UserRole.TECHNICIAN,
      kyc: { status: 'PENDING' },
    });

    await expect(createService(payload)).rejects.toThrow('KYC verification required to create services');

    expect(mockedPrisma.service.create).not.toHaveBeenCalled();
  });

  it('should reject service update when user is not owner or admin', async () => {
    mockedPrisma.service.findUnique.mockResolvedValue({ id: 'service-77', createdBy: 'owner-77' });

    await expect(
      updateService('service-77', { name: 'Hacked Name' }, 'intruder-77', UserRole.CUSTOMER)
    ).rejects.toThrow('Unauthorized to update this service');

    expect(mockedPrisma.service.update).not.toHaveBeenCalled();
  });
});
