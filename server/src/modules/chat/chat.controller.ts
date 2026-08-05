import type { Request, Response, NextFunction } from 'express';
import { ChatService } from './chat.service.js';
import { PostMessageDto } from './dto/chat.dto.js';
import type { PostMessageDtoType } from './dto/chat.dto.js';
import type {
  ChatMessagesResponse,
  ChatTurnResponse,
  SafeChatSession,
  SessionMemoryResponse,
} from './types/chat.types.js';
import { sendCreated, sendSuccess, sendBadRequest } from '../../utils/helpers/response.js';

export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

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

      const session = await this.chatService.getOrCreateSession(req.user.id, propertyId);
      sendSuccess<{ session: SafeChatSession }>(res, 'Chat session ready', { session });
    } catch (error) {
      next(error);
    }
  };

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

      const result = await this.chatService.getMessages(req.user.id, sessionId);
      sendSuccess<ChatMessagesResponse>(res, 'Messages retrieved', result);
    } catch (error) {
      next(error);
    }
  };

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
      const result = await this.chatService.postMessage(req.user.id, sessionId, dto);

      sendCreated<ChatTurnResponse>(res, 'Assistant response ready', result);
    } catch (error) {
      next(error);
    }
  };
}

export const chatController = new ChatController();
