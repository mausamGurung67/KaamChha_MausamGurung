import { OTPType, User, UserRole } from '@prisma/client';
import { register, RegisterData, verifyEmail, resendOTP } from '../../auth.service';
import prisma from '../../../config/database';
import { hashPassword } from '../../../utils/hash.util';
import { generateAccessToken, generateRefreshToken } from '../../../utils/jwt.util';
import { createOTP, verifyOTP, invalidateUserOTPs } from '../../otp.service';
import { sendOTPEmail } from '../../email.service';

jest.mock('../../../config/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
    },
  },
}));

jest.mock('../../../utils/hash.util', () => ({
  hashPassword: jest.fn(),
  comparePassword: jest.fn(),
}));

jest.mock('../../../utils/jwt.util', () => ({
  generateAccessToken: jest.fn(),
  generateRefreshToken: jest.fn(),
}));

jest.mock('../../otp.service', () => ({
  createOTP: jest.fn(),
  verifyOTP: jest.fn(),
  invalidateUserOTPs: jest.fn(),
}));

jest.mock('../../email.service', () => ({
  sendOTPEmail: jest.fn(),
  sendWelcomeEmail: jest.fn(),
}));

type MockDb = {
  user: {
    findUnique: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };
  refreshToken: {
    create: jest.Mock;
  };
};

const mockedPrisma = prisma as unknown as MockDb;
const mockedHashPassword = hashPassword as jest.MockedFunction<typeof hashPassword>;
const mockedGenerateAccessToken = generateAccessToken as jest.MockedFunction<typeof generateAccessToken>;
const mockedGenerateRefreshToken = generateRefreshToken as jest.MockedFunction<typeof generateRefreshToken>;
const mockedCreateOTP = createOTP as jest.MockedFunction<typeof createOTP>;
const mockedVerifyOTP = verifyOTP as jest.MockedFunction<typeof verifyOTP>;
const mockedInvalidateUserOTPs = invalidateUserOTPs as jest.MockedFunction<typeof invalidateUserOTPs>;
const mockedSendOTPEmail = sendOTPEmail as jest.MockedFunction<typeof sendOTPEmail>;

const buildUser = (overrides?: Partial<User>): User => ({
  id: 'user-2',
  email: 'newuser@example.com',
  password: 'hashed-password',
  role: UserRole.CUSTOMER,
  isEmailVerified: false,
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

describe('auth.service register', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should reject when email already exists', async () => {
    const registerData: RegisterData = {
      email: 'existing@example.com',
      password: 'Password123',
      name: 'Existing User',
    };

    mockedPrisma.user.findUnique.mockResolvedValue(buildUser({ email: registerData.email }));

    await expect(register(registerData)).rejects.toThrow('User with this email already exists');

    expect(mockedPrisma.user.create).not.toHaveBeenCalled();
    expect(mockedPrisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('should reject invalid email format', async () => {
    const registerData: RegisterData = {
      email: 'invalid-email',
      password: 'Password123',
      name: 'Test User',
    };

    await expect(register(registerData)).rejects.toThrow('Invalid email format');

    expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should register successfully with valid input', async () => {
    const registerData: RegisterData = {
      email: 'newuser@example.com',
      password: 'Password123',
      name: 'New User',
      phone: '9812345678',
      role: UserRole.CUSTOMER,
    };

    const createdUser = buildUser({ email: registerData.email, role: registerData.role! });

    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedHashPassword.mockResolvedValue('hashed-password');
    mockedPrisma.user.create.mockResolvedValue(createdUser);
    mockedCreateOTP.mockResolvedValue('123456');
    mockedSendOTPEmail.mockResolvedValue();
    mockedGenerateAccessToken.mockReturnValue('access-token');
    mockedGenerateRefreshToken.mockReturnValue('refresh-token');
    mockedPrisma.refreshToken.create.mockResolvedValue({ id: 'rt-2' });

    const result = await register(registerData);

    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: registerData.email },
    });
    expect(mockedHashPassword).toHaveBeenCalledWith(registerData.password);
    expect(mockedPrisma.user.create).toHaveBeenCalledTimes(1);
    expect(mockedPrisma.user.create).toHaveBeenCalledWith({
      data: {
        email: registerData.email,
        password: 'hashed-password',
        role: UserRole.CUSTOMER,
        profile: {
          create: {
            name: registerData.name,
            phone: registerData.phone,
          },
        },
      },
    });
    expect(mockedCreateOTP).toHaveBeenCalledWith(createdUser.id, OTPType.EMAIL_VERIFICATION);
    expect(mockedSendOTPEmail).toHaveBeenCalledWith(createdUser.email, '123456', 'EMAIL_VERIFICATION');
    expect(mockedPrisma.refreshToken.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: createdUser.id,
        token: 'refresh-token',
        expiresAt: expect.any(Date),
      }),
    });

    expect(result).toEqual({
      user: createdUser,
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
  });

  it('should reject missing required fields', async () => {
    const registerData = {
      email: 'newuser@example.com',
      password: '',
      name: '',
    } as RegisterData;

    await expect(register(registerData)).rejects.toThrow('Email, password and name are required');

    expect(mockedPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it('should default role to CUSTOMER when role is not provided', async () => {
    const registerData: RegisterData = {
      email: 'norole@example.com',
      password: 'Password123',
      name: 'No Role User',
    };

    const createdUser = buildUser({
      email: registerData.email,
      role: UserRole.CUSTOMER,
    });

    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedHashPassword.mockResolvedValue('hashed-password');
    mockedPrisma.user.create.mockResolvedValue(createdUser);
    mockedCreateOTP.mockResolvedValue('123456');
    mockedSendOTPEmail.mockResolvedValue();
    mockedGenerateAccessToken.mockReturnValue('access-token');
    mockedGenerateRefreshToken.mockReturnValue('refresh-token');
    mockedPrisma.refreshToken.create.mockResolvedValue({ id: 'rt-3' });

    await register(registerData);

    expect(mockedPrisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          role: UserRole.CUSTOMER,
        }),
      })
    );
  });

  it('should reject when OTP email dispatch fails', async () => {
    const registerData: RegisterData = {
      email: 'mailfail@example.com',
      password: 'Password123',
      name: 'Mail Fail',
    };

    const createdUser = buildUser({ email: registerData.email });

    mockedPrisma.user.findUnique.mockResolvedValue(null);
    mockedHashPassword.mockResolvedValue('hashed-password');
    mockedPrisma.user.create.mockResolvedValue(createdUser);
    mockedCreateOTP.mockResolvedValue('123456');
    mockedSendOTPEmail.mockRejectedValue(new Error('SMTP unavailable'));

    await expect(register(registerData)).rejects.toThrow('SMTP unavailable');

    expect(mockedGenerateAccessToken).not.toHaveBeenCalled();
    expect(mockedGenerateRefreshToken).not.toHaveBeenCalled();
    expect(mockedPrisma.refreshToken.create).not.toHaveBeenCalled();
  });

  it('should verify email and update user when OTP is valid', async () => {
    mockedVerifyOTP.mockResolvedValue(true);
    mockedPrisma.user.update.mockResolvedValue({});

    await verifyEmail('user-10', '123456');

    expect(mockedVerifyOTP).toHaveBeenCalledWith('user-10', '123456', OTPType.EMAIL_VERIFICATION);
    expect(mockedPrisma.user.update).toHaveBeenCalledWith({
      where: { id: 'user-10' },
      data: { isEmailVerified: true },
    });
  });

  it('should reject email verification when OTP is invalid', async () => {
    mockedVerifyOTP.mockResolvedValue(false);

    await expect(verifyEmail('user-11', '000000')).rejects.toThrow('Invalid or expired OTP');

    expect(mockedPrisma.user.update).not.toHaveBeenCalled();
  });

  it('should resend OTP successfully for existing user', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(buildUser({ id: 'user-12', email: 'u12@example.com' }));
    mockedInvalidateUserOTPs.mockResolvedValue();
    mockedCreateOTP.mockResolvedValue('654321');
    mockedSendOTPEmail.mockResolvedValue();

    await resendOTP('user-12', OTPType.EMAIL_VERIFICATION);

    expect(mockedPrisma.user.findUnique).toHaveBeenCalledWith({ where: { id: 'user-12' } });
    expect(mockedInvalidateUserOTPs).toHaveBeenCalledWith('user-12', OTPType.EMAIL_VERIFICATION);
    expect(mockedCreateOTP).toHaveBeenCalledWith('user-12', OTPType.EMAIL_VERIFICATION);
    expect(mockedSendOTPEmail).toHaveBeenCalledWith('u12@example.com', '654321', OTPType.EMAIL_VERIFICATION);
  });

  it('should reject resend OTP when user does not exist', async () => {
    mockedPrisma.user.findUnique.mockResolvedValue(null);

    await expect(resendOTP('missing-user', OTPType.EMAIL_VERIFICATION)).rejects.toThrow('User not found');

    expect(mockedInvalidateUserOTPs).not.toHaveBeenCalled();
    expect(mockedCreateOTP).not.toHaveBeenCalled();
    expect(mockedSendOTPEmail).not.toHaveBeenCalled();
  });
});
