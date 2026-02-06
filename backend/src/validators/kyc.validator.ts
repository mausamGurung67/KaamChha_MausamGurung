import { z } from 'zod';
import { DocumentType } from '@prisma/client';

export const submitKYCSchema = z.object({
  body: z.object({
    documentType: z.nativeEnum(DocumentType),
    documentNumber: z.string().min(1, 'Document number is required'),
    documentFront: z.string().url('Invalid document front URL'),
    documentBack: z.string().url('Invalid document back URL'),
    selfie: z.string().url('Invalid selfie URL'),
  }),
});

export const verifyKYCSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
    rejectionReason: z.string().optional(),
  }),
});

export const getKYCSchema = z.object({
  params: z.object({
    id: z.string().cuid(),
  }),
});

export const listKYCSchema = z.object({
  query: z.object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    page: z.string().optional(),
    limit: z.string().optional(),
  }),
});

