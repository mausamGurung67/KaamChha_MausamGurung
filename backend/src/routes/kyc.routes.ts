import { Router } from 'express';
import * as kycController from '../controllers/kyc.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { UserRole } from '@prisma/client';
import {
  submitKYCSchema,
  verifyKYCSchema,
  getKYCSchema,
  listKYCSchema,
} from '../validators/kyc.validator';

const router = Router();

// Technician routes
router.post(
  '/',
  authenticate,
  authorize(UserRole.TECHNICIAN),
  validate(submitKYCSchema),
  kycController.submitKYC
);

router.get(
  '/my',
  authenticate,
  authorize(UserRole.TECHNICIAN),
  kycController.getMyKYC
);

// Admin routes
router.get(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(listKYCSchema),
  kycController.listKYCs
);

router.get(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(getKYCSchema),
  kycController.getKYCById
);

router.patch(
  '/:id/verify',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(verifyKYCSchema),
  kycController.verifyKYC
);

export default router;

