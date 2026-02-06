import { Router } from 'express';
import * as adminController from '../controllers/admin.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { UserRole } from '@prisma/client';
import {
  listUsersSchema,
  getUserSchema,
  updateUserSchema,
  unlockUserSchema,
  deleteUserSchema,
  listTechniciansSchema,
} from '../validators/admin.validator';

const router = Router();

// All admin routes require authentication and admin role
router.use(authenticate);
router.use(authorize(UserRole.ADMIN));

// User management
router.get('/users', validate(listUsersSchema), adminController.listUsers);
router.get('/users/:id', validate(getUserSchema), adminController.getUserById);
router.patch(
  '/users/:id',
  validate(updateUserSchema),
  adminController.updateUser
);
router.post(
  '/users/:id/unlock',
  validate(unlockUserSchema),
  adminController.unlockUser
);
router.delete(
  '/users/:id',
  validate(deleteUserSchema),
  adminController.deleteUser
);

// Technician management
router.get(
  '/technicians',
  validate(listTechniciansSchema),
  adminController.listTechnicians
);
router.get('/technicians/stats', adminController.getTechnicianStats);

// Statistics and Analytics
import * as adminStatsController from '../controllers/admin.stats.controller';

router.get('/stats/platform', adminStatsController.getPlatformStats);
router.get('/stats/revenue', adminStatsController.getRevenueAnalytics);
router.get('/stats/orders', adminStatsController.getOrderAnalytics);
router.get('/stats/users', adminStatsController.getUserGrowthAnalytics);
router.get('/stats/technicians/performance', adminStatsController.getTechnicianPerformanceAnalytics);

export default router;
