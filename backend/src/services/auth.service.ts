import prisma from '../config/database';
import { UserRole, User } from '@prisma/client';
import { hashPassword, comparePassword } from '../utils/hash.util';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.util';
import { createOTP, invalidateUserOTPs } from './otp.service';
import { sendOTPEmail, sendWelcomeEmail } from './email.service';
import { OTPType } from '@prisma/client';
import { resetLoginAttempts, incrementLoginAttempts } from '../middleware/security.middleware';

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  phone?: string;
  role?: UserRole;
}

export interface LoginData {
  email: string;
  password: string;
}

export const register = async (data: RegisterData): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email: data.email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists');
  }

  // Only allow self-serve registration for customer/technician
  const role = data.role || UserRole.CUSTOMER;
  if (![UserRole.CUSTOMER, UserRole.TECHNICIAN].includes(role)) {
    throw new Error('Invalid role for registration');
  }

  // Hash password
  const hashedPassword = await hashPassword(data.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: data.email,
      password: hashedPassword,
      role,
      profile: {
        create: {
          name: data.name,
          phone: data.phone,
        },
      },
    },
  });

  // Initialize availability for technicians
  if (role === UserRole.TECHNICIAN) {
    await prisma.availability.create({
      data: {
        technicianId: user.id,
      },
    });
  }

  // Generate OTP for email verification
  const otpCode = await createOTP(user.id, OTPType.EMAIL_VERIFICATION);
  await sendOTPEmail(user.email, otpCode, 'EMAIL_VERIFICATION');

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Save refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return { user, accessToken, refreshToken };
};

export const login = async (data: LoginData): Promise<{ user: User; accessToken: string; refreshToken: string }> => {
  const user = await prisma.user.findUnique({
    where: { email: data.email },
    include: { profile: true },
  });

  if (!user || !user.password) {
    await incrementLoginAttempts(user?.id || '');
    throw new Error('Invalid email or password');
  }

  const isPasswordValid = await comparePassword(data.password, user.password);

  if (!isPasswordValid) {
    await incrementLoginAttempts(user.id);
    throw new Error('Invalid email or password');
  }

  if (!user.isActive) {
    throw new Error('Account is deactivated');
  }

  if (user.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
    throw new Error('Account is locked');
  }

  // Reset login attempts on successful login
  await resetLoginAttempts(user.id);

  // Generate tokens
  const accessToken = generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  const refreshToken = generateRefreshToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });

  // Save refresh token
  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      token: refreshToken,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    },
  });

  return { user, accessToken, refreshToken };
};

export const verifyEmail = async (userId: string, code: string): Promise<void> => {
  const { verifyOTP } = await import('./otp.service');
  const isValid = await verifyOTP(userId, code, OTPType.EMAIL_VERIFICATION);

  if (!isValid) {
    throw new Error('Invalid or expired OTP');
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isEmailVerified: true },
  });
};

export const resendOTP = async (userId: string, type: OTPType): Promise<void> => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  // Invalidate existing OTPs
  await invalidateUserOTPs(userId, type);

  // Generate new OTP
  const otpCode = await createOTP(userId, type);
  await sendOTPEmail(user.email, otpCode, type);
};

export const refreshAccessToken = async (refreshToken: string): Promise<string> => {
  const { verifyRefreshToken } = await import('../utils/jwt.util');
  const decoded = verifyRefreshToken(refreshToken);

  // Verify refresh token exists in database
  const tokenRecord = await prisma.refreshToken.findFirst({
    where: {
      token: refreshToken,
      userId: decoded.userId,
      isRevoked: false,
      expiresAt: {
        gt: new Date(),
      },
    },
  });

  if (!tokenRecord) {
    throw new Error('Invalid or expired refresh token');
  }

  const user = await prisma.user.findUnique({
    where: { id: decoded.userId },
  });

  if (!user || !user.isActive) {
    throw new Error('User not found or inactive');
  }

  // Generate new access token
  return generateAccessToken({
    userId: user.id,
    email: user.email,
    role: user.role,
  });
};

export const logout = async (userId: string, refreshToken?: string): Promise<void> => {
  if (refreshToken) {
    // Revoke specific refresh token
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        token: refreshToken,
      },
      data: {
        isRevoked: true,
      },
    });
  } else {
    // Revoke all refresh tokens for user
    await prisma.refreshToken.updateMany({
      where: {
        userId,
        isRevoked: false,
      },
      data: {
        isRevoked: true,
      },
    });
  }
};

// TODO: Google login (google service not implemented)
// export const googleLogin = async (googleToken: string): Promise<{ user: User; accessToken: string; refreshToken: string; isNewUser: boolean }> => {
//   const { verifyGoogleToken } = await import('./google.service');
//   const googleUser = await verifyGoogleToken(googleToken);
//   ...
// };

