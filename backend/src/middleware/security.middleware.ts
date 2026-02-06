import { Request, Response, NextFunction } from 'express';
import prisma from '../config/database';
import env from '../config/env';

export const checkAccountLockout = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  if (!req.userId) {
    next();
    return;
  }

  const user = await prisma.user.findUnique({
    where: { id: req.userId },
    select: {
      isLocked: true,
      lockedUntil: true,
    },
  });

  if (user?.isLocked && user.lockedUntil && user.lockedUntil > new Date()) {
    res.status(403).json({
      success: false,
      message: 'Account is locked. Please try again later.',
    });
    return;
  }

  next();
};

export const incrementOTPAttempts = async (userId: string): Promise<void> => {
  const maxAttempts = parseInt(env.MAX_OTP_ATTEMPTS, 10);
  const lockoutDuration = parseInt(env.ACCOUNT_LOCKOUT_DURATION, 10);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { otpAttempts: true },
  });

  if (!user) return;

  const newAttempts = user.otpAttempts + 1;

  if (newAttempts >= maxAttempts) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        otpAttempts: newAttempts,
        isLocked: true,
        lockedUntil: new Date(Date.now() + lockoutDuration),
      },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { otpAttempts: newAttempts },
    });
  }
};

export const incrementLoginAttempts = async (userId: string): Promise<void> => {
  const maxAttempts = parseInt(env.MAX_LOGIN_ATTEMPTS, 10);
  const lockoutDuration = parseInt(env.ACCOUNT_LOCKOUT_DURATION, 10);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { loginAttempts: true },
  });

  if (!user) return;

  const newAttempts = user.loginAttempts + 1;

  if (newAttempts >= maxAttempts) {
    await prisma.user.update({
      where: { id: userId },
      data: {
        loginAttempts: newAttempts,
        isLocked: true,
        lockedUntil: new Date(Date.now() + lockoutDuration),
      },
    });
  } else {
    await prisma.user.update({
      where: { id: userId },
      data: { loginAttempts: newAttempts },
    });
  }
};

export const resetOTPAttempts = async (userId: string): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { otpAttempts: 0 },
  });
};

export const resetLoginAttempts = async (userId: string): Promise<void> => {
  await prisma.user.update({
    where: { id: userId },
    data: { loginAttempts: 0, lastLoginAt: new Date() },
  });
};

