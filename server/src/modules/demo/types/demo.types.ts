import type { AnswerStatus } from '../../../generated/client.js';

export interface SafeTurnLog {
  id: string;
  sessionId: string;
  userMessageId: string;
  assistantMessageId: string;
  answerStatus: AnswerStatus;
  intents: string[];
  attributes: string[];
  toolsCalled: Array<{ name: string; result: string }>;
  cta: string | null;
  latencyMs: number;
  createdAt: string;
}

export interface DemoTurnsResponse {
  turns: SafeTurnLog[];
}

export interface FixtureEntry {
  evidenceId: string;
  label: string;
  message: string;
  fixtureKey: string | null;
}

export interface DemoFixturesResponse {
  fixtures: FixtureEntry[];
  model: string;
}
