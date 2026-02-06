import { Request, Response } from 'express';
import * as locationService from '../services/location.service';

export const updateLocation = async (req: Request, res: Response): Promise<void> => {
  await locationService.updateUserLocation(req.userId!, req.body);

  res.json({
    success: true,
    message: 'Location updated successfully',
  });
};

export const getLocationHistory = async (req: Request, res: Response): Promise<void> => {
  const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
  const history = await locationService.getLocationHistory(req.userId!, limit);

  res.json({
    success: true,
    data: { history },
  });
};

export const findNearbyTechnicians = async (req: Request, res: Response): Promise<void> => {
  const latitude = parseFloat(req.query.latitude as string);
  const longitude = parseFloat(req.query.longitude as string);
  const radius = req.query.radius ? parseFloat(req.query.radius as string) : 10;

  const technicians = await locationService.findNearbyTechnicians(latitude, longitude, radius);

  res.json({
    success: true,
    data: { technicians },
  });
};

