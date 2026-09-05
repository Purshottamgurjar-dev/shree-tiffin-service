import express from 'express';
import {
  getKitchenLocation,
  checkDeliveryRadius,
  reverseGeocode,
  searchLocation,
} from '../controllers/locationController.js';

const router = express.Router();

// Public routes for location services
router.get('/kitchen', getKitchenLocation);
router.get('/check-radius', checkDeliveryRadius);
router.get('/reverse', reverseGeocode);
router.get('/search', searchLocation);

export default router;
