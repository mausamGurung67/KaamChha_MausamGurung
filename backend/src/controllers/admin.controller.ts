import { Request, Response } from 'express';
import * as adminService from '../services/admin.service';

export const listUsers = async (req: Request, res: Response): Promise<void> => {
  const filters = {
    role: req.query.role as any,
    isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    search: req.query.search as string,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
  };

  const result = await adminService.listUsers(filters);

  res.json({
    success: true,
    data: result.users,
    pagination: result.pagination,
  });
};

export const getUserById = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = await adminService.getUserById(id);

  if (!user) {
    res.status(404).json({
      success: false,
      message: 'User not found',
    });
    return;
  }

  res.json({
    success: true,
    data: user,
  });
};

export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const user = await adminService.updateUser(id, req.body);

  res.json({
    success: true,
    message: 'User updated successfully',
    data: user,
  });
};

export const unlockUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await adminService.unlockUser(id);

  res.json({
    success: true,
    message: 'User unlocked successfully',
  });
};

export const deleteUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  await adminService.deleteUser(id);

  res.json({
    success: true,
    message: 'User deleted successfully',
  });
};

export const listTechnicians = async (req: Request, res: Response): Promise<void> => {
  const filters = {
    kycStatus: req.query.kycStatus as any,
    isActive: req.query.isActive === 'true' ? true : req.query.isActive === 'false' ? false : undefined,
    search: req.query.search as string,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
  };

  const result = await adminService.listTechnicians(filters);

  res.json({
    success: true,
    data: result.technicians,
    pagination: result.pagination,
  });
};

export const getTechnicianStats = async (_req: Request, res: Response): Promise<void> => {
  const stats = await adminService.getTechnicianStats();

  res.json({
    success: true,
    data: stats,
  });
};
