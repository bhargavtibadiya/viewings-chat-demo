import type { Request, Response, NextFunction } from 'express';
import { ChatService } from './chat.service.js';
import { PostMessageDto, GetMessagesQueryDto, AskListerDto, BookSlotDto } from './dto/chat.dto.js';
import type { PostMessageDtoType, AskListerDtoType, BookSlotDtoType } from './dto/chat.dto.js';
import type {
  ChatMessagesResponse,
  ChatTurnResponse,
  SafeChatSession,
  SessionMemoryResponse,
} from './types/chat.types.js';
import { sendCreated, sendSuccess, sendBadRequest } from '../../utils/helpers/response.js';
import { createLogger } from '../../utils/helpers/logger.js';

const logger = createLogger('ChatController');

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  /**
   * Returns or creates a chat session for an authenticated visitor and property.
   *
   * @param req - Authenticated Express request containing the property ID
   * @param res - Express response used to return the session
   * @param next - Express error handler
   * @returns A promise that resolves after the response is sent
   */
  getOrCreateSession = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        sendBadRequest(res, 'Authentication required');
        return;
      }

      const { propertyId } = req.params;
      if (!propertyId) {
        sendBadRequest(res, 'Property ID is required');
        return;
      }

      logger.info(`getOrCreateSession user=${req.user.id} propertyId=${propertyId}`);
      const session = await this.chatService.getOrCreateSession(req.user.id, propertyId);
      sendSuccess<{ session: SafeChatSession }>(res, 'Chat session ready', { session });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Returns a paginated page of messages from an owned chat session.
   *
   * @param req - Authenticated Express request containing session and cursor data
   * @param res - Express response used to return messages
   * @param next - Express error handler
   * @returns A promise that resolves after the response is sent
   */
  getMessages = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const queryResult = GetMessagesQueryDto.safeParse(req.query);
      if (!queryResult.success) {
        const errors = queryResult.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        sendBadRequest(res, 'Validation failed', errors);
        return;
      }

      const result = await this.chatService.getMessages(req.user.id, sessionId, queryResult.data);
      sendSuccess<ChatMessagesResponse>(res, 'Messages retrieved', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Returns parsed memory for an owned chat session.
   *
   * @param req - Authenticated Express request containing the session ID
   * @param res - Express response used to return session memory
   * @param next - Express error handler
   * @returns A promise that resolves after the response is sent
   */
  getSessionMemory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const result = await this.chatService.getSessionMemory(req.user.id, sessionId);
      sendSuccess<SessionMemoryResponse>(res, 'Session memory retrieved', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Adds a visitor message and returns the generated assistant turn.
   *
   * @param req - Authenticated Express request containing message content
   * @param res - Express response used to return the chat turn
   * @param next - Express error handler
   * @returns A promise that resolves after the response is sent
   */
  postMessage = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const dtoResult = PostMessageDto.safeParse(req.body);
      if (!dtoResult.success) {
        const errors = dtoResult.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        sendBadRequest(res, 'Validation failed', errors);
        return;
      }

      const dto: PostMessageDtoType = dtoResult.data;
      logger.info(
        `postMessage user=${req.user.id} sessionId=${sessionId} contentPreview=${dto.content.slice(0, 80)}`,
      );
      const result = await this.chatService.postMessage(req.user.id, sessionId, dto);

      sendCreated<ChatTurnResponse>(res, 'Assistant response ready', result);
    } catch (error) {
      logger.warn(
        `postMessage failed sessionId=${req.params.sessionId}: ${error instanceof Error ? error.message : 'unknown'}`,
      );
      next(error);
    }
  };

  /**
   * Escalates an authenticated visitor's question to the lister.
   *
   * @param req - Authenticated Express request containing escalation details
   * @param res - Express response used to return the chat turn
   * @param next - Express error handler
   * @returns A promise that resolves after the response is sent
   */
  askLister = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const dtoResult = AskListerDto.safeParse(req.body);
      if (!dtoResult.success) {
        const errors = dtoResult.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        sendBadRequest(res, 'Validation failed', errors);
        return;
      }

      const dto: AskListerDtoType = dtoResult.data;
      const result = await this.chatService.askLister(req.user.id, sessionId, dto);

      sendCreated<ChatTurnResponse>(res, 'Question sent to lister', result);
    } catch (error) {
      next(error);
    }
  };

  /**
   * Books a selected viewing slot through an owned chat session.
   *
   * @param req - Authenticated Express request containing the slot selection
   * @param res - Express response used to return the booking turn
   * @param next - Express error handler
   * @returns A promise that resolves after the response is sent
   */
  bookSlot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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

      const dtoResult = BookSlotDto.safeParse(req.body);
      if (!dtoResult.success) {
        const errors = dtoResult.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        sendBadRequest(res, 'Validation failed', errors);
        return;
      }

      const dto: BookSlotDtoType = dtoResult.data;
      logger.info(`bookSlot user=${req.user.id} sessionId=${sessionId} slotId=${dto.slotId}`);
      const result = await this.chatService.bookSlot(req.user.id, sessionId, dto);

      sendCreated<ChatTurnResponse>(res, 'Viewing booked', result);
    } catch (error) {
      next(error);
    }
  };
}

export const chatController = new ChatController();
