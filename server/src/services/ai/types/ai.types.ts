import type { AnswerStatus } from '../../../generated/client.js';

// ============================================================================
// CHAT TURN CONTRACTS
// Shared shapes for assistant turns, CTAs, facts, and debug payloads
// ============================================================================

/** CTA button returned with an assistant turn. */
export interface ChatAction {
  type: string;
  label: string;
  payload?: Record<string, string | number | boolean>;
}

/** Single verified/limited fact surfaced to the client. */
export interface ChatFact {
  attribute: string;
  value: string;
  source: string;
}

/** Lightweight debug snapshot for the demo control panel. */
export interface ChatDebugInfo {
  intents: string[];
  attributes: string[];
  tools: string[];
  cta: string | null;
}

/** HTTP-facing assistant turn envelope used by the chat module. */
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

// ============================================================================
// SESSION MEMORY
// Persisted per chat session as JSON on ChatSession.contextMemory
// ============================================================================

/** One attribute fact stored in session memory. */
export interface SessionMemoryFact {
  attribute: string;
  value: string;
  source: string;
  questionId?: string;
  updatedAt: string;
}

/** Session-scoped facts, prefs, and optional last topic. */
export interface SessionMemory {
  facts: SessionMemoryFact[];
  prefs: Record<string, string | number | boolean | null>;
  last_topic?: string;
}

// ============================================================================
// AGENT LOOP
// Internal orchestration types (not always exposed on HTTP)
// ============================================================================

/** Record of one tool invocation during a turn. */
export interface ToolCallRecord {
  name: string;
  arguments: Record<string, string | number | boolean | null>;
  result: string;
}

/** Inputs required to run one agent turn. */
export interface AgentContext {
  sessionId: string;
  userId: string;
  propertyId: string;
  userMessage: string;
  listingType: 'RENTAL' | 'SALE';
  /** Recent thread messages for ask-lister question enrichment (optional). */
  recentMessages?: Array<{ role: string; content: string }>;
}

/** Full result of AgentLoop.run before chat persistence. */
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
