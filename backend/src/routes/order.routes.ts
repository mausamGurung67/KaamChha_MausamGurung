import { Router } from 'express';
import * as orderController from '../controllers/order.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { UserRole } from '@prisma/client';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  assignTechnicianSchema,
  getOrderSchema,
  listOrdersSchema,
  cancelOrderSchema,
  rejectOrderSchema,
  completeByTechnicianSchema,
} from '../validators/order.validator';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// Customer routes
router.post(
  '/',
  authorize(UserRole.CUSTOMER),
  validate(createOrderSchema),
  orderController.createOrder
);

router.get('/', validate(listOrdersSchema), orderController.listOrders);

router.get('/:id', validate(getOrderSchema), orderController.getOrderById);

router.get('/:id/chats', validate(getOrderSchema), orderController.getOrderChats);

router.patch(
  '/:id/status',
  validate(updateOrderStatusSchema),
  orderController.updateOrderStatus
);

router.post(
  '/:id/cancel',
  validate(cancelOrderSchema),
  orderController.cancelOrder
);

// Technician booking actions
router.post(
  '/:id/accept',
  authorize(UserRole.TECHNICIAN),
  validate(getOrderSchema),
  orderController.acceptOrder
);

router.post(
  '/:id/reject',
  authorize(UserRole.TECHNICIAN),
  validate(rejectOrderSchema),
  orderController.rejectOrder
);

router.post(
  '/:id/complete-technician',
  authorize(UserRole.TECHNICIAN),
  validate(completeByTechnicianSchema),
  orderController.completeByTechnician
);

// Customer confirms completion
router.post(
  '/:id/confirm-completion',
  authorize(UserRole.CUSTOMER),
  validate(getOrderSchema),
  orderController.confirmCompletion
);

// Admin routes
router.post(
  '/:id/assign',
  authorize(UserRole.ADMIN),
  validate(assignTechnicianSchema),
  orderController.assignTechnician
);

router.post(
  '/:id/auto-assign',
  authorize(UserRole.ADMIN),
  validate(getOrderSchema),
  orderController.autoAssignTechnician
);

export default router;
