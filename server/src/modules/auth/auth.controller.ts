import type { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/auth.dto.js';
import type { LoginDtoType } from './dto/auth.dto.js';
import type { AuthMeResponse, LoginResponse } from './types/auth.types.js';
import { sendSuccess, sendBadRequest } from '../../utils/helpers/response.js';
import { createLogger } from '../../utils/helpers/logger.js';

const logger = createLogger('AuthController');

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Authenticates a user from the login request body.
   *
   * @param req - Express request containing credentials
   * @param res - Express response used to return the login result
   * @param next - Express error handler
   * @returns A promise that resolves after the response is sent
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtoResult = LoginDto.safeParse(req.body);
      if (!dtoResult.success) {
        const errors = dtoResult.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        sendBadRequest(res, 'Validation failed', errors);
        return;
      }

      const dto: LoginDtoType = dtoResult.data;
      const result = await this.authService.login(dto);

      logger.info(`User logged in: ${result.user.email}`);
      sendSuccess<LoginResponse>(res, 'Login successful', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Returns the authenticated user's profile.
   *
   * @param req - Authenticated Express request
   * @param res - Express response used to return the profile
   * @param next - Express error handler
   * @returns A promise that resolves after the response is sent
   */
  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendBadRequest(res, 'Authentication required');
        return;
      }

      const user = await this.authService.getMe(req.user.id);
      sendSuccess<AuthMeResponse>(res, 'Profile retrieved', { user });
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
