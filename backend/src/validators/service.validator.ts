import { z } from 'zod';

export const createServiceSchema = z.object({
  body: z.object({
    categoryId: z.string().cuid(),
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    price: z.number().positive('Price must be positive'),
    duration: z.number().int().positive('Duration must be a positive integer'),
    image: z.string().url().optional(),
    images: z.array(z.string().url()).optional(),
    inclusions: z.array(z.string()).optional(),
    serviceRadius: z.number().positive().optional(),
  }),
});

export const updateServiceSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    categoryId: z.string().cuid().optional(),
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    price: z.number().positive().optional(),
    duration: z.number().int().positive().optional(),
    image: z.string().url().optional(),
    images: z.array(z.string().url()).optional(),
    inclusions: z.array(z.string()).optional(),
    isActive: z.boolean().optional(),
    serviceRadius: z.number().positive().optional(),
  }),
});

export const getServiceSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const deleteServiceSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const searchServicesSchema = z.object({
  query: z.object({
    categoryId: z.string().cuid().optional(),
    search: z.string().optional(),
    minPrice: z.string().optional(),
    maxPrice: z.string().optional(),
    isActive: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

