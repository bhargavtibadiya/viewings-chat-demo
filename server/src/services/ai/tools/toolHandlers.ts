import prisma from '../../../config/prisma.js';
import { propertiesService } from '../../../modules/properties/properties.service.js';
import { bookingsService } from '../../../modules/bookings/bookings.service.js';
import { listerService } from '../../../modules/lister/lister.service.js';
import { leadsService } from '../../../modules/leads/leads.service.js';
import { notDeleted } from '../../../utils/helpers/softDelete.js';
import {
  getBooleanArg,
  getNumberArg,
  getStringArg,
  getStringArrayArg,
  parseSessionMemory,
  parseToolArguments,
  sessionMemoryToJson,
  upsertMemoryFact,
} from './sessionMemory.js';
import type { AgentContext } from '../types/ai.types.js';

export class ToolHandlers {
  async executeTool(
    toolName: string,
    rawArguments: string,
    context: AgentContext,
  ): Promise<string> {
    const args = parseToolArguments(rawArguments);

    switch (toolName) {
      case 'get_property':
        return this.getProperty(getStringArg(args, 'property_id') ?? context.propertyId);
      case 'search_listings':
        return this.searchListings(args);
      case 'get_availability':
        return this.getAvailability(getStringArg(args, 'property_id') ?? context.propertyId, args);
      case 'create_booking':
        return this.createBooking(context.userId, args);
      case 'cancel_booking':
        return this.cancelBooking(context.userId, args);
      case 'send_question_to_lister':
        return this.sendQuestionToLister(context, args);
      case 'capture_contact':
        return this.captureContact(context.userId, args);
      case 'request_callback':
        return this.requestCallback(context.userId, args);
      case 'read_session_memory':
        return this.readSessionMemory(getStringArg(args, 'session_id') ?? context.sessionId, args);
      case 'write_session_memory':
        return this.writeSessionMemory(getStringArg(args, 'session_id') ?? context.sessionId, args);
      case 'get_approved_answers':
        return this.getApprovedAnswers(getStringArg(args, 'property_id') ?? context.propertyId, args);
      default:
        return JSON.stringify({ error: `Unknown tool: ${toolName}` });
    }
  }

  private async getProperty(propertyId: string): Promise<string> {
    const property = await propertiesService.getPropertyForTools(propertyId);
    return JSON.stringify(property);
  }

  private async searchListings(args: Record<string, unknown>): Promise<string> {
    const listingTypeRaw = getStringArg(args, 'listing_type');
    const listingType = listingTypeRaw === 'RENTAL' || listingTypeRaw === 'SALE' ? listingTypeRaw : undefined;

    const results = await propertiesService.searchListings({
      search: getStringArg(args, 'search'),
      listingType,
      suburb: getStringArg(args, 'suburb'),
      bedrooms: getNumberArg(args, 'bedrooms'),
      limit: getNumberArg(args, 'limit'),
    });

    return JSON.stringify({ listings: results });
  }

  private async getAvailability(propertyId: string, args: Record<string, unknown>): Promise<string> {
    const fromIso = getStringArg(args, 'from_iso');
    const toIso = getStringArg(args, 'to_iso');

    const result = await propertiesService.getAvailability(propertyId, {
      from: fromIso,
      to: toIso,
    });

    return JSON.stringify(result);
  }

  private async createBooking(userId: string, args: Record<string, unknown>): Promise<string> {
    const propertyId = getStringArg(args, 'property_id');
    const slotId = getStringArg(args, 'slot_id');
    const contactName = getStringArg(args, 'contact_name');
    const contactEmail = getStringArg(args, 'contact_email');

    if (!propertyId || !slotId || !contactName || !contactEmail) {
      return JSON.stringify({ error: 'Missing required booking fields' });
    }

    const result = await bookingsService.createBookingFromTool(userId, {
      propertyId,
      slotId,
      contactName,
      contactEmail,
      contactPhone: getStringArg(args, 'contact_phone'),
      notes: getStringArg(args, 'notes'),
    });

    return JSON.stringify(result);
  }

  private async cancelBooking(userId: string, args: Record<string, unknown>): Promise<string> {
    const bookingId = getStringArg(args, 'booking_id');
    if (!bookingId) {
      return JSON.stringify({ error: 'booking_id is required' });
    }

    const booking = await bookingsService.cancelBookingFromTool(userId, bookingId);
    return JSON.stringify({ booking, cancelled: true });
  }

  private async sendQuestionToLister(context: AgentContext, args: Record<string, unknown>): Promise<string> {
    const propertyId = getStringArg(args, 'property_id') ?? context.propertyId;
    const questionText = getStringArg(args, 'question_text');

    if (!questionText) {
      return JSON.stringify({ error: 'question_text is required' });
    }

    const result = await listerService.createQuestion({
      propertyId,
      sessionId: context.sessionId,
      userId: context.userId,
      questionText,
      resolvedIntent: getStringArg(args, 'resolved_intent'),
      canonicalAttributes: getStringArrayArg(args, 'canonical_attributes'),
    });

    return JSON.stringify(result);
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

  private async requestCallback(userId: string, args: Record<string, unknown>): Promise<string> {
    const propertyId = getStringArg(args, 'property_id');
    const contact = getStringArg(args, 'contact');

    if (!propertyId || !contact) {
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

  private async readSessionMemory(sessionId: string, args: Record<string, unknown>): Promise<string> {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, ...notDeleted() },
    });

    if (!session) {
      return JSON.stringify({ error: 'Session not found' });
    }

    const memory = parseSessionMemory(session.contextMemory);
    const propertyId = getStringArg(args, 'property_id') ?? session.propertyId;

    const approved = await prisma.approvedAnswer.findMany({
      where: { propertyId, ...notDeleted() },
      orderBy: { approvedAt: 'desc' },
      take: 20,
    });

    return JSON.stringify({ memory, approvedAnswers: approved });
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

    return JSON.stringify({ answers });
  }
}

export const toolHandlers = new ToolHandlers();
