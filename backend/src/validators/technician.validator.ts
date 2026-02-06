import { z } from 'zod';
import { AvailabilityStatus } from '@prisma/client';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2).optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    avatar: z.string().url().optional(),
  }),
});

export const getEarningsSchema = z.object({
  query: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export const updateAvailabilitySchema = z.object({
  body: z.object({
    status: z.nativeEnum(AvailabilityStatus),
    reason: z.string().optional(),
  }),
}).refine(
  (data) => data.body.status === AvailabilityStatus.AVAILABLE || !!data.body.reason,
  {
    message: 'Reason is required when setting unavailable',
    path: ['body', 'reason'],
  }
);

