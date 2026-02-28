import { Router } from 'express';
import * as serviceRequestController from '../controllers/serviceRequest.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { UserRole } from '@prisma/client';
import {
  createServiceRequestSchema,
  getServiceRequestSchema,
  deleteServiceRequestSchema,
  updateServiceRequestStatusSchema,
  assignTechnicianSchema,
  searchServiceRequestsSchema,
} from '../validators/serviceRequest.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Customer creates a service request
router.post(
  '/',
  authorize(UserRole.CUSTOMER),
  validate(createServiceRequestSchema),
  serviceRequestController.createServiceRequest
);

// Get all service requests (with filters) — accessible to all authenticated users
router.get(
  '/',
  validate(searchServiceRequestsSchema),
  serviceRequestController.getAllServiceRequests
);

// Get my service requests (customer's own)
router.get(
  '/my/requests',
  authorize(UserRole.CUSTOMER),
  serviceRequestController.getMyServiceRequests
);

// Get a single service request by ID
router.get(
  '/:id',
  validate(getServiceRequestSchema),
  serviceRequestController.getServiceRequestById
);

// Update status (admin, technician, or customer for cancel)
router.patch(
  '/:id/status',
  validate(updateServiceRequestStatusSchema),
  serviceRequestController.updateServiceRequestStatus
);

// Assign technician (admin or technician self-assign)
router.patch(
  '/:id/assign',
  authorize(UserRole.ADMIN, UserRole.TECHNICIAN),
  validate(assignTechnicianSchema),
  serviceRequestController.assignTechnician
);

// Delete service request (admin or owning customer)
router.delete(
  '/:id',
  validate(deleteServiceRequestSchema),
  serviceRequestController.deleteServiceRequest
);

export default router;
