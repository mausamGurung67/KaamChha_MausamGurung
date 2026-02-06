import { Router } from 'express';
import * as technicianController from '../controllers/technician.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { UserRole } from '@prisma/client';
import {
  updateProfileSchema,
  getEarningsSchema,
} from '../validators/technician.validator';

const router = Router();

// All technician routes require authentication and technician role
router.use(authenticate);
router.use(authorize(UserRole.TECHNICIAN));

router.get('/dashboard', technicianController.getDashboard);
router.get('/profile', technicianController.getProfile);
router.patch('/profile', validate(updateProfileSchema), technicianController.updateProfile);
router.get('/earnings', validate(getEarningsSchema), technicianController.getEarnings);

export default router;

