import { z } from 'zod';
import { OrderStatus } from '@prisma/client';

export const createOrderSchema = z.object({
  body: z.object({
    serviceId: z.string().cuid('Invalid service ID'),
    scheduledAt: z.string().datetime().optional(),
    serviceLatitude: z.number().min(-90).max(90),
    serviceLongitude: z.number().min(-180).max(180),
    serviceAddress: z.string().min(5, 'Address must be at least 5 characters'),
  }),
});

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid order ID'),
  }),
  body: z.object({
    status: z.nativeEnum(OrderStatus),
    notes: z.string().optional(),
  }),
});

export const assignTechnicianSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid order ID'),
  }),
  body: z.object({
    technicianId: z.string().cuid('Invalid technician ID'),
  }),
});

export const getOrderSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid order ID'),
  }),
});

export const listOrdersSchema = z.object({
  query: z.object({
    status: z.nativeEnum(OrderStatus).optional(),
    paymentStatus: z.enum(['PENDING', 'PAID', 'FAILED', 'REFUNDED']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
});

export const cancelOrderSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid order ID'),
  }),
  body: z.object({
    reason: z.string().optional(),
  }),
});

export const rejectOrderSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid order ID'),
  }),
  body: z.object({
    reason: z.string().optional(),
  }),
});

export const completeByTechnicianSchema = z.object({
  params: z.object({
    id: z.string().cuid('Invalid order ID'),
  }),
  body: z.object({
    notes: z.string().optional(),
    beforePhotos: z.array(z.string().url()).optional(),
    afterPhotos: z.array(z.string().url()).optional(),
  }),
});

