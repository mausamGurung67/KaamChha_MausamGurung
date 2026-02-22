import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { UserRole } from '@prisma/client';
import {
  initiateKhaltiSchema,
  verifyKhaltiSchema,
  initiateEsewaSchema,
  verifyEsewaSchema,
} from '../validators/payment.validator';

const router = Router();

// All payment routes require authentication
router.use(authenticate);

// Khalti payment endpoints (customer only)
router.post(
  '/khalti/initiate',
  authorize(UserRole.CUSTOMER),
  validate(initiateKhaltiSchema),
  paymentController.initiateKhalti
);

router.post(
  '/khalti/verify',
  authorize(UserRole.CUSTOMER),
  validate(verifyKhaltiSchema),
  paymentController.verifyKhalti
);

// eSewa payment endpoints (customer only)
router.post(
  '/esewa/initiate',
  authorize(UserRole.CUSTOMER),
  validate(initiateEsewaSchema),
  paymentController.initiateEsewa
);

router.post(
  '/esewa/verify',
  authorize(UserRole.CUSTOMER),
  validate(verifyEsewaSchema),
  paymentController.verifyEsewa
);

export default router;
