import type { QuestionStatus } from '../../../generated/client.js';

export interface SafeUnansweredQuestion {
  id: string;
  propertyId: string;
  sessionId: string | null;
  status: QuestionStatus;
  questionText: string;
  resolvedIntent: string | null;
  canonicalAttributes: string[] | null;
  answerText: string | null;
  answeredAt: string | null;
  createdAt: string;
  property: {
    id: string;
    title: string;
    slug: string;
    suburb: string;
  };
}

export interface ListerQuestionsResponse {
  questions: SafeUnansweredQuestion[];
}

export interface CreateQuestionResult {
  questionId: string;
  status: QuestionStatus;
  delivered: boolean;
  // [NOTE] True when a similar or exact open escalation already exists for this visitor context.
  alreadyAsked?: boolean;
  questionText?: string;
}

export interface AnswerQuestionResult {
  question: SafeUnansweredQuestion;
  approvedAnswerId: string;
}
