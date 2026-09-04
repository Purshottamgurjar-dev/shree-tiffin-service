import express from 'express';
import { validateCheckout } from '../controllers/checkoutController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All checkout validation routes require authentication
router.use(protect);

router.post('/validate', validateCheckout);

export default router;
