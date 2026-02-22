import { z } from 'zod';

export const initiateKhaltiSchema = z.object({
  body: z.object({
    orderId: z.string().cuid('Invalid order ID'),
  }),
});

export const verifyKhaltiSchema = z.object({
  body: z.object({
    pidx: z.string().min(1, 'pidx is required'),
    orderId: z.string().cuid('Invalid order ID'),
  }),
});
