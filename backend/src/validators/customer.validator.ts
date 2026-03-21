import { z } from 'zod';

const phoneSchema = z.string()
  .regex(/^\d{10}$/, 'Phone number must be exactly 10 digits')
  .regex(/^(97|98)\d{8}$/, 'Phone number must start with 97 or 98');

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').optional(),
    phone: phoneSchema.optional(),
    address: z.string().min(3, 'Address must be at least 3 characters').optional(),
    avatar: z.string().url('Invalid avatar URL').optional(),
  }),
});

