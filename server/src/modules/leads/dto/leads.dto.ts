import { z } from 'zod';

export const ContactLeadDto = z.object({
  propertyId: z.string().optional(),
  name: z.string().min(1).max(150),
  email: z.string().email(),
  phone: z.string().max(30).optional(),
  purpose: z.string().min(1).max(500),
  consent: z.boolean().refine((val) => val === true, { message: 'Consent is required' }),
});

export const CallbackRequestDto = z.object({
  propertyId: z.string().min(1),
  contact: z.string().min(1).max(200),
  preferredTime: z.string().max(200).optional(),
  notes: z.string().max(1000).optional(),
});

export type ContactLeadDtoType = z.infer<typeof ContactLeadDto>;
export type CallbackRequestDtoType = z.infer<typeof CallbackRequestDto>;

export interface CaptureContactInput {
  userId?: string;
  propertyId?: string;
  name: string;
  email: string;
  phone?: string;
  purpose: string;
  consent: boolean;
}

export interface RequestCallbackInput {
  userId?: string;
  propertyId: string;
  contact: string;
  preferredTime?: string;
  notes?: string;
}
