import { Request, Response } from 'express';
import * as kycService from '../services/kyc.service';

export const submitKYC = async (req: Request, res: Response): Promise<void> => {
  const kyc = await kycService.submitKYC({
    ...req.body,
    technicianId: req.userId!,
  });

  res.status(201).json({
    success: true,
    message: 'KYC submitted successfully',
    data: { kyc },
  });
};

export const getMyKYC = async (req: Request, res: Response): Promise<void> => {
  const kyc = await kycService.getKYCByTechnicianId(req.userId!);

  if (!kyc) {
    res.status(404).json({
      success: false,
      message: 'KYC not found',
    });
    return;
  }

  res.json({
    success: true,
    data: { kyc },
  });
};

export const getKYCById = async (req: Request, res: Response): Promise<void> => {
  const kyc = await kycService.getKYCById(req.params.id);

  if (!kyc) {
    res.status(404).json({
      success: false,
      message: 'KYC not found',
    });
    return;
  }

  res.json({
    success: true,
    data: { kyc },
  });
};

export const listKYCs = async (req: Request, res: Response): Promise<void> => {
  const filters = {
    status: req.query.status as any,
    page: req.query.page ? parseInt(req.query.page as string) : undefined,
    limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
  };

  const result = await kycService.listKYCs(filters);

  res.json({
    success: true,
    data: result,
  });
};

export const verifyKYC = async (req: Request, res: Response): Promise<void> => {
  const kyc = await kycService.verifyKYC(req.params.id, {
    ...req.body,
    verifiedBy: req.userId!,
  });

  res.json({
    success: true,
    message: `KYC ${req.body.status.toLowerCase()} successfully`,
    data: { kyc },
  });
};

