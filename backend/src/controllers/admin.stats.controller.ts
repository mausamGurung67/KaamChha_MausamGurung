import { Request, Response } from 'express';
import * as adminStatsService from '../services/admin.stats.service';

export const getPlatformStats = async (_req: Request, res: Response): Promise<void> => {
  const stats = await adminStatsService.getPlatformStats();

  res.json({
    success: true,
    data: stats,
  });
};

export const getRevenueAnalytics = async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;
  
  const analytics = await adminStatsService.getRevenueAnalytics(
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );

  res.json({
    success: true,
    data: analytics,
  });
};

export const getOrderAnalytics = async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;
  
  const analytics = await adminStatsService.getOrderAnalytics(
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );

  res.json({
    success: true,
    data: analytics,
  });
};

export const getUserGrowthAnalytics = async (req: Request, res: Response): Promise<void> => {
  const { startDate, endDate } = req.query;
  
  const analytics = await adminStatsService.getUserGrowthAnalytics(
    startDate ? new Date(startDate as string) : undefined,
    endDate ? new Date(endDate as string) : undefined
  );

  res.json({
    success: true,
    data: analytics,
  });
};

export const getTechnicianPerformanceAnalytics = async (_req: Request, res: Response): Promise<void> => {
  const analytics = await adminStatsService.getTechnicianPerformanceAnalytics();

  res.json({
    success: true,
    data: analytics,
  });
};
