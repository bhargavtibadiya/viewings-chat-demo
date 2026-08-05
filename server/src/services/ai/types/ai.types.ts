import type { AnswerStatus } from '#generated/client.js';

export interface ChatAction {
  type: string;
  label: string;
  payload?: Record<string, string | number | boolean>;
}

export interface ChatFact {
  attribute: string;
  value: string;
  source: string;
}

export interface ChatDebugInfo {
  intents: string[];
  attributes: string[];
  tools: string[];
  cta: string | null;
}

export interface AssistantTurnResponse {
  message: {
    id: string;
    role: 'assistant';
    content: string;
  };
  answer_status: AnswerStatus;
  facts: ChatFact[];
  actions: ChatAction[];
  debug: ChatDebugInfo;
}

export interface SessionMemoryFact {
  attribute: string;
  value: string;
  source: string;
  questionId?: string;
  updatedAt: string;
}

export interface SessionMemory {
  facts: SessionMemoryFact[];
  prefs: Record<string, string | number | boolean | null>;
  last_topic?: string;
}

export interface ToolCallRecord {
  name: string;
  arguments: Record<string, string | number | boolean | null>;
  result: string;
}

export interface AgentContext {
  sessionId: string;
  userId: string;
  propertyId: string;
  userMessage: string;
  listingType: 'RENTAL' | 'SALE';
  /** Recent thread messages for ask-lister question enrichment (optional). */
  recentMessages?: Array<{ role: string; content: string }>;
}

export interface AgentRunResult {
  content: string;
  answerStatus: AnswerStatus;
  facts: ChatFact[];
  actions: ChatAction[];
  debug: ChatDebugInfo;
  toolsCalled: ToolCallRecord[];
  rawTrace: Record<string, string | number | boolean | null>[];
  latencyMs: number;
}
