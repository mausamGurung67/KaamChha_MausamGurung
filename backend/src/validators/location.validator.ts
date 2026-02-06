import { z } from 'zod';

export const updateLocationSchema = z.object({
  body: z.object({
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
  }),
});

export const getLocationHistorySchema = z.object({
  query: z.object({
    limit: z.string().optional(),
  }),
});

export const findNearbySchema = z.object({
  query: z.object({
    latitude: z.string().regex(/^-?\d+\.?\d*$/),
    longitude: z.string().regex(/^-?\d+\.?\d*$/),
    radius: z.string().optional(),
  }),
});

