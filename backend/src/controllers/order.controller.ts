import { Request, Response } from 'express';
import * as orderService from '../services/order.service';

export const createOrder = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.createOrder({
    ...req.body,
    customerId: req.userId!,
  });

  res.status(201).json({
    success: true,
    message: 'Order created successfully',
    data: { order },
  });
};

export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.getOrderById(
    req.params.id,
    req.userId!,
    req.userRole!
  );

  if (!order) {
    res.status(404).json({
      success: false,
      message: 'Order not found',
    });
    return;
  }

  res.json({
    success: true,
    data: { order },
  });
};

export const listOrders = async (req: Request, res: Response): Promise<void> => {
  const filters = {
    status: req.query.status as any,
    paymentStatus: req.query.paymentStatus as any,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
    endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
  };

  const result = await orderService.listOrders(filters, req.userId!, req.userRole!);

  res.json({
    success: true,
    data: result,
  });
};

export const updateOrderStatus = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.updateOrderStatus(
    req.params.id,
    req.body.status,
    req.userId!,
    req.userRole!,
    req.body.notes
  );

  res.json({
    success: true,
    message: 'Order status updated successfully',
    data: { order },
  });
};

export const assignTechnician = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.assignTechnician(
    req.params.id,
    req.body.technicianId,
    req.userId!
  );

  res.json({
    success: true,
    message: 'Technician assigned successfully',
    data: { order },
  });
};

export const autoAssignTechnician = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.autoAssignTechnician(req.params.id, req.userId!);

  res.json({
    success: true,
    message: 'Technician auto-assigned successfully',
    data: { order },
  });
};

export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.cancelOrder(
    req.params.id,
    req.userId!,
    req.userRole!,
    req.body.reason
  );

  res.json({
    success: true,
    message: 'Order cancelled successfully',
    data: { order },
  });
};

export const acceptOrder = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.acceptOrder(req.params.id, req.userId!);

  res.json({
    success: true,
    message: 'Booking accepted successfully',
    data: { order },
  });
};

export const rejectOrder = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.rejectOrder(req.params.id, req.userId!, req.body.reason);

  res.json({
    success: true,
    message: 'Booking rejected',
    data: { order },
  });
};

export const completeByTechnician = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.completeByTechnician(req.params.id, req.userId!, {
    notes: req.body.notes,
    beforePhotos: req.body.beforePhotos,
    afterPhotos: req.body.afterPhotos,
  });

  res.json({
    success: true,
    message: 'Booking marked as completed',
    data: { order },
  });
};

export const confirmCompletion = async (req: Request, res: Response): Promise<void> => {
  const order = await orderService.confirmCompletion(req.params.id, req.userId!);

  res.json({
    success: true,
    message: 'Booking completion confirmed',
    data: { order },
  });
};
