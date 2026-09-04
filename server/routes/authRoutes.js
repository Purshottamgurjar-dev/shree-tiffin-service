import express from 'express';
import {
  register,
  login,
  forgotPassword,
  resetPasswordWithToken,
  resetPassword,
  getCurrentUser,
  updateProfile,
} from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';
import { authRateLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes with rate limiting protection on sensitive authentication endpoints
router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);
router.post('/forgot-password', authRateLimiter, forgotPassword);
router.post('/reset-password/:token', authRateLimiter, resetPasswordWithToken);
router.post('/reset-password', authRateLimiter, resetPassword);

// Protected routes
router.get('/me', protect, getCurrentUser);
router.put('/profile', protect, updateProfile);

export default router;
