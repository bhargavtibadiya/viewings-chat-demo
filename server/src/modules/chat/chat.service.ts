import type { Prisma, ChatMessage, ChatSession } from '#generated/client.js';
import prisma from '../../config/prisma.js';
import { agentLoop } from '../../services/ai/agentLoop.js';
import {
  emptySessionMemory,
  parseSessionMemory,
  sessionMemoryToJson,
} from '../../services/ai/tools/sessionMemory.js';
import { createServiceError } from '../../utils/helpers/serviceError.js';
import { notDeleted } from '../../utils/helpers/softDelete.js';
import { AI } from '../../utils/constants/pagination.js';
import { isRecord } from '../../utils/helpers/json.js';
import type { PostMessageDtoType } from './dto/chat.dto.js';
import type {
  ChatMessagesResponse,
  ChatTurnResponse,
  SafeChatMessage,
  SafeChatSession,
  SessionMemoryResponse,
} from './types/chat.types.js';
import {
  chatActionsToJson,
  chatFactsToJson,
  optionalJsonObject,
  rawTraceToJson,
  stringArrayToJson,
  toolCallsToJson,
} from './helpers/chatJson.js';
import type { ChatAction } from '../../services/ai/types/ai.types.js';

function parseActions(value: Prisma.JsonValue | null): ChatAction[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const actions: ChatAction[] = [];
  for (const item of value) {
    if (!isRecord(item)) {
      continue;
    }
    const type = item.type;
    const label = item.label;
    if (typeof type === 'string' && typeof label === 'string') {
      actions.push({ type, label });
    }
  }

  return actions.length > 0 ? actions : null;
}

export class ChatService {
  private toSafeMessage(message: ChatMessage): SafeChatMessage {
    return {
      id: message.id,
      sessionId: message.sessionId,
      role: message.role,
      content: message.content,
      answerStatus: message.answerStatus,
      actions: parseActions(message.actions),
      createdAt: message.createdAt.toISOString(),
    };
  }

  private toSafeSession(session: ChatSession): SafeChatSession {
    return {
      id: session.id,
      userId: session.userId,
      propertyId: session.propertyId,
      contextMemory: parseSessionMemory(session.contextMemory),
      createdAt: session.createdAt.toISOString(),
      updatedAt: session.updatedAt.toISOString(),
    };
  }

  async getOrCreateSession(userId: string, propertyId: string): Promise<SafeChatSession> {
    const property = await prisma.property.findFirst({
      where: { id: propertyId, ...notDeleted() },
    });

    if (!property) {
      throw createServiceError(404, 'Property not found');
    }

    const session = await prisma.chatSession.upsert({
      where: {
        userId_propertyId: { userId, propertyId },
      },
      create: {
        userId,
        propertyId,
        contextMemory: sessionMemoryToJson(emptySessionMemory()),
      },
      update: {},
    });

    return this.toSafeSession(session);
  }

  async getMessages(userId: string, sessionId: string): Promise<ChatMessagesResponse> {
    await this.verifySessionOwnership(userId, sessionId);

    const messages = await prisma.chatMessage.findMany({
      where: { sessionId, ...notDeleted() },
      orderBy: { createdAt: 'asc' },
    });

    return { messages: messages.map((message) => this.toSafeMessage(message)) };
  }

  async getSessionMemory(userId: string, sessionId: string): Promise<SessionMemoryResponse> {
    const session = await this.verifySessionOwnership(userId, sessionId);
    return { memory: parseSessionMemory(session.contextMemory) };
  }

  async postMessage(userId: string, sessionId: string, dto: PostMessageDtoType): Promise<ChatTurnResponse> {
    const session = await this.verifySessionOwnership(userId, sessionId);

    const property = await prisma.property.findFirst({
      where: { id: session.propertyId, ...notDeleted() },
    });

    if (!property) {
      throw createServiceError(404, 'Property not found');
    }

    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'USER',
        content: dto.content,
      },
    });

    const recentMessages = await prisma.chatMessage.findMany({
      where: { sessionId, ...notDeleted() },
      orderBy: { createdAt: 'desc' },
      take: AI.MAX_RECENT_MESSAGES,
    });

    recentMessages.reverse();

    const agentResult = await agentLoop.run(
      {
        sessionId,
        userId,
        propertyId: session.propertyId,
        userMessage: dto.content,
        listingType: property.listingType,
      },
      recentMessages.filter((message) => message.id !== userMessage.id),
      property.listingType,
      property.title,
    );

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: agentResult.content,
        answerStatus: agentResult.answerStatus,
        actions: chatActionsToJson(agentResult.actions),
        metadata: {
          facts: chatFactsToJson(agentResult.facts),
        },
      },
    });

    await prisma.turnLog.create({
      data: {
        sessionId,
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
        intents: stringArrayToJson(agentResult.debug.intents),
        attributes: stringArrayToJson(agentResult.debug.attributes),
        entities: stringArrayToJson([]),
        toolsCalled: toolCallsToJson(agentResult.toolsCalled),
        sources: chatFactsToJson(agentResult.facts),
        answerStatus: agentResult.answerStatus,
        cta: optionalJsonObject(
          agentResult.debug.cta ? { type: agentResult.debug.cta } : null,
        ),
        rawModelTrace: rawTraceToJson(agentResult.rawTrace),
        latencyMs: agentResult.latencyMs,
      },
    });

    return {
      message: this.toSafeMessage(assistantMessage),
      answer_status: agentResult.answerStatus,
      facts: agentResult.facts,
      actions: agentResult.actions,
      debug: agentResult.debug,
    };
  }

  private async verifySessionOwnership(userId: string, sessionId: string): Promise<ChatSession> {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId, ...notDeleted() },
    });

    if (!session) {
      throw createServiceError(404, 'Chat session not found');
    }

    return session;
  }
}

export const chatService = new ChatService();
