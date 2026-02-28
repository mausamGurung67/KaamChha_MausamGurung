import { z } from 'zod';

export const createServiceRequestSchema = z.object({
  body: z.object({
    title: z.string().min(3, 'Title must be at least 3 characters').max(200),
    description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
    category: z.string().min(2, 'Category is required'),
    budget: z.number().positive('Budget must be positive').optional(),
    location: z.string().min(2, 'Location is required'),
  }),
});

export const getServiceRequestSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const deleteServiceRequestSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const updateServiceRequestStatusSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    status: z.enum(['OPEN', 'ASSIGNED', 'COMPLETED', 'CANCELLED']),
  }),
});

export const assignTechnicianSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    technicianId: z.string().cuid().optional(),
  }),
});

export const searchServiceRequestsSchema = z.object({
  query: z.object({
    status: z.enum(['OPEN', 'ASSIGNED', 'COMPLETED', 'CANCELLED']).optional(),
    category: z.string().optional(),
    search: z.string().optional(),
    customerId: z.string().optional(),
    assignedTechnicianId: z.string().optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});
