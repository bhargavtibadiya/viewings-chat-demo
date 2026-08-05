import prisma from '../../config/prisma.js';
import { createServiceError } from '../../utils/helpers/serviceError.js';
import { notDeleted } from '../../utils/helpers/softDelete.js';
import type { CaptureContactInput, RequestCallbackInput } from './dto/leads.dto.js';
import type { SafeCallbackRequest, SafeContactLead } from './types/leads.types.js';

export class LeadsService {
  async captureContact(input: CaptureContactInput): Promise<SafeContactLead> {
    const lead = await prisma.contactLead.create({
      data: {
        userId: input.userId,
        propertyId: input.propertyId,
        name: input.name,
        email: input.email,
        phone: input.phone,
        purpose: input.purpose,
        consent: input.consent,
      },
    });

    return {
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      purpose: lead.purpose,
      status: lead.status,
      propertyId: lead.propertyId,
      createdAt: lead.createdAt.toISOString(),
    };
  }

  async requestCallback(input: RequestCallbackInput): Promise<SafeCallbackRequest> {
    const property = await prisma.property.findFirst({
      where: { id: input.propertyId, ...notDeleted() },
    });

    if (!property) {
      throw createServiceError(404, 'Property not found');
    }

    const callback = await prisma.callbackRequest.create({
      data: {
        userId: input.userId,
        propertyId: input.propertyId,
        listerId: property.listerId,
        contact: input.contact,
        preferredTime: input.preferredTime,
        notes: input.notes,
      },
    });

    return {
      id: callback.id,
      contact: callback.contact,
      preferredTime: callback.preferredTime,
      notes: callback.notes,
      status: callback.status,
      propertyId: callback.propertyId,
      listerId: callback.listerId,
      createdAt: callback.createdAt.toISOString(),
    };
  }
}

export const leadsService = new LeadsService();
