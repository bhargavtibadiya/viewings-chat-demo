import { z } from 'zod';

export const CreateBookingDto = z.object({
  propertyId: z.string().min(1, 'Property ID is required'),
  slotId: z.string().min(1, 'Slot ID is required'),
  contactName: z.string().min(1, 'Contact name is required').max(150).optional(),
  contactEmail: z.string().email('Valid email is required').optional(),
  contactPhone: z.string().max(30).optional(),
  notes: z.string().max(1000).optional(),
});

export type CreateBookingDtoType = z.infer<typeof CreateBookingDto>;

/** Resolved booking input after filling contact from the authenticated user profile. */
export type ResolvedCreateBookingDto = CreateBookingDtoType & {
  contactName: string;
  contactEmail: string;
};
