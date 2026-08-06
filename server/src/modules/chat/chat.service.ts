import type { Prisma, ChatMessage, ChatSession } from '../../generated/client.js';
import prisma from '../../config/prisma.js';
import {
  agentLoop,
  emptySessionMemory,
  parseSessionMemory,
  sessionMemoryToJson,
  setActiveBookingPref,
  enrichListerQuestion,
  ALREADY_ASKED_LISTER_REPLY,
  API_FAILURE_ACK,
  pickOpeningGreeting,
} from '../../services/ai/index.js';
import type { ChatAction } from '../../services/ai/index.js';
import { createServiceError, ServiceError } from '../../utils/helpers/serviceError.js';
import { notDeleted } from '../../utils/helpers/softDelete.js';
import { AI } from '../../utils/constants/pagination.js';
import { isRecord } from '../../utils/helpers/json.js';
import type { PostMessageDtoType, GetMessagesQueryDtoType, AskListerDtoType, BookSlotDtoType } from './dto/chat.dto.js';
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
import { listerService } from '../lister/lister.service.js';
import { bookingsService } from '../bookings/bookings.service.js';
import { formatNzDateTime } from '../../utils/helpers/date.js';
import { createLogger } from '../../utils/helpers/logger.js';
import { propertiesService } from '../properties/properties.service.js';

const logger = createLogger('ChatService');

/**
 * Converts stored JSON into the supported chat-action shape.
 *
 * @param value - Persisted action JSON
 * @returns Valid actions, or null when no valid actions are present
 */
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
      const action: ChatAction = { type, label };
      const payloadRaw = item.payload;
      if (isRecord(payloadRaw)) {
        const payload: Record<string, string | number | boolean> = {};
        for (const [key, payloadValue] of Object.entries(payloadRaw)) {
          if (
            typeof payloadValue === 'string' ||
            typeof payloadValue === 'number' ||
            typeof payloadValue === 'boolean'
          ) {
            payload[key] = payloadValue;
          }
        }
        if (Object.keys(payload).length > 0) {
          action.payload = payload;
        }
      }
      actions.push(action);
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

  /**
   * Returns a user's chat session for a property, creating it when needed.
   *
   * @param userId - ID of the session owner
   * @param propertyId - ID of the property being discussed
   * @returns The safe session representation
   * @throws {ServiceError} if the property does not exist
   */
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

    await this.ensureOpeningGreeting(session.id);

    return this.toSafeSession(session);
  }

  /**
   * Adds an opening greeting when a session has no messages.
   *
   * @param sessionId - ID of the session to initialize
   */
  private async ensureOpeningGreeting(sessionId: string): Promise<void> {
    await prisma.$transaction(async (tx) => {
      const existingCount = await tx.chatMessage.count({
        where: { sessionId, ...notDeleted() },
      });

      if (existingCount > 0) {
        return;
      }

      const session = await tx.chatSession.findFirst({
        where: { id: sessionId, ...notDeleted() },
        select: {
          property: { select: { title: true } },
        },
      });

      await tx.chatMessage.create({
        data: {
          sessionId,
          role: 'ASSISTANT',
          content: pickOpeningGreeting(session?.property.title),
          answerStatus: 'UNKNOWN',
        },
      });
    });
  }

  /**
   * Retrieves an owned session's messages using backwards cursor pagination.
   *
   * @param userId - ID of the session owner
   * @param sessionId - ID of the session to read
   * @param query - Pagination options
   * @returns Messages and their pagination metadata
   * @throws {ServiceError} if the session or cursor message is unavailable
   */
  async getMessages(
    userId: string,
    sessionId: string,
    query: GetMessagesQueryDtoType,
  ): Promise<ChatMessagesResponse> {
    await this.verifySessionOwnership(userId, sessionId);

    // [NOTE] Backfills a greeting for sessions created before opening greetings were introduced.
    if (!query.before) {
      await this.ensureOpeningGreeting(sessionId);
    }

    const limit = query.limit;
    const whereBase = { sessionId, ...notDeleted() };

    const total = await prisma.chatMessage.count({ where: whereBase });

    let cursorCreatedAt: Date | undefined;
    if (query.before) {
      const cursorMessage = await prisma.chatMessage.findFirst({
        where: { id: query.before, sessionId, ...notDeleted() },
      });

      if (!cursorMessage) {
        throw createServiceError(404, 'Message not found');
      }

      cursorCreatedAt = cursorMessage.createdAt;
    }

    const messages = await prisma.chatMessage.findMany({
      where: cursorCreatedAt
        ? { ...whereBase, createdAt: { lt: cursorCreatedAt } }
        : whereBase,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });

    messages.reverse();

    const oldestInBatch = messages[0];
    const newestInBatch = messages[messages.length - 1];

    let hasMoreOlder = false;
    if (oldestInBatch) {
      const olderCount = await prisma.chatMessage.count({
        where: {
          ...whereBase,
          createdAt: { lt: oldestInBatch.createdAt },
        },
      });
      hasMoreOlder = olderCount > 0;
    }

    return {
      messages: messages.map((message) => this.toSafeMessage(message)),
      pagination: {
        limit,
        total,
        hasMoreOlder,
        oldestMessageId: oldestInBatch?.id ?? null,
        newestMessageId: newestInBatch?.id ?? null,
      },
    };
  }

  /**
   * Retrieves the parsed memory for an owned chat session.
   *
   * @param userId - ID of the session owner
   * @param sessionId - ID of the session to read
   * @returns The session memory
   * @throws {ServiceError} if the session is not owned by the user
   */
  async getSessionMemory(userId: string, sessionId: string): Promise<SessionMemoryResponse> {
    const session = await this.verifySessionOwnership(userId, sessionId);
    return { memory: parseSessionMemory(session.contextMemory) };
  }

  /**
   * Persists a visitor message and generates its assistant response.
   *
   * @param userId - ID of the session owner
   * @param sessionId - ID of the target chat session
   * @param dto - Validated visitor message
   * @returns The completed chat turn and agent metadata
   * @throws {ServiceError} if the session or property is unavailable
   */
  async postMessage(userId: string, sessionId: string, dto: PostMessageDtoType): Promise<ChatTurnResponse> {
    const session = await this.verifySessionOwnership(userId, sessionId);

    const property = await prisma.property.findFirst({
      where: { id: session.propertyId, ...notDeleted() },
    });

    if (!property) {
      logger.warn(
        `postMessage property missing sessionId=${sessionId} propertyId=${session.propertyId} userId=${userId}`,
      );
      throw createServiceError(404, 'Property not found');
    }

    logger.info(
      `postMessage start sessionId=${sessionId} propertyId=${property.id} title="${property.title}"`,
    );

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

    let agentResult;
    try {
      agentResult = await agentLoop.run(
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
        {
          rentWeekly: property.rentWeekly,
          bond: property.bond,
          price: property.price,
          bedrooms: property.bedrooms,
          bathrooms: property.bathrooms,
        },
      );
    } catch (error) {
      logger.error(`postMessage agent failure sessionId=${sessionId}`, error);
      agentResult = {
        content: API_FAILURE_ACK,
        answerStatus: 'UNKNOWN' as const,
        facts: [],
        actions: [],
        debug: {
          intents: ['api_failure'],
          attributes: [],
          tools: [],
          cta: null,
        },
        toolsCalled: [],
        rawTrace: [{ error: 'agent_loop_failed' }],
        latencyMs: 0,
      };
    }

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
      userMessage: this.toSafeMessage(userMessage),
      answer_status: agentResult.answerStatus,
      facts: agentResult.facts,
      actions: agentResult.actions,
      debug: agentResult.debug,
    };
  }

  /**
   * Escalates a visitor question to the listing's lister.
   *
   * @param userId - ID of the session owner
   * @param sessionId - ID of the target chat session
   * @param dto - Validated lister question
   * @returns The persisted escalation chat turn
   * @throws {ServiceError} if the session or property is unavailable
   */
  async askLister(userId: string, sessionId: string, dto: AskListerDtoType): Promise<ChatTurnResponse> {
    const session = await this.verifySessionOwnership(userId, sessionId);

    const property = await prisma.property.findFirst({
      where: { id: session.propertyId, ...notDeleted() },
    });

    if (!property) {
      throw createServiceError(404, 'Property not found');
    }

    const recentForEnrichment = await prisma.chatMessage.findMany({
      where: { sessionId, ...notDeleted() },
      orderBy: { createdAt: 'desc' },
      take: 12,
      select: { role: true, content: true },
    });
    recentForEnrichment.reverse();

    const questionText = enrichListerQuestion(
      dto.questionText,
      recentForEnrichment.map((message) => ({
        role: message.role,
        content: message.content,
      })),
    );

    if (questionText !== dto.questionText.trim()) {
      logger.info(
        `askLister enriched bare question sessionId=${sessionId} from=${dto.questionText.slice(0, 80)} to=${questionText.slice(0, 160)}`,
      );
    }

    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'USER',
        content: questionText,
      },
    });

    const escalation = await listerService.createQuestion({
      propertyId: session.propertyId,
      sessionId,
      userId,
      questionText,
      canonicalAttributes: dto.canonicalAttributes,
    });

    let assistantContent: string;
    if (escalation.alreadyAsked) {
      assistantContent = ALREADY_ASKED_LISTER_REPLY;
    } else if (escalation.delivered) {
      assistantContent =
        'I have sent your question to the lister. They will review it and publish an approved answer when ready.';
    } else {
      assistantContent = 'I could not deliver your question to the lister. Please try again shortly.';
    }

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: assistantContent,
        answerStatus: 'LIMITED',
        metadata: {
          escalation: {
            questionId: escalation.questionId,
            delivered: escalation.delivered,
          },
        },
      },
    });

    await prisma.turnLog.create({
      data: {
        sessionId,
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
        intents: stringArrayToJson(['ask_lister']),
        attributes: stringArrayToJson(dto.canonicalAttributes ?? []),
        entities: stringArrayToJson([]),
        toolsCalled: toolCallsToJson([
          {
            name: 'send_question_to_lister',
            arguments: {},
            result: JSON.stringify(escalation),
          },
        ]),
        sources: chatFactsToJson([]),
        answerStatus: 'LIMITED',
        cta: optionalJsonObject(null),
        rawModelTrace: rawTraceToJson([]),
        latencyMs: 0,
      },
    });

    return {
      message: this.toSafeMessage(assistantMessage),
      answer_status: 'LIMITED',
      facts: [],
      actions: [],
      debug: {
        intents: ['ask_lister'],
        attributes: dto.canonicalAttributes ?? [],
        tools: ['send_question_to_lister'],
        cta: null,
      },
    };
  }

  /**
   * Books a viewing slot and records the outcome in the conversation.
   *
   * @param userId - ID of the session owner
   * @param sessionId - ID of the target chat session
   * @param dto - Validated slot selection
   * @returns The booking chat turn, including failure acknowledgement when applicable
   * @throws {ServiceError} if the session or selected slot is unavailable
   */
  async bookSlot(userId: string, sessionId: string, dto: BookSlotDtoType): Promise<ChatTurnResponse> {
    const session = await this.verifySessionOwnership(userId, sessionId);

    const slot = await prisma.availabilitySlot.findFirst({
      where: {
        id: dto.slotId,
        propertyId: session.propertyId,
        ...notDeleted(),
      },
    });

    if (!slot) {
      throw createServiceError(404, 'Slot not found for this property');
    }

    const slotLabel = formatNzDateTime(slot.startsAt);
    const userMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'USER',
        content: `Book me in for ${slotLabel}`,
      },
    });

    let result;
    try {
      result = await bookingsService.createBooking(userId, {
        propertyId: session.propertyId,
        slotId: dto.slotId,
      });
    } catch (error) {
      const message =
        error instanceof ServiceError
          ? error.message
          : 'Sorry, that booking could not be completed. Please try another time.';

      let availableHint = '';
      try {
        const availability = await propertiesService.getAvailability(session.propertyId, {});
        if (availability.slots.length > 0) {
          availableHint =
            '\n\nHere are some other times you can try — pick a slot below or ask me for another date.';
        } else {
          availableHint =
            '\n\nThere are no free viewing times right now. Ask me to check another date.';
        }
      } catch {
        // [NOTE] The original booking failure remains the actionable result if alternatives cannot load.
      }

      const assistantMessage = await prisma.chatMessage.create({
        data: {
          sessionId,
          role: 'ASSISTANT',
          content: `${message}${availableHint}`,
          answerStatus: 'UNKNOWN',
        },
      });

      logger.warn(
        `bookSlot failed sessionId=${sessionId} slotId=${dto.slotId}: ${message}`,
      );

      return {
        message: this.toSafeMessage(assistantMessage),
        answer_status: 'UNKNOWN',
        facts: [],
        actions: [],
        debug: {
          intents: ['book_slot_failed'],
          attributes: [],
          tools: ['create_booking'],
          cta: null,
        },
      };
    }

    const sessionMemory = parseSessionMemory(
      (
        await prisma.chatSession.findFirst({
          where: { id: sessionId },
          select: { contextMemory: true },
        })
      )?.contextMemory ?? {},
    );
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: {
        contextMemory: sessionMemoryToJson(
          setActiveBookingPref(sessionMemory, {
            bookingId: result.booking.id,
            slotLabel,
            startsAt: slot.startsAt.toISOString(),
          }),
        ),
      },
    });

    const assistantMessage = await prisma.chatMessage.create({
      data: {
        sessionId,
        role: 'ASSISTANT',
        content: `${result.confirmationMessage}\n\nYou can review or cancel it anytime under **My bookings**.`,
        answerStatus: 'VERIFIED',
        metadata: {
          booking: {
            bookingId: result.booking.id,
            slotId: result.booking.slotId,
          },
        },
      },
    });

    // [WHY] Earlier slot buttons may now point to unavailable slots after a confirmed booking.
    const priorWithActions = await prisma.chatMessage.findMany({
      where: {
        sessionId,
        role: 'ASSISTANT',
        id: { not: assistantMessage.id },
        ...notDeleted(),
      },
      select: { id: true, actions: true },
    });

    for (const message of priorWithActions) {
      const actions = parseActions(message.actions);
      if (!actions?.some((action) => action.type === 'book_slot')) {
        continue;
      }
      const remaining = actions.filter((action) => action.type !== 'book_slot');
      await prisma.chatMessage.update({
        where: { id: message.id },
        data: {
          actions: remaining.length > 0 ? chatActionsToJson(remaining) : [],
        },
      });
    }

    await prisma.turnLog.create({
      data: {
        sessionId,
        userMessageId: userMessage.id,
        assistantMessageId: assistantMessage.id,
        intents: stringArrayToJson(['book_slot']),
        attributes: stringArrayToJson([]),
        entities: stringArrayToJson([]),
        toolsCalled: toolCallsToJson([
          {
            name: 'create_booking',
            arguments: { slot_id: dto.slotId },
            result: JSON.stringify({
              bookingId: result.booking.id,
              confirmationMessage: result.confirmationMessage,
            }),
          },
        ]),
        sources: chatFactsToJson([]),
        answerStatus: 'VERIFIED',
        cta: optionalJsonObject(null),
        rawModelTrace: rawTraceToJson([]),
        latencyMs: 0,
      },
    });

    return {
      message: this.toSafeMessage(assistantMessage),
      userMessage: this.toSafeMessage(userMessage),
      answer_status: 'VERIFIED',
      facts: [],
      actions: [],
      debug: {
        intents: ['book_slot'],
        attributes: [],
        tools: ['create_booking'],
        cta: null,
      },
    };
  }

  /**
   * Ensures a chat session belongs to the requesting user.
   *
   * @param userId - ID of the requesting user
   * @param sessionId - ID of the session to verify
   * @returns The owned session
   * @throws {ServiceError} if no active owned session exists
   */
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
