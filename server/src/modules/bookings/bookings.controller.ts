import type { Request, Response, NextFunction } from 'express';
import { BookingsService } from './bookings.service.js';
import { CreateBookingDto } from './dto/bookings.dto.js';
import type { CreateBookingDtoType } from './dto/bookings.dto.js';
import type {
  BookingDetailResponse,
  BookingsListResponse,
  CreateBookingResult,
} from './types/bookings.types.js';
import { sendCreated, sendSuccess, sendBadRequest } from '../../utils/helpers/response.js';
import { createLogger } from '../../utils/helpers/logger.js';

const logger = createLogger('BookingsController');

export class BookingsController {
  private bookingsService: BookingsService;

  constructor() {
    this.bookingsService = new BookingsService();
  }

  createBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtoResult = CreateBookingDto.safeParse(req.body);
      if (!dtoResult.success) {
        const errors = dtoResult.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        sendBadRequest(res, 'Validation failed', errors);
        return;
      }

      if (!req.user) {
        sendBadRequest(res, 'Authentication required');
        return;
      }

      const dto: CreateBookingDtoType = dtoResult.data;
      const result = await this.bookingsService.createBooking(req.user.id, dto);

      logger.info(`Booking created: ${result.booking.id} by user ${req.user.id}`);
      sendCreated<CreateBookingResult>(res, 'Booking confirmed', result);
    } catch (error) {
      next(error);
    }
  };

  listBookings = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendBadRequest(res, 'Authentication required');
        return;
      }

      const bookings = await this.bookingsService.listMyBookings(req.user.id);
      sendSuccess<BookingsListResponse>(res, 'Bookings retrieved', { bookings });
    } catch (error) {
      next(error);
    }
  };

  getBookingById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendBadRequest(res, 'Authentication required');
        return;
      }

      const { bookingId } = req.params;
      if (!bookingId) {
        sendBadRequest(res, 'Booking ID is required');
        return;
      }

      const booking = await this.bookingsService.getBookingById(req.user.id, bookingId);
      sendSuccess<BookingDetailResponse>(res, 'Booking retrieved', { booking });
    } catch (error) {
      next(error);
    }
  };

  cancelBooking = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendBadRequest(res, 'Authentication required');
        return;
      }

      const { bookingId } = req.params;
      if (!bookingId) {
        sendBadRequest(res, 'Booking ID is required');
        return;
      }

      const booking = await this.bookingsService.cancelBooking(req.user.id, bookingId);
      logger.info(`Booking cancelled: ${bookingId}`);
      sendSuccess<BookingDetailResponse>(res, 'Booking cancelled', { booking });
    } catch (error) {
      next(error);
    }
  };
}

export const bookingsController = new BookingsController();
