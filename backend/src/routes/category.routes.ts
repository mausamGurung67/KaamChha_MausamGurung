import { Router } from 'express';
import * as categoryController from '../controllers/category.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { UserRole } from '@prisma/client';
import {
  createCategorySchema,
  updateCategorySchema,
  getCategorySchema,
  deleteCategorySchema,
} from '../validators/category.validator';

const router = Router();

// Public routes
router.get('/', categoryController.getAllCategories);
router.get('/:id', validate(getCategorySchema), categoryController.getCategoryById);

// Admin only routes
router.post(
  '/',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(createCategorySchema),
  categoryController.createCategory
);
router.put(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(updateCategorySchema),
  categoryController.updateCategory
);
router.delete(
  '/:id',
  authenticate,
  authorize(UserRole.ADMIN),
  validate(deleteCategorySchema),
  categoryController.deleteCategory
);

export default router;

