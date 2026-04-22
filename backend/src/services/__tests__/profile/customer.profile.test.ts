import { updateCustomerProfile } from '../../customer.service';
import prisma from '../../../config/database';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    profile: {
      upsert: jest.fn(),
    },
  },
}));

type MockDb = {
  profile: {
    upsert: jest.Mock;
  };
};

const mockedPrisma = prisma as unknown as MockDb;

describe('profile management logic', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject invalid profile update', async () => {
    await expect(updateCustomerProfile('customer-1', {})).rejects.toThrow(
      'At least one profile field is required'
    );

    expect(mockedPrisma.profile.upsert).not.toHaveBeenCalled();
  });

  it('should allow valid profile update', async () => {
    const payload = {
      name: 'Ram Sharma',
      phone: '9812345678',
      address: 'Kathmandu',
      avatar: 'https://img.example/avatar.png',
    };

    const updatedProfile = {
      id: 'profile-1',
      userId: 'customer-1',
      ...payload,
    };

    mockedPrisma.profile.upsert.mockResolvedValue(updatedProfile);

    const result = await updateCustomerProfile('customer-1', payload);

    expect(mockedPrisma.profile.upsert).toHaveBeenCalledWith({
      where: { userId: 'customer-1' },
      update: payload,
      create: {
        userId: 'customer-1',
        ...payload,
      },
    });

    expect(result).toEqual(updatedProfile);
  });
});
