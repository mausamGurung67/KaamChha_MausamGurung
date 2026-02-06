import { Router } from 'express';
import * as locationController from '../controllers/location.controller';
import { authenticate } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import {
  updateLocationSchema,
  getLocationHistorySchema,
  findNearbySchema,
} from '../validators/location.validator';

const router = Router();

// Authenticated users can update their location
router.post(
  '/',
  authenticate,
  validate(updateLocationSchema),
  locationController.updateLocation
);

// Get own location history
router.get(
  '/history',
  authenticate,
  validate(getLocationHistorySchema),
  locationController.getLocationHistory
);

// Public endpoint to find nearby technicians
router.get(
  '/technicians/nearby',
  validate(findNearbySchema),
  locationController.findNearbyTechnicians
);

export default router;

