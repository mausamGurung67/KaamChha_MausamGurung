import {
  assignTechnician,
  createServiceRequest,
  CreateServiceRequestData,
  getMyServiceRequests,
} from '../../serviceRequest.service';
import prisma from '../../../config/database';
import { ServiceRequestStatus, UserRole } from '@prisma/client';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    serviceRequest: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

type MockDb = {
  serviceRequest: {
    create: jest.Mock;
    findMany: jest.Mock;
    findUnique: jest.Mock;
    update: jest.Mock;
  };
  user: {
    findUnique: jest.Mock;
  };
};

const mockedPrisma = prisma as unknown as MockDb;

describe('custom service submission logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should validate missing fields', async () => {
    const payload = {
      title: '',
      description: 'Need urgent service',
      category: '',
      location: '',
      customerId: 'customer-1',
    } as CreateServiceRequestData;

    await expect(createServiceRequest(payload)).rejects.toThrow(
      'Missing required custom service fields'
    );

    expect(mockedPrisma.serviceRequest.create).not.toHaveBeenCalled();
  });

  it('should validate invalid location input', async () => {
    const payload: CreateServiceRequestData = {
      title: 'Need custom plumbing work',
      description: 'Pipe leakage fix and fittings replacement',
      category: 'Plumbing',
      location: 'Koteshwor, Kathmandu',
      latitude: 95,
      longitude: 85.32,
      customerId: 'customer-1',
    };

    await expect(createServiceRequest(payload)).rejects.toThrow('Invalid location input');

    expect(mockedPrisma.serviceRequest.create).not.toHaveBeenCalled();
  });

  it('should create valid custom service submission', async () => {
    const payload: CreateServiceRequestData = {
      title: 'Carpet deep cleaning',
      description: 'Need deep cleaning for 3 bedroom carpets',
      category: 'Cleaning',
      budget: 3500,
      location: 'Boudha, Kathmandu',
      latitude: 27.7215,
      longitude: 85.362,
      images: ['https://img.example/room1.jpg'],
      preferredDate: '2026-04-10',
      preferredTime: '10:30 AM',
      customerId: 'customer-1',
    };

    const createdRequest = {
      id: 'sr-1',
      ...payload,
      status: ServiceRequestStatus.OPEN,
      customer: {
        id: 'customer-1',
        email: 'customer@example.com',
        profile: { name: 'Customer One', avatar: null },
      },
    };

    mockedPrisma.serviceRequest.create.mockResolvedValue(createdRequest);

    const result = await createServiceRequest(payload);

    expect(mockedPrisma.serviceRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: payload.title,
          description: payload.description,
          category: payload.category,
          location: payload.location,
          latitude: payload.latitude,
          longitude: payload.longitude,
          customerId: payload.customerId,
        }),
      })
    );
    expect(result).toEqual(createdRequest);
  });

  it('should display service request and route it to technician by assignment', async () => {
    const listedRequests = [
      {
        id: 'sr-2',
        title: 'Door lock replacement',
        customerId: 'customer-2',
        status: ServiceRequestStatus.OPEN,
      },
    ];

    mockedPrisma.serviceRequest.findMany.mockResolvedValue(listedRequests);

    const myRequests = await getMyServiceRequests('customer-2');

    expect(mockedPrisma.serviceRequest.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { customerId: 'customer-2' } })
    );
    expect(myRequests).toEqual(listedRequests);

    mockedPrisma.serviceRequest.findUnique.mockResolvedValue({
      id: 'sr-2',
      customerId: 'customer-2',
      status: ServiceRequestStatus.OPEN,
    });
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'tech-1',
      role: UserRole.TECHNICIAN,
      kyc: { status: 'APPROVED' },
    });

    const assignedRequest = {
      id: 'sr-2',
      assignedTechnicianId: 'tech-1',
      status: ServiceRequestStatus.ASSIGNED,
    };

    mockedPrisma.serviceRequest.update.mockResolvedValue(assignedRequest);

    const result = await assignTechnician('sr-2', 'tech-1', 'admin-1', UserRole.ADMIN);

    expect(mockedPrisma.serviceRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'sr-2' },
        data: {
          assignedTechnicianId: 'tech-1',
          status: ServiceRequestStatus.ASSIGNED,
        },
      })
    );
    expect(result).toEqual(assignedRequest);
  });

  it('should reject assignment when customer attempts to assign technician', async () => {
    mockedPrisma.serviceRequest.findUnique.mockResolvedValue({
      id: 'sr-cust-1',
      customerId: 'customer-1',
      status: ServiceRequestStatus.OPEN,
    });

    await expect(
      assignTechnician('sr-cust-1', 'tech-1', 'customer-1', UserRole.CUSTOMER)
    ).rejects.toThrow('Customers cannot assign technicians');

    expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
    expect(mockedPrisma.serviceRequest.update).not.toHaveBeenCalled();
  });

  it('should reject assignment when technician KYC is not approved', async () => {
    mockedPrisma.serviceRequest.findUnique.mockResolvedValue({
      id: 'sr-kyc-1',
      customerId: 'customer-1',
      status: ServiceRequestStatus.OPEN,
    });
    mockedPrisma.user.findUnique.mockResolvedValue({
      id: 'tech-kyc-1',
      role: UserRole.TECHNICIAN,
      kyc: { status: 'PENDING' },
    });

    await expect(
      assignTechnician('sr-kyc-1', 'tech-kyc-1', 'admin-1', UserRole.ADMIN)
    ).rejects.toThrow('Technician KYC not approved');

    expect(mockedPrisma.serviceRequest.update).not.toHaveBeenCalled();
  });
});
