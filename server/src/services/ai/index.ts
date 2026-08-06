// ============================================================================
// AI SERVICE PUBLIC API
// Modules outside services/ai must import only from this barrel
// ============================================================================

export { agentLoop, AgentLoop } from './loop/index.js';
export { getOpenAIClient, getOpenAIModel } from './client/index.js';

export type {
  AssistantTurnResponse,
  ChatAction,
  ChatFact,
  ChatDebugInfo,
  SessionMemory,
  SessionMemoryFact,
  ToolCallRecord,
  AgentContext,
  AgentRunResult,
} from './types/index.js';

export {
  emptySessionMemory,
  parseSessionMemory,
  sessionMemoryToJson,
  upsertMemoryFact,
  upsertMemoryPref,
  setActiveBookingPref,
  clearActiveBookingPref,
  setPreferredDatePref,
  formatSessionMemoryForPrompt,
} from './memory/index.js';

export {
  API_FAILURE_ACK,
  EMPTY_SLOTS_HINT,
  pickOpeningGreeting,
  pickReturningGreeting,
  classifyInputScope,
  hasPriorAssistantTurn,
  cannedReplyForScope,
} from './policies/index.js';

export {
  enrichListerQuestion,
  ALREADY_ASKED_LISTER_REPLY,
  findSimilarOpenQuestion,
  parseListerAnswer,
} from './helpers/index.js';
export type { OpenListerQuestionCandidate } from './helpers/index.js';
