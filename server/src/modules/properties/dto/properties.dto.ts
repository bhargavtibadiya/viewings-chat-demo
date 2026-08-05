import { z } from 'zod';
import { ListingType } from '#generated/client.js';
import { PAGINATION } from '../../../utils/constants/pagination.js';

export const PropertyQueryDto = z.object({
  search: z.string().optional(),
  listingType: z.nativeEnum(ListingType).optional(),
  suburb: z.string().optional(),
  bedrooms: z.coerce.number().int().positive().optional(),
  minPrice: z.coerce.number().int().nonnegative().optional(),
  maxPrice: z.coerce.number().int().nonnegative().optional(),
  page: z.coerce.number().int().positive().optional().default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .positive()
    .max(PAGINATION.MAX_LIMIT)
    .optional()
    .default(PAGINATION.DEFAULT_LIMIT),
  fixtureKey: z.string().optional(),
});

export const AvailabilityQueryDto = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});

export type PropertyQueryDtoType = z.infer<typeof PropertyQueryDto>;
export type AvailabilityQueryDtoType = z.infer<typeof AvailabilityQueryDto>;
