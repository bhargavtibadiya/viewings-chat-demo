import type { Request, Response, NextFunction } from 'express';
import { ListerService } from './lister.service.js';
import { AnswerQuestionDto } from './dto/lister.dto.js';
import type { AnswerQuestionDtoType } from './dto/lister.dto.js';
import type { AnswerQuestionResult, ListerQuestionsResponse } from './types/lister.types.js';
import { sendSuccess, sendBadRequest } from '../../utils/helpers/response.js';
import { createLogger } from '../../utils/helpers/logger.js';

const logger = createLogger('ListerController');

export class ListerController {
  private listerService: ListerService;

  constructor() {
    this.listerService = new ListerService();
  }

  /**
   * Lists unanswered questions for the authenticated lister.
   *
   * @param req - Authenticated Express request
   * @param res - Express response used to return questions
   * @param next - Express error handler
   * @returns A promise that resolves after the response is sent
   */
  listQuestions = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendBadRequest(res, 'Authentication required');
        return;
      }

      const questions = await this.listerService.listQuestionsForLister(req.user.id);
      sendSuccess<ListerQuestionsResponse>(res, 'Questions retrieved', { questions });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Publishes the authenticated lister's answer to a question.
   *
   * @param req - Authenticated Express request containing answer details
   * @param res - Express response used to return the approved answer
   * @param next - Express error handler
   * @returns A promise that resolves after the response is sent
   */
  answerQuestion = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendBadRequest(res, 'Authentication required');
        return;
      }

      const { questionId } = req.params;
      if (!questionId) {
        sendBadRequest(res, 'Question ID is required');
        return;
      }

      const dtoResult = AnswerQuestionDto.safeParse(req.body);
      if (!dtoResult.success) {
        const errors = dtoResult.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        sendBadRequest(res, 'Validation failed', errors);
        return;
      }

      const dto: AnswerQuestionDtoType = dtoResult.data;
      const result = await this.listerService.answerQuestion(req.user.id, questionId, dto);

      logger.info(`Question answered: ${questionId}`);
      sendSuccess<AnswerQuestionResult>(res, 'Question answered', result);
    } catch (error) {
      next(error);
    }
  };
}

export const listerController = new ListerController();
