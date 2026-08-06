import { Router } from 'express';
import { bookingsController } from './bookings.controller.js';
import { authenticate } from '../../middleware/auth.js';
import { ROUTES } from '../../utils/constants/routes.js';

const router = Router();

// [NOTE] Create a booking
router.post(
  ROUTES.BOOKINGS.CREATE,
  authenticate,
  bookingsController.createBooking,
);

// [NOTE] List current user bookings
router.get(
  ROUTES.BOOKINGS.LIST,
  authenticate,
  bookingsController.listBookings,
);

// [NOTE] Get booking detail
router.get(
  ROUTES.BOOKINGS.GET_BY_ID,
  authenticate,
  bookingsController.getBookingById,
);

// [NOTE] Cancel a booking
router.post(
  ROUTES.BOOKINGS.CANCEL,
  authenticate,
  bookingsController.cancelBooking,
);

export default router;
