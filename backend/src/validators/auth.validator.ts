import { z } from 'zod';
import { UserRole } from '@prisma/client';

const phoneSchema = z.string()
  .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
  .regex(/^(97|98)\d{8}$/, 'Phone number must start with 97 or 98');

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    phone: phoneSchema.optional(),
    role: z.nativeEnum(UserRole).optional(),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const verifyEmailSchema = z.object({
  body: z.object({
    code: z.string().length(6, 'OTP must be 6 digits'),
  }),
});

export const resendOTPSchema = z.object({
  body: z.object({
    type: z.enum(['EMAIL_VERIFICATION', 'PASSWORD_RESET', 'LOGIN']),
  }),
});

export const refreshTokenSchema = z.object({
  body: z.object({
    refreshToken: z.string().optional(),
  }),
});

export const googleLoginSchema = z.object({
  body: z.object({
    token: z.string().min(1, 'Google token is required'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    code: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
  }),
});

