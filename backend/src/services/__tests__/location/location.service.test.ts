import prisma from '../../../config/database';
import {
  updateUserLocation,
  findNearbyTechnicians,
  getLocationHistory,
} from '../../location.service';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    profile: {
      upsert: jest.fn(),
    },
    locationHistory: {
      create: jest.fn(),
      findMany: jest.fn(),
    },
    user: {
      findMany: jest.fn(),
    },
  },
}));

type MockDb = {
  profile: {
    upsert: jest.Mock;
  };
  locationHistory: {
    create: jest.Mock;
    findMany: jest.Mock;
  };
  user: {
    findMany: jest.Mock;
  };
};

const mockedPrisma = prisma as unknown as MockDb;

describe('location.service core behavior', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('updateUserLocation should upsert profile location and store location history', async () => {
    mockedPrisma.profile.upsert.mockResolvedValue({ id: 'profile-1' });
    mockedPrisma.locationHistory.create.mockResolvedValue({ id: 'loc-1' });

    await updateUserLocation('user-1', { latitude: 27.7172, longitude: 85.324 });

    expect(mockedPrisma.profile.upsert).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
      update: {
        latitude: 27.7172,
        longitude: 85.324,
        lastLocationUpdate: expect.any(Date),
      },
      create: {
        userId: 'user-1',
        latitude: 27.7172,
        longitude: 85.324,
        lastLocationUpdate: expect.any(Date),
      },
    });

    expect(mockedPrisma.locationHistory.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        latitude: 27.7172,
        longitude: 85.324,
      },
    });
  });

  it('findNearbyTechnicians should filter by radius and sort nearest first', async () => {
    mockedPrisma.user.findMany.mockResolvedValue([
      {
        id: 'tech-near-1',
        role: 'TECHNICIAN',
        isActive: true,
        profile: { latitude: 27.718, longitude: 85.3245 },
        kyc: { status: 'APPROVED' },
      },
      {
        id: 'tech-far',
        role: 'TECHNICIAN',
        isActive: true,
        profile: { latitude: 28.2096, longitude: 83.9856 },
        kyc: { status: 'APPROVED' },
      },
      {
        id: 'tech-near-2',
        role: 'TECHNICIAN',
        isActive: true,
        profile: { latitude: 27.7301, longitude: 85.3311 },
        kyc: { status: 'APPROVED' },
      },
      {
        id: 'tech-no-coords',
        role: 'TECHNICIAN',
        isActive: true,
        profile: { latitude: null, longitude: null },
        kyc: { status: 'APPROVED' },
      },
    ]);

    const result = await findNearbyTechnicians(27.7172, 85.324, 10);

    expect(mockedPrisma.user.findMany).toHaveBeenCalledWith({
      where: {
        role: 'TECHNICIAN',
        isActive: true,
        profile: {
          latitude: { not: null },
          longitude: { not: null },
        },
      },
      include: {
        profile: true,
        kyc: true,
      },
    });

    expect(result).toHaveLength(2);
    expect(result[0].id).toBe('tech-near-1');
    expect(result[1].id).toBe('tech-near-2');
    expect(typeof result[0].distance).toBe('number');
  });

  it('getLocationHistory should return latest entries with default limit', async () => {
    mockedPrisma.locationHistory.findMany.mockResolvedValue([{ id: 'h-1' }, { id: 'h-2' }]);

    const result = await getLocationHistory('user-22');

    expect(mockedPrisma.locationHistory.findMany).toHaveBeenCalledWith({
      where: { userId: 'user-22' },
      orderBy: { timestamp: 'desc' },
      take: 50,
    });
    expect(result).toEqual([{ id: 'h-1' }, { id: 'h-2' }]);
  });

  it('getLocationHistory should respect custom limit', async () => {
    mockedPrisma.locationHistory.findMany.mockResolvedValue([{ id: 'h-3' }]);

    await getLocationHistory('user-23', 10);

    expect(mockedPrisma.locationHistory.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId: 'user-23' },
        take: 10,
      })
    );
  });
});
