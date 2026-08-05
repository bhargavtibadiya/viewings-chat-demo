import type { LeadStatus } from '#generated/client.js';

export interface SafeContactLead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  purpose: string;
  status: LeadStatus;
  propertyId: string | null;
  createdAt: string;
}

export interface SafeCallbackRequest {
  id: string;
  contact: string;
  preferredTime: string | null;
  notes: string | null;
  status: LeadStatus;
  propertyId: string | null;
  listerId: string;
  createdAt: string;
}
