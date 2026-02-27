import { z } from 'zod';

export const createReviewSchema = z.object({
  body: z.object({
    orderId: z.string().cuid('Invalid order ID'),
    rating: z.number().int().min(1, 'Rating must be at least 1').max(5, 'Rating must be at most 5'),
    comment: z.string().max(1000, 'Comment must be 1000 characters or less').optional(),
  }),
});

export const getTechnicianReviewsSchema = z.object({
  params: z.object({
    technicianId: z.string().cuid('Invalid technician ID'),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }).optional(),
});

export const getServiceReviewsSchema = z.object({
  params: z.object({
    serviceId: z.string().cuid('Invalid service ID'),
  }),
  query: z.object({
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }).optional(),
});

export const getOrderReviewSchema = z.object({
  params: z.object({
    orderId: z.string().cuid('Invalid order ID'),
  }),
});
