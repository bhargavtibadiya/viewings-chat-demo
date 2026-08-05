import type { AnswerStatus, MessageRole } from '../../../generated/client.js';
import type { ChatAction, ChatDebugInfo, ChatFact, SessionMemory } from '../../../services/ai/types/ai.types.js';

export interface SafeChatSession {
  id: string;
  userId: string;
  propertyId: string;
  contextMemory: SessionMemory;
  createdAt: string;
  updatedAt: string;
}

export interface SafeChatMessage {
  id: string;
  sessionId: string;
  role: MessageRole;
  content: string;
  answerStatus: AnswerStatus | null;
  actions: ChatAction[] | null;
  createdAt: string;
}

export interface ChatMessagesPagination {
  limit: number;
  total: number;
  hasMoreOlder: boolean;
  oldestMessageId: string | null;
  newestMessageId: string | null;
}

export interface ChatMessagesResponse {
  messages: SafeChatMessage[];
  pagination: ChatMessagesPagination;
}

export interface ChatTurnResponse {
  message: SafeChatMessage;
  answer_status: AnswerStatus;
  facts: ChatFact[];
  actions: ChatAction[];
  debug: ChatDebugInfo;
}

export interface SessionMemoryResponse {
  memory: SessionMemory;
}
