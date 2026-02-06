import { Request, Response } from 'express';
import * as technicianService from '../services/technician.service';
import { AvailabilityStatus } from '@prisma/client';

export const getDashboard = async (req: Request, res: Response): Promise<void> => {
  const dashboard = await technicianService.getTechnicianDashboard(req.userId!);

  res.json({
    success: true,
    data: dashboard,
  });
};

export const getProfile = async (req: Request, res: Response): Promise<void> => {
  const profile = await technicianService.getTechnicianProfile(req.userId!);

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
  const profile = await technicianService.updateTechnicianProfile(req.userId!, req.body);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { profile },
  });
};

export const getEarnings = async (req: Request, res: Response): Promise<void> => {
  const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
  const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

  const earnings = await technicianService.getTechnicianEarnings(
    req.userId!,
    startDate,
    endDate
  );

  res.json({
    success: true,
    data: earnings,
  });
};

export const getAvailability = async (req: Request, res: Response): Promise<void> => {
  const availability = await technicianService.getAvailability(req.userId!);

  res.json({
    success: true,
    data: availability,
  });
};

export const updateAvailability = async (req: Request, res: Response): Promise<void> => {
  const availability = await technicianService.updateAvailability(
    req.userId!,
    req.body.status as AvailabilityStatus,
    req.body.reason
  );

  res.json({
    success: true,
    message: 'Availability updated',
    data: availability,
  });
};

