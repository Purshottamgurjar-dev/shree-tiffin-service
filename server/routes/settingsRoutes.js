import express from 'express';
import {
  getPublicSettings,
  getAdminSettings,
  updateAdminSettings,
} from '../controllers/settingsController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public route for customer app (business hours, delivery fee, availability)
router.get('/', getPublicSettings);

// Owner protected management routes
router.get('/admin', protect, authorize('owner'), getAdminSettings);
router.put('/admin', protect, authorize('owner'), updateAdminSettings);

export default router;
