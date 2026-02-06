import { z } from 'zod';

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    description: z.string().optional(),
    image: z.string().url().optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    name: z.string().min(2).optional(),
    description: z.string().optional(),
    image: z.string().url().optional(),
    isActive: z.boolean().optional(),
  }),
});

export const getCategorySchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const deleteCategorySchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

