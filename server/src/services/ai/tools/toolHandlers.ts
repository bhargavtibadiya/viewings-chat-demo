import prisma from '../../../config/prisma.js';
import { propertiesService } from '../../../modules/properties/properties.service.js';
import { bookingsService } from '../../../modules/bookings/bookings.service.js';
import { listerService } from '../../../modules/lister/lister.service.js';
import { leadsService } from '../../../modules/leads/leads.service.js';
import { notDeleted } from '../../../utils/helpers/softDelete.js';
import {
  clearActiveBookingPref,
  getBooleanArg,
  getNumberArg,
  getStringArg,
  getStringArrayArg,
  parseSessionMemory,
  parseToolArguments,
  sessionMemoryToJson,
  setActiveBookingPref,
  setPreferredDatePref,
  upsertMemoryFact,
} from './sessionMemory.js';
import { buildMemoryToolAttributes } from '../helpers/memoryAttributes.js';
import { enrichListerQuestion } from '../helpers/enrichListerQuestion.js';
import { resolveAvailabilitySlot } from '../helpers/resolveAvailabilitySlot.js';
import { sanitizePropertyDetailForListingType } from '../policies/listingTypePolicy.js';
import { EMPTY_SLOTS_HINT } from '../policies/scopeGuard.js';
import type { AgentContext, SessionMemory } from '../types/ai.types.js';
import { createLogger } from '../../../utils/helpers/logger.js';
import { ServiceError } from '../../../utils/helpers/serviceError.js';

const logger = createLogger('ToolHandlers');

export class ToolHandlers {
  async executeTool(
    toolName: string,
    rawArguments: string,
    context: AgentContext,
  ): Promise<string> {
    try {
      const args = parseToolArguments(rawArguments);

      switch (toolName) {
        case 'get_property':
          return await this.getProperty(this.resolvePropertyId(args, context), context);
        case 'search_listings':
          return await this.searchListings(args);
        case 'get_availability':
          return await this.getAvailability(this.resolvePropertyId(args, context), args, context);
        case 'create_booking':
          return await this.createBooking(context.userId, args, context);
        case 'cancel_booking':
          return await this.cancelBooking(context.userId, args, context);
        case 'send_question_to_lister':
          return await this.sendQuestionToLister(context, args);
        case 'get_open_lister_questions':
          return await this.getOpenListerQuestions(context, args);
        case 'capture_contact':
          return await this.captureContact(context.userId, args);
        case 'request_callback':
          return await this.requestCallback(context.userId, args, context);
        case 'read_session_memory':
          return await this.readSessionMemory(
            getStringArg(args, 'session_id') ?? context.sessionId,
            args,
            context,
          );
        case 'write_session_memory':
          return await this.writeSessionMemory(
            getStringArg(args, 'session_id') ?? context.sessionId,
            args,
          );
        case 'get_approved_answers':
          return await this.getApprovedAnswers(this.resolvePropertyId(args, context), args);
        default:
          return JSON.stringify({ error: `Unknown tool: ${toolName}` });
      }
    } catch (error) {
      if (error instanceof ServiceError) {
        logger.warn(`Tool ${toolName} failed: ${error.message}`);
        return JSON.stringify({
          error: error.message,
          statusCode: error.statusCode,
          tool: toolName,
        });
      }
      logger.error(`Tool ${toolName} unexpected error`, error);
      return JSON.stringify({
        error: 'Tool execution failed',
        tool: toolName,
      });
    }
  }

  private resolvePropertyId(args: Record<string, unknown>, context: AgentContext): string {
    const requested = getStringArg(args, 'property_id');
    if (requested && requested !== context.propertyId) {
      logger.warn(
        `Ignoring tool property_id=${requested}; using session propertyId=${context.propertyId}`,
      );
    }
    return context.propertyId;
  }

  private async loadSessionMemory(sessionId: string): Promise<{
    sessionId: string;
    memory: SessionMemory;
  } | null> {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, ...notDeleted() },
    });
    if (!session) {
      return null;
    }
    return { sessionId: session.id, memory: parseSessionMemory(session.contextMemory) };
  }

  private async saveSessionMemory(sessionId: string, memory: SessionMemory): Promise<void> {
    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { contextMemory: sessionMemoryToJson(memory) },
    });
  }

  private async getProperty(propertyId: string, context: AgentContext): Promise<string> {
    const property = await propertiesService.getPropertyForTools(propertyId);
    const sanitized = sanitizePropertyDetailForListingType({
      ...property,
      listingType: context.listingType,
    });

    // Persist core pricing/facts so later turns stay consistent.
    const loaded = await this.loadSessionMemory(context.sessionId);
    if (loaded) {
      let memory = loaded.memory;
      if (sanitized.listingType === 'RENTAL' && sanitized.rentWeekly != null) {
        memory = upsertMemoryFact(memory, {
          attribute: 'weekly_rent',
          value: String(sanitized.rentWeekly),
          source: 'listing_attribute',
        });
      }
      if (sanitized.listingType === 'RENTAL' && sanitized.bond != null) {
        memory = upsertMemoryFact(memory, {
          attribute: 'bond',
          value: String(sanitized.bond),
          source: 'listing_attribute',
        });
      }
      if (sanitized.listingType === 'SALE' && sanitized.price != null) {
        memory = upsertMemoryFact(memory, {
          attribute: 'price',
          value: String(sanitized.price),
          source: 'listing_attribute',
        });
      }
      await this.saveSessionMemory(loaded.sessionId, memory);
    }

    return JSON.stringify(sanitized);
  }

  private async searchListings(args: Record<string, unknown>): Promise<string> {
    const listingTypeRaw = getStringArg(args, 'listing_type');
    const listingType =
      listingTypeRaw === 'RENTAL' || listingTypeRaw === 'SALE' ? listingTypeRaw : undefined;

    const results = await propertiesService.searchListings({
      search: getStringArg(args, 'search'),
      listingType,
      suburb: getStringArg(args, 'suburb'),
      bedrooms: getNumberArg(args, 'bedrooms'),
      limit: getNumberArg(args, 'limit'),
    });

    return JSON.stringify({ listings: results });
  }

  private async getAvailability(
    propertyId: string,
    args: Record<string, unknown>,
    context: AgentContext,
  ): Promise<string> {
    const fromIso = getStringArg(args, 'from_iso');
    const toIso = getStringArg(args, 'to_iso');

    const result = await propertiesService.getAvailability(propertyId, {
      from: fromIso,
      to: toIso,
    });

    const loaded = await this.loadSessionMemory(context.sessionId);
    if (loaded && (fromIso || toIso)) {
      const memory = setPreferredDatePref(loaded.memory, { fromIso, toIso });
      await this.saveSessionMemory(loaded.sessionId, memory);
    }

    if (result.slots.length === 0) {
      return JSON.stringify({
        ...result,
        empty: true,
        message: EMPTY_SLOTS_HINT,
        hint: 'Offer another date and call get_availability again with from_iso/to_iso for that day or range.',
      });
    }

    return JSON.stringify(result);
  }

  private async createBooking(
    userId: string,
    args: Record<string, unknown>,
    context: AgentContext,
  ): Promise<string> {
    const propertyId = this.resolvePropertyId(args, context);
    const slotIdArg = getStringArg(args, 'slot_id');
    const preferredStartsAt = getStringArg(args, 'preferred_starts_at');
    const slotLabel = getStringArg(args, 'slot_label');

    if (!slotIdArg && !preferredStartsAt && !slotLabel) {
      return JSON.stringify({
        error: 'Missing required booking fields',
        required: ['property_id', 'slot_id or slot_label'],
      });
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, ...notDeleted() },
      select: { name: true, email: true },
    });

    if (!user) {
      return JSON.stringify({ error: 'Authenticated user not found' });
    }

    const contactName = getStringArg(args, 'contact_name') ?? user.name;
    const contactEmail = getStringArg(args, 'contact_email') ?? user.email;

    try {
      const availability = await propertiesService.getAvailability(propertyId, {});
      const resolved = resolveAvailabilitySlot(availability.slots, {
        slotId: slotIdArg,
        preferredStartsAt,
        slotLabel,
      });

      if (!resolved) {
        return JSON.stringify({
          error: 'Could not match that viewing time to an available slot',
          hint: 'Call get_availability and pass the exact slot_id from the response',
          availableSlots: availability.slots.map((slot) => ({
            id: slot.id,
            label: slot.label,
            startsAt: slot.startsAt,
            endsAt: slot.endsAt,
            timezone: slot.timezone,
          })),
        });
      }

      const result = await bookingsService.createBookingFromTool(userId, {
        propertyId,
        slotId: resolved.id,
        contactName,
        contactEmail,
        contactPhone: getStringArg(args, 'contact_phone'),
        notes: getStringArg(args, 'notes'),
      });

      const loaded = await this.loadSessionMemory(context.sessionId);
      if (loaded) {
        const memory = setActiveBookingPref(loaded.memory, {
          bookingId: result.booking.id,
          slotLabel: resolved.label,
          startsAt: resolved.startsAt,
        });
        await this.saveSessionMemory(loaded.sessionId, memory);
      }

      return JSON.stringify({
        ...result,
        bookedSlot: {
          id: resolved.id,
          label: resolved.label,
          startsAt: resolved.startsAt,
        },
      });
    } catch (error) {
      if (error instanceof ServiceError) {
        logger.warn(`create_booking failed: ${error.message}`);
        const availability = await propertiesService.getAvailability(propertyId, {}).catch(() => null);
        return JSON.stringify({
          error: error.message,
          statusCode: error.statusCode,
          availableSlots:
            availability?.slots.map((slot) => ({
              id: slot.id,
              label: slot.label,
              startsAt: slot.startsAt,
              endsAt: slot.endsAt,
              timezone: slot.timezone,
            })) ?? [],
          message:
            'Booking failed. Share the error briefly and offer the availableSlots (UI will show buttons). Do not invent a confirmation.',
        });
      }
      throw error;
    }
  }

  private async resolveBookingIdForCancel(
    userId: string,
    context: AgentContext,
    args: Record<string, unknown>,
  ): Promise<string | null> {
    const explicit = getStringArg(args, 'booking_id');
    if (explicit) {
      return explicit;
    }

    const loaded = await this.loadSessionMemory(context.sessionId);
    const fromMemory = loaded?.memory.prefs.active_booking_id;
    if (typeof fromMemory === 'string' && fromMemory.length > 0) {
      return fromMemory;
    }

    const latest = await prisma.booking.findFirst({
      where: {
        userId,
        propertyId: context.propertyId,
        status: 'CONFIRMED',
        ...notDeleted(),
      },
      orderBy: { createdAt: 'desc' },
      select: { id: true },
    });

    return latest?.id ?? null;
  }

  private async cancelBooking(
    userId: string,
    args: Record<string, unknown>,
    context: AgentContext,
  ): Promise<string> {
    const bookingId = await this.resolveBookingIdForCancel(userId, context, args);
    if (!bookingId) {
      return JSON.stringify({
        error: 'No booking found to cancel for this property',
        statusCode: 404,
        hint: 'Ask the user to open My bookings, or confirm which viewing they mean.',
      });
    }

    try {
      const booking = await bookingsService.cancelBookingFromTool(userId, bookingId);
      const loaded = await this.loadSessionMemory(context.sessionId);
      if (loaded) {
        const memory = clearActiveBookingPref(loaded.memory);
        await this.saveSessionMemory(loaded.sessionId, memory);
      }
      return JSON.stringify({ booking, cancelled: true, bookingId });
    } catch (error) {
      if (error instanceof ServiceError) {
        return JSON.stringify({
          error: error.message,
          statusCode: error.statusCode,
          bookingId,
          message:
            'Cancel failed. Explain briefly (e.g. already cancelled / not found) and point the user to My bookings if needed.',
        });
      }
      throw error;
    }
  }

  private async sendQuestionToLister(context: AgentContext, args: Record<string, unknown>): Promise<string> {
    const propertyId = this.resolvePropertyId(args, context);
    const rawQuestionText = getStringArg(args, 'question_text');

    if (!rawQuestionText) {
      return JSON.stringify({ error: 'question_text is required' });
    }

    let history = context.recentMessages ?? [];
    if (history.length === 0) {
      const recent = await prisma.chatMessage.findMany({
        where: { sessionId: context.sessionId, ...notDeleted() },
        orderBy: { createdAt: 'desc' },
        take: 12,
        select: { role: true, content: true },
      });
      history = recent.reverse().map((message) => ({
        role: message.role,
        content: message.content,
      }));
    }

    const questionText = enrichListerQuestion(rawQuestionText, [
      ...history,
      { role: 'USER', content: context.userMessage },
    ]);

    if (questionText !== rawQuestionText.trim()) {
      logger.info(
        `Enriched bare lister question sessionId=${context.sessionId} from=${rawQuestionText.slice(0, 80)} to=${questionText.slice(0, 160)}`,
      );
    }

    const result = await listerService.createQuestion({
      propertyId,
      sessionId: context.sessionId,
      userId: context.userId,
      questionText,
      resolvedIntent: getStringArg(args, 'resolved_intent'),
      canonicalAttributes: getStringArrayArg(args, 'canonical_attributes'),
    });

    if (result.alreadyAsked) {
      return JSON.stringify({
        alreadyAsked: true,
        questionId: result.questionId,
        questionText: result.questionText,
        status: result.status,
        delivered: true,
        message:
          "A similar question is already open with the lister. Tell the user you've already asked and will share the answer when they respond. Do not offer to ask again.",
      });
    }

    return JSON.stringify({
      alreadyAsked: false,
      questionId: result.questionId,
      questionText: result.questionText,
      status: result.status,
      delivered: result.delivered,
    });
  }

  private async getOpenListerQuestions(
    context: AgentContext,
    args: Record<string, unknown>,
  ): Promise<string> {
    const propertyId = this.resolvePropertyId(args, context);
    const questions = await listerService.listOpenQuestionsForSession({
      propertyId,
      sessionId: context.sessionId,
      userId: context.userId,
    });

    return JSON.stringify({
      openQuestions: questions.map((question) => ({
        questionId: question.id,
        questionText: question.questionText,
        canonicalAttributes: question.canonicalAttributes ?? [],
      })),
      count: questions.length,
    });
  }

  private async captureContact(userId: string, args: Record<string, unknown>): Promise<string> {
    const name = getStringArg(args, 'name');
    const email = getStringArg(args, 'email');
    const purpose = getStringArg(args, 'purpose');
    const consent = getBooleanArg(args, 'consent');

    if (!name || !email || !purpose || consent !== true) {
      return JSON.stringify({ error: 'name, email, purpose, and consent=true are required' });
    }

    const lead = await leadsService.captureContact({
      userId,
      propertyId: getStringArg(args, 'property_id'),
      name,
      email,
      phone: getStringArg(args, 'phone'),
      purpose,
      consent,
    });

    return JSON.stringify({ lead, captured: true });
  }

  private async requestCallback(
    userId: string,
    args: Record<string, unknown>,
    context: AgentContext,
  ): Promise<string> {
    const propertyId = this.resolvePropertyId(args, context);
    const contact = getStringArg(args, 'contact');

    if (!contact) {
      return JSON.stringify({ error: 'property_id and contact are required' });
    }

    const callback = await leadsService.requestCallback({
      userId,
      propertyId,
      contact,
      preferredTime: getStringArg(args, 'preferred_time'),
      notes: getStringArg(args, 'notes'),
    });

    return JSON.stringify({ callback, requested: true });
  }

  private async readSessionMemory(
    sessionId: string,
    args: Record<string, unknown>,
    context: AgentContext,
  ): Promise<string> {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, ...notDeleted() },
    });

    if (!session) {
      return JSON.stringify({ error: 'Session not found' });
    }

    const memory = parseSessionMemory(session.contextMemory);
    const propertyId = this.resolvePropertyId(args, context);

    const approved = await prisma.approvedAnswer.findMany({
      where: { propertyId, ...notDeleted() },
      orderBy: { approvedAt: 'desc' },
      take: 20,
    });

    return JSON.stringify({
      memory,
      approvedAnswers: approved,
      attributes: buildMemoryToolAttributes(memory, approved),
    });
  }

  private async writeSessionMemory(sessionId: string, args: Record<string, unknown>): Promise<string> {
    const attribute = getStringArg(args, 'attribute');
    const value = getStringArg(args, 'value');
    const source = getStringArg(args, 'source');

    if (!attribute || !value || !source) {
      return JSON.stringify({ error: 'attribute, value, and source are required' });
    }

    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, ...notDeleted() },
    });

    if (!session) {
      return JSON.stringify({ error: 'Session not found' });
    }

    const memory = parseSessionMemory(session.contextMemory);
    const updated = upsertMemoryFact(memory, {
      attribute,
      value,
      source,
      questionId: getStringArg(args, 'question_id'),
    });

    const lastTopic = getStringArg(args, 'last_topic');
    if (lastTopic) {
      updated.last_topic = lastTopic;
    }

    await prisma.chatSession.update({
      where: { id: sessionId },
      data: { contextMemory: sessionMemoryToJson(updated) },
    });

    return JSON.stringify({ memory: updated, written: true });
  }

  private async getApprovedAnswers(propertyId: string, args: Record<string, unknown>): Promise<string> {
    const attributes = getStringArrayArg(args, 'attributes');

    const answers = await prisma.approvedAnswer.findMany({
      where: {
        propertyId,
        ...notDeleted(),
        ...(attributes && attributes.length > 0
          ? { canonicalAttributes: { hasSome: attributes } }
          : {}),
      },
      orderBy: { approvedAt: 'desc' },
    });

    const answerAttributes = answers.flatMap((answer) => {
      const canonical: string[] = [];
      if (Array.isArray(answer.canonicalAttributes)) {
        for (const item of answer.canonicalAttributes) {
          if (typeof item === 'string') {
            canonical.push(item);
          }
        }
      }

      if (canonical.length === 0) {
        return [{ key: 'lister_answer', value: answer.answerText, source: 'lister_answer' }];
      }

      return canonical.map((key) => ({
        key,
        value: answer.answerText,
        source: 'lister_answer',
      }));
    });

    return JSON.stringify({ answers, attributes: answerAttributes });
  }
}

export const toolHandlers = new ToolHandlers();
