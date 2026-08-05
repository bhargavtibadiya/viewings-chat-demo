import type { Request, Response, NextFunction } from 'express';
import { AuthService } from '../auth/auth.service.js';
import type { SafeUser } from '../auth/types/auth.types.js';
import { sendSuccess } from '../../utils/helpers/response.js';

export class UsersController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  getMe = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        res.status(401).json({ success: false, message: 'Authentication required' });
        return;
      }

      const user = await this.authService.getMe(req.user.id);
      sendSuccess<{ user: SafeUser }>(res, 'User profile retrieved', { user });
    } catch (error) {
      next(error);
    }
  };
}

export const usersController = new UsersController();
