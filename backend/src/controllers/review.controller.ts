import { Request, Response } from 'express';
import * as reviewService from '../services/review.service';

/**
 * POST /api/reviews
 * Body: { orderId, rating, comment? }
 */
export const createReview = async (req: Request, res: Response): Promise<void> => {
  const result = await reviewService.createReview({
    orderId: req.body.orderId,
    customerId: req.userId!,
    rating: req.body.rating,
    comment: req.body.comment,
  });

  res.status(201).json({
    success: true,
    message: 'Review submitted successfully',
    data: result,
  });
};

/**
 * GET /api/reviews/technician/:technicianId
 * Query: ?page=1&limit=10
 */
export const getTechnicianReviews = async (req: Request, res: Response): Promise<void> => {
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

  const result = await reviewService.getTechnicianReviews(
    req.params.technicianId,
    page,
    limit
  );

  res.json({
    success: true,
    data: result,
  });
};

/**
 * GET /api/reviews/service/:serviceId
 * Query: ?page=1&limit=10
 */
export const getServiceReviews = async (req: Request, res: Response): Promise<void> => {
  const page = req.query.page ? parseInt(req.query.page as string) : 1;
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;

  const result = await reviewService.getServiceReviews(
    req.params.serviceId,
    page,
    limit
  );

  res.json({
    success: true,
    data: result,
  });
};

/**
 * GET /api/reviews/order/:orderId
 */
export const getOrderReview = async (req: Request, res: Response): Promise<void> => {
  const review = await reviewService.getOrderReview(
    req.params.orderId,
    req.userId!,
    req.userRole!
  );

  res.json({
    success: true,
    data: { review },
  });
};

/**
 * GET /api/reviews/order/:orderId/can-review
 */
export const canReviewOrder = async (req: Request, res: Response): Promise<void> => {
  const canReview = await reviewService.canReviewOrder(
    req.params.orderId,
    req.userId!
  );

  res.json({
    success: true,
    data: { canReview },
  });
};

/**
 * GET /api/reviews/technician/:technicianId/rating
 */
export const getTechnicianRating = async (req: Request, res: Response): Promise<void> => {
  const result = await reviewService.getTechnicianRating(req.params.technicianId);

  res.json({
    success: true,
    data: result,
  });
};
