import prisma from '../config/database';
import { OTPType } from '@prisma/client';
import { incrementOTPAttempts, resetOTPAttempts } from '../middleware/security.middleware';

export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const createOTP = async (
  userId: string,
  type: OTPType,
  expiresInMinutes: number = 10
): Promise<string> => {
  const code = generateOTP();
  const expiresAt = new Date(Date.now() + expiresInMinutes * 60 * 1000);

  await prisma.oTP.create({
    data: {
      userId,
      code,
      type,
      expiresAt,
    },
  });

  return code;
};

export const verifyOTP = async (
  userId: string,
  code: string,
  type: OTPType
): Promise<boolean> => {
  const otp = await prisma.oTP.findFirst({
    where: {
      userId,
      code,
      type,
      isUsed: false,
      expiresAt: {
        gt: new Date(),
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  if (!otp) {
    await incrementOTPAttempts(userId);
    return false;
  }

  // Mark OTP as used
  await prisma.oTP.update({
    where: { id: otp.id },
    data: { isUsed: true },
  });

  await resetOTPAttempts(userId);
  return true;
};

export const invalidateUserOTPs = async (userId: string, type: OTPType): Promise<void> => {
  await prisma.oTP.updateMany({
    where: {
      userId,
      type,
      isUsed: false,
    },
    data: {
      isUsed: true,
    },
  });
};

