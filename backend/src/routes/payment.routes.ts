import { Router } from 'express';
import * as paymentController from '../controllers/payment.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { UserRole } from '@prisma/client';
import { initiateKhaltiSchema, verifyKhaltiSchema } from '../validators/payment.validator';

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

export default router;
