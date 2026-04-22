import { getAllServices, ServiceFilters } from '../../service.service';
import prisma from '../../../config/database';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    service: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

type MockDb = {
  service: {
    findMany: jest.Mock;
    count: jest.Mock;
  };
};

const mockedPrisma = prisma as unknown as MockDb;

describe('service retrieval and filtering logic (customer view)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch all available services by default', async () => {
    const mockServices = [
      { id: 'svc-1', name: 'AC Repair', isActive: true },
      { id: 'svc-2', name: 'Plumbing', isActive: true },
    ];

    mockedPrisma.service.findMany.mockResolvedValue(mockServices);
    mockedPrisma.service.count.mockResolvedValue(2);

    const result = await getAllServices();

    expect(mockedPrisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: true },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
      })
    );
    expect(mockedPrisma.service.count).toHaveBeenCalledWith({
      where: { isActive: true },
    });

    expect(result).toEqual({
      services: mockServices,
      total: 2,
      page: 1,
      limit: 10,
      totalPages: 1,
    });
  });

  it('should apply category, search, price range and pagination filters', async () => {
    const filters: ServiceFilters = {
      categoryId: 'cat-1',
      search: 'clean',
      minPrice: 100,
      maxPrice: 500,
      page: 2,
      limit: 5,
    };

    mockedPrisma.service.findMany.mockResolvedValue([]);
    mockedPrisma.service.count.mockResolvedValue(0);

    await getAllServices(filters);

    expect(mockedPrisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          isActive: true,
          categoryId: 'cat-1',
          OR: [
            { name: { contains: 'clean', mode: 'insensitive' } },
            { description: { contains: 'clean', mode: 'insensitive' } },
          ],
          price: {
            gte: 100,
            lte: 500,
          },
        },
        skip: 5,
        take: 5,
      })
    );

    expect(mockedPrisma.service.count).toHaveBeenCalledWith({
      where: {
        isActive: true,
        categoryId: 'cat-1',
        OR: [
          { name: { contains: 'clean', mode: 'insensitive' } },
          { description: { contains: 'clean', mode: 'insensitive' } },
        ],
        price: {
          gte: 100,
          lte: 500,
        },
      },
    });
  });

  it('should allow inactive services filter when requested', async () => {
    mockedPrisma.service.findMany.mockResolvedValue([]);
    mockedPrisma.service.count.mockResolvedValue(0);

    await getAllServices({ isActive: 'false' });

    expect(mockedPrisma.service.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { isActive: false },
      })
    );
    expect(mockedPrisma.service.count).toHaveBeenCalledWith({
      where: { isActive: false },
    });
  });
});
