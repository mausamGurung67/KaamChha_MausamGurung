import { Router } from 'express';
import * as customerController from '../controllers/customer.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { UserRole } from '@prisma/client';
import { updateProfileSchema } from '../validators/customer.validator';

const router = Router();

// All customer routes require authentication and customer role
router.use(authenticate);
router.use(authorize(UserRole.CUSTOMER));

router.get('/dashboard', customerController.getDashboard);
router.get('/profile', customerController.getProfile);
router.patch('/profile', validate(updateProfileSchema), customerController.updateProfile);

export default router;

