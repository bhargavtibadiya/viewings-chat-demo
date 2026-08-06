import type { Request, Response, NextFunction } from 'express';
import { LeadsService } from './leads.service.js';
import { ContactLeadDto, CallbackRequestDto } from './dto/leads.dto.js';
import type { ContactLeadDtoType, CallbackRequestDtoType } from './dto/leads.dto.js';
import type { SafeCallbackRequest, SafeContactLead } from './types/leads.types.js';
import { sendCreated, sendBadRequest } from '../../utils/helpers/response.js';
import { createLogger } from '../../utils/helpers/logger.js';

const logger = createLogger('LeadsController');

export class LeadsController {
  private leadsService: LeadsService;

  constructor() {
    this.leadsService = new LeadsService();
  }

  /**
   * Captures a visitor's contact details for a property.
   *
   * @param req - Authenticated Express request containing lead details
   * @param res - Express response used to return the captured lead
   * @param next - Express error handler
   * @returns A promise that resolves after the response is sent
   */
  captureContact = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtoResult = ContactLeadDto.safeParse(req.body);
      if (!dtoResult.success) {
        const errors = dtoResult.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        sendBadRequest(res, 'Validation failed', errors);
        return;
      }

      const dto: ContactLeadDtoType = dtoResult.data;
      const lead = await this.leadsService.captureContact({
        userId: req.user?.id,
        propertyId: dto.propertyId,
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        purpose: dto.purpose,
        consent: dto.consent,
      });

      logger.info(`Contact lead captured: ${lead.id}`);
      sendCreated<{ lead: SafeContactLead }>(res, 'Contact captured', { lead });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Requests a callback from the property's lister.
   *
   * @param req - Authenticated Express request containing callback details
   * @param res - Express response used to return the request
   * @param next - Express error handler
   * @returns A promise that resolves after the response is sent
   */
  requestCallback = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dtoResult = CallbackRequestDto.safeParse(req.body);
      if (!dtoResult.success) {
        const errors = dtoResult.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        sendBadRequest(res, 'Validation failed', errors);
        return;
      }

      const dto: CallbackRequestDtoType = dtoResult.data;
      const callback = await this.leadsService.requestCallback({
        userId: req.user?.id,
        propertyId: dto.propertyId,
        contact: dto.contact,
        preferredTime: dto.preferredTime,
        notes: dto.notes,
      });

      logger.info(`Callback requested: ${callback.id}`);
      sendCreated<{ callback: SafeCallbackRequest }>(res, 'Callback requested', { callback });
    } catch (error) {
      next(error);
    }
  };
}

export const leadsController = new LeadsController();
