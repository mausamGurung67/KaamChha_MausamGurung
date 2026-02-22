import { Request, Response } from 'express';
import * as paymentService from '../services/payment.service';

/**
 * POST /api/payments/khalti/initiate
 * Body: { orderId }
 */
export const initiateKhalti = async (req: Request, res: Response): Promise<void> => {
  const result = await paymentService.initiateKhaltiPayment({
    orderId: req.body.orderId,
    customerId: req.userId!,
  });

  res.json({
    success: true,
    message: 'Khalti payment initiated',
    data: result,
  });
};

/**
 * POST /api/payments/khalti/verify
 * Body: { pidx, orderId }
 */
export const verifyKhalti = async (req: Request, res: Response): Promise<void> => {
  const order = await paymentService.verifyKhaltiPayment({
    pidx: req.body.pidx,
    orderId: req.body.orderId,
    customerId: req.userId!,
  });

  res.json({
    success: true,
    message: 'Payment verified successfully',
    data: { order },
  });
};
