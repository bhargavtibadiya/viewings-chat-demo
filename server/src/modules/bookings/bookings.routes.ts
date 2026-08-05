import { Router } from 'express';
import { bookingsController } from './bookings.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { ROUTES } from '../../utils/constants/routes.js';

const router = Router();

/**
 * @route   POST /api/bookings
 * @desc    Create a booking
 * @access  Protected
 */
router.post(
  ROUTES.BOOKINGS.CREATE,
  authenticate,
  bookingsController.createBooking,
);

/**
 * @route   GET /api/bookings
 * @desc    List current user bookings
 * @access  Protected
 */
router.get(
  ROUTES.BOOKINGS.LIST,
  authenticate,
  bookingsController.listBookings,
);

/**
 * @route   GET /api/bookings/:bookingId
 * @desc    Get booking detail
 * @access  Protected
 */
router.get(
  ROUTES.BOOKINGS.GET_BY_ID,
  authenticate,
  bookingsController.getBookingById,
);

/**
 * @route   POST /api/bookings/:bookingId/cancel
 * @desc    Cancel a booking
 * @access  Protected
 */
router.post(
  ROUTES.BOOKINGS.CANCEL,
  authenticate,
  bookingsController.cancelBooking,
);

export default router;
