import { Router } from 'express';
import * as serviceController from '../controllers/service.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { UserRole } from '@prisma/client';
import {
  createServiceSchema,
  updateServiceSchema,
  getServiceSchema,
  deleteServiceSchema,
  searchServicesSchema,
} from '../validators/service.validator';

const router = Router();

// Public routes
router.get('/', validate(searchServicesSchema), serviceController.getAllServices);
router.get('/:id', validate(getServiceSchema), serviceController.getServiceById);

// Authenticated routes
router.get('/my/services', authenticate, serviceController.getMyServices);

// Admin and Technician can create services
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN, UserRole.TECHNICIAN),
  validate(createServiceSchema),
  serviceController.createService
);

// Admin and service creator can update
router.put(
  '/:id',
  authenticate,
  validate(updateServiceSchema),
  serviceController.updateService
);

// Admin and service creator can delete
router.delete(
  '/:id',
  authenticate,
  validate(deleteServiceSchema),
  serviceController.deleteService
);

export default router;

