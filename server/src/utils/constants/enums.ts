export enum UserRole {
  SEEKER = 'SEEKER',
  LISTER = 'LISTER',
  DEMO_ADMIN = 'DEMO_ADMIN',
}

export enum ListingType {
  RENTAL = 'RENTAL',
  SALE = 'SALE',
}

export enum AnswerStatus {
  VERIFIED = 'VERIFIED',
  LIMITED = 'LIMITED',
  UNKNOWN = 'UNKNOWN',
}

export enum QuestionStatus {
  OPEN = 'OPEN',
  ANSWERED = 'ANSWERED',
  DISMISSED = 'DISMISSED',
}

export enum BookingStatus {
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
}

export enum MessageRole {
  USER = 'USER',
  ASSISTANT = 'ASSISTANT',
  SYSTEM = 'SYSTEM',
}

export enum LeadStatus {
  NEW = 'NEW',
  HANDLED = 'HANDLED',
}

export enum AttributeSource {
  LISTING = 'LISTING',
  LISTER_APPROVED = 'LISTER_APPROVED',
  SEED = 'SEED',
}
