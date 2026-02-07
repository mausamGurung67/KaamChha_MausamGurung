import { Request, Response } from 'express';
import * as serviceService from '../services/service.service';

export const createService = async (req: Request, res: Response): Promise<void> => {
  const service = await serviceService.createService({
    ...req.body,
    createdBy: req.userId!,
  });

  res.status(201).json({
    success: true,
    message: 'Service created successfully',
    data: { service },
  });
};

export const getAllServices = async (req: Request, res: Response): Promise<void> => {
  const filters = {
    categoryId: req.query.categoryId as string | undefined,
    search: req.query.search as string | undefined,
    minPrice: req.query.minPrice ? parseFloat(req.query.minPrice as string) : undefined,
    maxPrice: req.query.maxPrice ? parseFloat(req.query.maxPrice as string) : undefined,
    isActive: req.query.isActive as string | undefined,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
  };

  const result = await serviceService.getAllServices(filters);

  res.json({
    success: true,
    data: result,
  });
};

export const getServiceById = async (req: Request, res: Response): Promise<void> => {
  const service = await serviceService.getServiceById(req.params.id);

  if (!service) {
    res.status(404).json({
      success: false,
      message: 'Service not found',
    });
    return;
  }

  res.json({
    success: true,
    data: { service },
  });
};

export const getMyServices = async (req: Request, res: Response): Promise<void> => {
  const services = await serviceService.getServicesByCreator(req.userId!);

  res.json({
    success: true,
    data: { services },
  });
};

export const updateService = async (req: Request, res: Response): Promise<void> => {
  const service = await serviceService.updateService(
    req.params.id,
    req.body,
    req.userId!,
    req.userRole!
  );

  res.json({
    success: true,
    message: 'Service updated successfully',
    data: { service },
  });
};

export const deleteService = async (req: Request, res: Response): Promise<void> => {
  await serviceService.deleteService(req.params.id, req.userId!, req.userRole!);

  res.json({
    success: true,
    message: 'Service deleted successfully',
  });
};

