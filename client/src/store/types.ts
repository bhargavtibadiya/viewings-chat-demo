export interface ApiError {
  success: false;
  message: string;
}

export interface ApiSuccessResponse<TData> {
  success: true;
  message: string;
  data: TData;
}

export interface ApiErrorData {
  data: ApiError;
}

export interface IPaginationData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
}

export type UserRole = 'SEEKER' | 'LISTER' | 'DEMO_ADMIN';
export type ListingType = 'RENTAL' | 'SALE';
export type AnswerStatus = 'VERIFIED' | 'LIMITED' | 'UNKNOWN';
export type QuestionStatus = 'OPEN' | 'ANSWERED' | 'DISMISSED';
export type BookingStatus = 'CONFIRMED' | 'CANCELLED';
export type MessageRole = 'USER' | 'ASSISTANT' | 'SYSTEM';

export interface IUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface IProperty {
  id: string;
  title: string;
  slug: string;
  listingType: ListingType;
  suburb: string;
  city: string;
  addressLine: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  rentWeekly: number | null;
  bond: number | null;
  price: number | null;
  availableFrom: string | null;
  description: string;
  heroImageUrl: string;
  imageUrls: string[];
  fixtureKey: string | null;
}

export interface IListingAttribute {
  key: string;
  value: string | number | boolean | null;
  source: string;
}

export interface IPropertyDetail extends IProperty {
  attributes: IListingAttribute[];
}

export interface IAvailabilitySlot {
  id: string;
  startsAt: string;
  endsAt: string;
  timezone: string;
  isBooked: boolean;
  label?: string;
}

export interface IChatSession {
  id: string;
  userId: string;
  propertyId: string;
  contextMemory: Record<string, unknown> | null;
}

export interface IChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  answerStatus: AnswerStatus | null;
  actions: IChatAction[] | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export interface IChatAction {
  type: string;
  label: string;
  payload?: Record<string, string | number | boolean>;
}

export interface IChatFact {
  attribute: string;
  value: string;
  source: string;
}

export interface IChatDebugInfo {
  intents: string[];
  attributes: string[];
  tools: string[];
  cta: string | null;
}

export interface IChatTurnResponse {
  message: IChatMessage;
  answer_status: AnswerStatus;
  facts: IChatFact[];
  actions: IChatAction[];
  debug: IChatDebugInfo;
}

export interface IBooking {
  id: string;
  propertyId: string;
  userId: string;
  slotId: string;
  status: BookingStatus;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  notes: string | null;
  createdAt: string;
  property?: IProperty;
  slot?: IAvailabilitySlot;
}

export interface IListerQuestion {
  id: string;
  propertyId: string;
  sessionId: string | null;
  status: QuestionStatus;
  questionText: string;
  answerText: string | null;
  answeredAt: string | null;
  property?: IProperty;
}

export interface ITurnToolCall {
  name: string;
  result: string;
}

export interface ITurnLog {
  id: string;
  sessionId: string;
  answerStatus: AnswerStatus;
  intents: string[];
  attributes: string[];
  toolsCalled: ITurnToolCall[];
  cta: string | null;
  latencyMs: number;
  createdAt: string;
}
