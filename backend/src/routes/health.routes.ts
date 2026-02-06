import { Router, Request, Response } from 'express';
import * as healthService from '../services/health.service';
import { getRequestLogs, clearRequestLogs } from '../middleware/logger.middleware';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { UserRole } from '@prisma/client';

const router = Router();

// Basic health check (public)
router.get('/', async (_req: Request, res: Response): Promise<void> => {
  const health = await healthService.getSystemHealth();
  res.json({
    success: true,
    ...health,
  });
});

// Detailed health check (admin only)
router.get('/detailed', authenticate, authorize(UserRole.ADMIN), async (_req: Request, res: Response): Promise<void> => {
  const health = await healthService.getDetailedHealth();
  res.json({
    success: true,
    ...health,
  });
});

// Request logs (admin only)
router.get('/requests', authenticate, authorize(UserRole.ADMIN), (req: Request, res: Response): void => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const logs = getRequestLogs().slice(0, limit);
  
  res.json({
    success: true,
    data: {
      logs,
      total: logs.length,
    },
  });
});

// Clear request logs (admin only)
router.delete('/requests', authenticate, authorize(UserRole.ADMIN), (_req: Request, res: Response): void => {
  clearRequestLogs();
  res.json({
    success: true,
    message: 'Request logs cleared',
  });
});

export default router;

