import { User, UserRole } from '@prisma/client';
import { login, LoginData, refreshAccessToken, logout } from '../../auth.service';
import prisma from '../../../config/database';
import { comparePassword } from '../../../utils/hash.util';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../../../utils/jwt.util';
import { incrementLoginAttempts, resetLoginAttempts } from '../../../middleware/security.middleware';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findFirst: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

jest.mock('../../../utils/hash.util', () => ({
  comparePassword: jest.fn(),
  hashPassword: jest.fn(),
}));

jest.mock('../../../utils/jwt.util', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

jest.mock('../../../middleware/security.middleware', () => ({
  incrementLoginAttempts: jest.fn(),
  resetLoginAttempts: jest.fn(),
}));

type MockDb = {
  user: {
    findUnique: jest.Mock;
  };
  refreshToken: {
    create: jest.Mock;
    findFirst: jest.Mock;
    updateMany: jest.Mock;
  };
};

const mockedPrisma = prisma as unknown as MockDb;
const mockedComparePassword = comparePassword as jest.MockedFunction<typeof comparePassword>;
const mockedGenerateAccessToken = generateAccessToken as jest.MockedFunction<typeof generateAccessToken>;
const mockedGenerateRefreshToken = generateRefreshToken as jest.MockedFunction<typeof generateRefreshToken>;
const mockedVerifyRefreshToken = verifyRefreshToken as jest.MockedFunction<typeof verifyRefreshToken>;
const mockedIncrementLoginAttempts = incrementLoginAttempts as jest.MockedFunction<typeof incrementLoginAttempts>;
const mockedResetLoginAttempts = resetLoginAttempts as jest.MockedFunction<typeof resetLoginAttempts>;

const buildUser = (overrides?: Partial<User>): User => ({
  id: 'user-1',
  email: 'test@example.com',
  password: 'hashed-password',
  role: UserRole.CUSTOMER,
  isEmailVerified: true,
  isActive: true,
  isLocked: false,
  otpAttempts: 0,
  loginAttempts: 0,
  lastLoginAt: null,
  lockedUntil: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  ...overrides,
});

describe('auth.service login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should throw for non-existing user and increment login attempts', async () => {
    const loginData: LoginData = {
      email: 'missing@example.com',
      password: 'Password123',
    };

    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedIncrementLoginAttempts.mockResolvedValue();

    await expect(login(loginData)).rejects.toThrow('Invalid email or password');

    expect(mockedIncrementLoginAttempts).toHaveBeenCalledWith('');
    expect(mockedPrisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('should validate empty email and password', async () => {
    const loginData: LoginData = {
      email: '',
      password: '',
    };

    await expect(login(loginData)).rejects.toThrow('Email and password are required');

    expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should login successfully with valid credentials', async () => {
    const user = buildUser();
    const loginData: LoginData = {
      email: user.email,
      password: 'plain-password',
    };

    mockedPrisma.user.findUnique.mockResolvedValue(user);
    mockedComparePassword.mockResolvedValue(true);
    mockedGenerateAccessToken.mockReturnValue('access-token');
    mockedGenerateRefreshToken.mockReturnValue('refresh-token');
    mockedPrisma.refreshToken.create.mockResolvedValue({ id: 'rt-1' });
    mockedResetLoginAttempts.mockResolvedValue();

    const result = await login(loginData);

    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: loginData.email },
      include: { profile: true },
    });
    expect(mockedComparePassword).toHaveBeenCalledWith('plain-password', 'hashed-password');
    expect(mockedResetLoginAttempts).toHaveBeenCalledWith(user.id);
    expect(mockedPrisma.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: user.id,
        token: 'refresh-token',
        expiresAt: expect.any(Date),
      }),
    });

    expect(result).toEqual({
      user,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('should throw error for invalid credentials', async () => {
    const user = buildUser();
    const loginData: LoginData = {
      email: user.email,
      password: 'wrong-password',
    };

    mockedPrisma.user.findUnique.mockResolvedValue(user);
    mockedComparePassword.mockResolvedValue(false);
    mockedIncrementLoginAttempts.mockResolvedValue();

    await expect(login(loginData)).rejects.toThrow('Invalid email or password');

    expect(mockedIncrementLoginAttempts).toHaveBeenCalledWith(user.id);
    expect(mockedPrisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('should throw when user account is inactive', async () => {
    const user = buildUser({ isActive: false });
    const loginData: LoginData = {
      email: user.email,
      password: 'plain-password',
    };

    mockedPrisma.user.findUnique.mockResolvedValue(user);
    mockedComparePassword.mockResolvedValue(true);

    await expect(login(loginData)).rejects.toThrow('Account is deactivated');

    expect(mockedResetLoginAttempts).not.toHaveBeenCalled();
    expect(mockedPrisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('should throw when account is currently locked', async () => {
    const user = buildUser({
      isLocked: true,
      lockedUntil: new Date(Date.now() + 60 * 1000),
    });
    const loginData: LoginData = {
      email: user.email,
      password: 'plain-password',
    };

    mockedPrisma.user.findUnique.mockResolvedValue(user);
    mockedComparePassword.mockResolvedValue(true);

    await expect(login(loginData)).rejects.toThrow('Account is locked');

    expect(mockedResetLoginAttempts).not.toHaveBeenCalled();
    expect(mockedPrisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('should refresh access token successfully with valid refresh token', async () => {
    mockedVerifyRefreshToken.mockReturnValue({
      userId: 'user-20',
      email: 'u20@example.com',
      role: UserRole.CUSTOMER,
    } as any);
    mockedPrisma.refreshToken.findFirst.mockResolvedValue({ id: 'rt-20' });
    mockedPrisma.user.findUnique.mockResolvedValue(buildUser({
      id: 'user-20',
      email: 'u20@example.com',
      role: UserRole.CUSTOMER,
    }));
    mockedGenerateAccessToken.mockReturnValue('new-access-token');

    const accessToken = await refreshAccessToken('valid-refresh-token');

    expect(mockedVerifyRefreshToken).toHaveBeenCalledWith('valid-refresh-token');
    expect(mockedPrisma.refreshToken.findFirst).toHaveBeenCalledWith({
      where: {
        token: 'valid-refresh-token',
        userId: 'user-20',
        isRevoked: false,
        expiresAt: {
          gt: expect.any(Date),
        },
      },
    });
    expect(accessToken).toBe('new-access-token');
  });

  it('should reject refresh when token record does not exist', async () => {
    mockedVerifyRefreshToken.mockReturnValue({
      userId: 'user-21',
      email: 'u21@example.com',
      role: UserRole.CUSTOMER,
    } as any);
    mockedPrisma.refreshToken.findFirst.mockResolvedValue(null);

    await expect(refreshAccessToken('stale-token')).rejects.toThrow('Invalid or expired refresh token');

    expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should reject refresh when user is inactive or missing', async () => {
    mockedVerifyRefreshToken.mockReturnValue({
      userId: 'user-22',
      email: 'u22@example.com',
      role: UserRole.CUSTOMER,
    } as any);
    mockedPrisma.refreshToken.findFirst.mockResolvedValue({ id: 'rt-22' });
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    await expect(refreshAccessToken('valid-token-no-user')).rejects.toThrow('User not found or inactive');
  });

  it('should revoke specific refresh token on logout when token is provided', async () => {
    mockedPrisma.refreshToken.updateMany.mockResolvedValue({ count: 1 });

    await logout('user-30', 'refresh-30');

    expect(mockedPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-30',
        token: 'refresh-30',
      },
      data: {
        isRevoked: true,
      },
    });
  });

  it('should revoke all active refresh tokens on logout when token is not provided', async () => {
    mockedPrisma.refreshToken.updateMany.mockResolvedValue({ count: 3 });

    await logout('user-31');

    expect(mockedPrisma.refreshToken.updateMany).toHaveBeenCalledWith({
      where: {
        userId: 'user-31',
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
  });
});
