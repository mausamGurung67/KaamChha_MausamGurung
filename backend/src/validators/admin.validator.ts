import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const listUsersSchema = z.object({
  query: z.object({
    role: z.nativeEnum(UserRole).optional(),
    isActive: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

export const getUserSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const updateUserSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    isActive: z.boolean().optional(),
    isLocked: z.boolean().optional(),
    role: z.nativeEnum(UserRole).optional(),
  }),
});

export const unlockUserSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const deleteUserSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const listTechniciansSchema = z.object({
  query: z.object({
    kycStatus: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    isActive: z.string().optional(),
    search: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

