import express from 'express';
import {
  getMeals,
  getMealById,
  createMeal,
  updateMeal,
  deleteMeal,
  toggleAvailability,
  toggleFeatured,
  getMealStats,
} from '../controllers/mealController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.get('/', getMeals);

// Owner-only stats route (placed before /:id so it does not collide with ID param)
router.get('/admin/stats', protect, authorize('owner'), getMealStats);

// Public single meal route
router.get('/:id', getMealById);

// Owner-only mutation routes
router.post('/', protect, authorize('owner'), createMeal);
router.put('/:id', protect, authorize('owner'), updateMeal);
router.delete('/:id', protect, authorize('owner'), deleteMeal);
router.patch('/:id/availability', protect, authorize('owner'), toggleAvailability);
router.patch('/:id/featured', protect, authorize('owner'), toggleFeatured);

export default router;
