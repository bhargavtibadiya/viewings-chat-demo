import type { Request, Response, NextFunction } from 'express';
import { DemoService } from './demo.service.js';
import type { DemoFixturesResponse, DemoTurnsResponse } from './types/demo.types.js';
import { sendSuccess, sendBadRequest } from '../../utils/helpers/response.js';

export class DemoController {
  private demoService: DemoService;

  constructor() {
    this.demoService = new DemoService();
  }

  /**
   * Returns recent turn logs for an owned chat session.
   *
   * @param req - Authenticated Express request containing the session ID
   * @param res - Express response used to return turn logs
   * @param next - Express error handler
   * @returns A promise that resolves after the response is sent
   */
  getTurns = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendBadRequest(res, 'Authentication required');
        return;
      }

      const { sessionId } = req.params;
      if (!sessionId) {
        sendBadRequest(res, 'Session ID is required');
        return;
      }

      const result = await this.demoService.getTurnLogs(req.user.id, sessionId);
      sendSuccess<DemoTurnsResponse>(res, 'Turn logs retrieved', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Returns the metadata for available demo fixtures.
   *
   * @param _req - Unused Express request
   * @param res - Express response used to return fixture metadata
   * @param next - Express error handler
   * @returns A promise that resolves after the response is sent
   */
  getFixtures = async (_req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = this.demoService.getFixtures();
      sendSuccess<DemoFixturesResponse>(res, 'Fixtures retrieved', result);
    } catch (error) {
      next(error);
    }
  };
}

export const demoController = new DemoController();
