import { Router } from 'express';
import * as reviewController from '../controllers/review.controller';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { UserRole } from '@prisma/client';
import {
  createReviewSchema,
  getTechnicianReviewsSchema,
  getServiceReviewsSchema,
  getOrderReviewSchema,
} from '../validators/review.validator';

const router = Router();

// Public routes (no auth required) — view reviews
router.get(
  '/technician/:technicianId',
  validate(getTechnicianReviewsSchema),
  reviewController.getTechnicianReviews
);

router.get(
  '/technician/:technicianId/rating',
  validate(getTechnicianReviewsSchema),
  reviewController.getTechnicianRating
);

router.get(
  '/service/:serviceId',
  validate(getServiceReviewsSchema),
  reviewController.getServiceReviews
);

// Authenticated routes
router.use(authenticate);

// Submit a review (customer only)
router.post(
  '/',
  authorize(UserRole.CUSTOMER),
  validate(createReviewSchema),
  reviewController.createReview
);

// Get review for a specific order
router.get(
  '/order/:orderId',
  validate(getOrderReviewSchema),
  reviewController.getOrderReview
);

// Check if customer can review an order
router.get(
  '/order/:orderId/can-review',
  authorize(UserRole.CUSTOMER),
  validate(getOrderReviewSchema),
  reviewController.canReviewOrder
);

// ── Admin review management routes ────────────────────
router.get(
  '/admin/all',
  authorize(UserRole.ADMIN),
  reviewController.getAllReviews
);

router.patch(
  '/admin/:id/toggle-approval',
  authorize(UserRole.ADMIN),
  reviewController.toggleReviewApproval
);

router.delete(
  '/admin/:id',
  authorize(UserRole.ADMIN),
  reviewController.deleteReview
);

export default router;
