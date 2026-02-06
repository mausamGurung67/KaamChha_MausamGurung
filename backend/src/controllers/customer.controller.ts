import { Request, Response } from 'express';
import * as customerService from '../services/customer.service';

export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  const dashboard = await customerService.getCustomerDashboard(req.userId!);

  res.json({
    success: true,
    data: dashboard,
  });
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const profile = await customerService.getCustomerProfile(req.userId!);

  if (!profile) {
    res.status(404).json({
      success: false,
      message: 'Profile not found',
    });
    return;
  }

  res.json({
    success: true,
    data: { profile },
  });
};

export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const profile = await customerService.updateCustomerProfile(req.userId!, req.body);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { profile },
  });
};

