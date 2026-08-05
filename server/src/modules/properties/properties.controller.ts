import type { Request, Response, NextFunction } from 'express';
import { PropertiesService } from './properties.service.js';
import { PropertyQueryDto, AvailabilityQueryDto } from './dto/properties.dto.js';
import type {
  PaginatedPropertiesResponse,
  PropertyAvailabilityResponse,
  SafePropertyDetail,
} from './types/properties.types.js';
import { sendSuccess, sendBadRequest } from '../../utils/helpers/response.js';

export class PropertiesController {
  private propertiesService: PropertiesService;

  constructor() {
    this.propertiesService = new PropertiesService();
  }

  listProperties = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const queryResult = PropertyQueryDto.safeParse(req.query);
      if (!queryResult.success) {
        const errors = queryResult.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        sendBadRequest(res, 'Invalid query parameters', errors);
        return;
      }

      const result = await this.propertiesService.listProperties(queryResult.data);
      sendSuccess<PaginatedPropertiesResponse>(res, 'Properties retrieved', result);
    } catch (error) {
      next(error);
    }
  };

  getPropertyById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { propertyId } = req.params;
      if (!propertyId) {
        sendBadRequest(res, 'Property ID is required');
        return;
      }

      const property = await this.propertiesService.getPropertyById(propertyId);
      sendSuccess<{ property: SafePropertyDetail }>(res, 'Property retrieved', { property });
    } catch (error) {
      next(error);
    }
  };

  getAvailability = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { propertyId } = req.params;
      if (!propertyId) {
        sendBadRequest(res, 'Property ID is required');
        return;
      }

      const queryResult = AvailabilityQueryDto.safeParse(req.query);
      if (!queryResult.success) {
        const errors = queryResult.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        sendBadRequest(res, 'Invalid query parameters', errors);
        return;
      }

      const result = await this.propertiesService.getAvailability(propertyId, queryResult.data);
      sendSuccess<PropertyAvailabilityResponse>(res, 'Availability retrieved', result);
    } catch (error) {
      next(error);
    }
  };
}

export const propertiesController = new PropertiesController();
