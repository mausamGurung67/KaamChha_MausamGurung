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
