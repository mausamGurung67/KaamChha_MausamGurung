/// <reference types="../types/express" />
import { Request, Response } from 'express';
import { setCookie, clearCookie } from '../utils/cookie.util';
import * as authService from '../services/auth.service';
import { OTPType } from '@prisma/client';

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

export const register = async (req: Request, res: Response): Promise<void> => {
  const { user, accessToken, refreshToken } = await authService.register(req.body);

  setCookie(res, 'accessToken', accessToken, ACCESS_TOKEN_MAX_AGE);
  setCookie(res, 'refreshToken', refreshToken, REFRESH_TOKEN_MAX_AGE);

  res.status(201).json({
    success: true,
    message: 'Registration successful. Please verify your email.',
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    },
  });
};

export const login = async (req: Request, res: Response): Promise<void> => {
  const { user, accessToken, refreshToken } = await authService.login(req.body);

  setCookie(res, 'accessToken', accessToken, ACCESS_TOKEN_MAX_AGE);
  setCookie(res, 'refreshToken', refreshToken, REFRESH_TOKEN_MAX_AGE);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
    },
  });
};

export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  await authService.verifyEmail(userId, req.body.code);

  res.json({
    success: true,
    message: 'Email verified successfully',
  });
};

export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const type = req.body.type as OTPType;
  await authService.resendOTP(userId, type);

  res.json({
    success: true,
    message: 'OTP sent successfully',
  });
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  
  if (!refreshToken) {
    res.status(401).json({
      success: false,
      message: 'Refresh token is required',
    });
    return;
  }

  const accessToken = await authService.refreshAccessToken(refreshToken);
  setCookie(res, 'accessToken', accessToken, ACCESS_TOKEN_MAX_AGE);

  res.json({
    success: true,
    message: 'Token refreshed successfully',
    data: { accessToken },
  });
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const refreshToken = req.cookies?.refreshToken;
  
  await authService.logout(userId, refreshToken);
  
  clearCookie(res, 'accessToken');
  clearCookie(res, 'refreshToken');

  res.json({
    success: true,
    message: 'Logged out successfully',
  });
};

// export const googleLogin = async (req: Request, res: Response): Promise<void> => {
//   const { user, accessToken, refreshToken, isNewUser } = await authService.googleLogin(req.body.token);

//   setCookie(res, 'accessToken', accessToken, ACCESS_TOKEN_MAX_AGE);
//   setCookie(res, 'refreshToken', refreshToken, REFRESH_TOKEN_MAX_AGE);

//   res.json({
//     success: true,
//     message: isNewUser ? 'Account created and logged in successfully' : 'Login successful',
//     data: {
//       user: {
//         id: user.id,
//         email: user.email,
//         role: user.role,
//         isEmailVerified: user.isEmailVerified,
//       },
//     },
//   });
// };

export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;
  const prisma = (await import('../config/database')).default;
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    // Don't reveal if user exists for security
    res.json({
      success: true,
      message: 'If the email exists, a password reset OTP has been sent',
    });
    return;
  }

  const { invalidateUserOTPs, createOTP } = await import('../services/otp.service');
  const { sendOTPEmail } = await import('../services/email.service');
  
  await invalidateUserOTPs(user.id, OTPType.PASSWORD_RESET);
  const otpCode = await createOTP(user.id, OTPType.PASSWORD_RESET);
  await sendOTPEmail(user.email, otpCode, 'PASSWORD_RESET');

  res.json({
    success: true,
    message: 'Password reset OTP sent to your email',
  });
};

export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const userId = req.userId!;
  const { code, newPassword } = req.body;
  
  // Verify OTP first
  const { verifyOTP } = await import('../services/otp.service');
  const isValid = await verifyOTP(userId, code, OTPType.PASSWORD_RESET);
  
  if (!isValid) {
    res.status(400).json({
      success: false,
      message: 'Invalid or expired OTP',
    });
    return;
  }

  // Update password
  const { hashPassword } = await import('../utils/hash.util');
  const hashedPassword = await hashPassword(newPassword);
  
  const prisma = (await import('../config/database')).default;
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashedPassword },
  });

  res.json({
    success: true,
    message: 'Password reset successfully',
  });
};

