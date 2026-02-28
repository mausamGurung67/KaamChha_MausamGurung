import { Request, Response } from 'express';
import * as serviceRequestService from '../services/serviceRequest.service';
import { ServiceRequestStatus } from '@prisma/client';

export const createServiceRequest = async (req: Request, res: Response): Promise<void> => {
  const serviceRequest = await serviceRequestService.createServiceRequest({
    ...req.body,
    customerId: req.userId!,
  });

  res.status(201).json({
    success: true,
    message: 'Service request created successfully',
    data: { serviceRequest },
  });
};

export const getAllServiceRequests = async (req: Request, res: Response): Promise<void> => {
  const filters = {
    status: req.query.status as ServiceRequestStatus | undefined,
    category: req.query.category as string | undefined,
    search: req.query.search as string | undefined,
    customerId: req.query.customerId as string | undefined,
    assignedTechnicianId: req.query.assignedTechnicianId as string | undefined,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
  };

  const result = await serviceRequestService.getAllServiceRequests(filters);

  res.json({
    success: true,
    data: result,
  });
};

export const getServiceRequestById = async (req: Request, res: Response): Promise<void> => {
  const serviceRequest = await serviceRequestService.getServiceRequestById(req.params.id);

  if (!serviceRequest) {
    res.status(404).json({
      success: false,
      message: 'Service request not found',
    });
    return;
  }

  res.json({
    success: true,
    data: { serviceRequest },
  });
};

export const getMyServiceRequests = async (req: Request, res: Response): Promise<void> => {
  const serviceRequests = await serviceRequestService.getMyServiceRequests(req.userId!);

  res.json({
    success: true,
    data: { serviceRequests },
  });
};

export const updateServiceRequestStatus = async (req: Request, res: Response): Promise<void> => {
  const serviceRequest = await serviceRequestService.updateServiceRequestStatus(
    req.params.id,
    req.body.status,
    req.userId!,
    req.userRole!
  );

  res.json({
    success: true,
    message: 'Service request status updated successfully',
    data: { serviceRequest },
  });
};

export const assignTechnician = async (req: Request, res: Response): Promise<void> => {
  const serviceRequest = await serviceRequestService.assignTechnician(
    req.params.id,
    req.body.technicianId || req.userId!,
    req.userId!,
    req.userRole!
  );

  res.json({
    success: true,
    message: 'Technician assigned successfully',
    data: { serviceRequest },
  });
};

export const deleteServiceRequest = async (req: Request, res: Response): Promise<void> => {
  await serviceRequestService.deleteServiceRequest(
    req.params.id,
    req.userId!,
    req.userRole!
  );

  res.json({
    success: true,
    message: 'Service request deleted successfully',
  });
};
