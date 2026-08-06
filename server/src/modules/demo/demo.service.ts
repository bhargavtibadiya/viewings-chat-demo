import type { Prisma } from '../../generated/client.js';
import prisma from '../../config/prisma.js';
import { env } from '../../config/env.js';
import { getOpenAIModel } from '../../services/ai/index.js';
import { createServiceError } from '../../utils/helpers/serviceError.js';
import { notDeleted } from '../../utils/helpers/softDelete.js';
import { isRecord } from '../../utils/helpers/json.js';
import type { DemoFixturesResponse, DemoTurnsResponse, FixtureEntry, SafeTurnLog } from './types/demo.types.js';

const FIXTURES: FixtureEntry[] = [
  { evidenceId: 'E-01', label: 'Greeting', message: 'Hello', fixtureKey: null },
  { evidenceId: 'E-02', label: 'Buy a bed?', message: 'Do I need to buy a bed?', fixtureKey: 'unfurnished-rental' },
  { evidenceId: 'E-03', label: 'Dog outside', message: 'Can my dog play outside?', fixtureKey: 'yard-fencing-unknown' },
  { evidenceId: 'E-04', label: 'Ensuite', message: 'Does the bedroom connect to the bathroom?', fixtureKey: 'ensuite-layout' },
  { evidenceId: 'E-05', label: 'Stay warm', message: 'Does it stay warm?', fixtureKey: 'heating-fixture' },
  { evidenceId: 'E-06', label: 'Wheelchair', message: 'My father uses a wheelchair. Can he visit?', fixtureKey: 'accessibility-unknown' },
  { evidenceId: 'E-07', label: 'Sale pets', message: "I don't like pets - is it pet-friendly?", fixtureKey: 'sale-pets' },
  { evidenceId: 'E-08', label: 'Wheelchair variant', message: 'Is step-free access available for a wheelchair visitor?', fixtureKey: 'accessibility-unknown' },
  { evidenceId: 'E-09', label: 'CTA order', message: 'Can someone in a wheelchair visit comfortably?', fixtureKey: 'accessibility-unknown' },
  { evidenceId: 'E-10', label: 'Unknown / escalate', message: 'Why is the owner moving?', fixtureKey: null },
  { evidenceId: 'E-11a', label: 'Weekly rent', message: 'What is the weekly rent and bond?', fixtureKey: 'rental-pricing' },
  { evidenceId: 'E-11b', label: 'Move-in date', message: 'When can I move in?', fixtureKey: 'rental-pricing' },
  { evidenceId: 'E-11c', label: 'Work from home', message: 'Is this good for working from home?', fixtureKey: 'wfh-outdoor' },
  { evidenceId: 'E-11d', label: 'BBQ outside', message: 'Can we BBQ outside?', fixtureKey: 'wfh-outdoor' },
];

export class DemoService {
  async getTurnLogs(userId: string, sessionId: string): Promise<DemoTurnsResponse> {
    const session = await prisma.chatSession.findFirst({
      where: { id: sessionId, userId, ...notDeleted() },
    });

    if (!session) {
      throw createServiceError(404, 'Session not found');
    }

    const turns = await prisma.turnLog.findMany({
      where: { sessionId, ...notDeleted() },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return {
      turns: turns.map((turn) => this.toSafeTurnLog(turn)),
    };
  }

  getFixtures(): DemoFixturesResponse {
    let model = env.OPENAI_MODEL;
    try {
      model = getOpenAIModel();
    } catch {
      model = env.OPENAI_MODEL;
    }

    return {
      fixtures: FIXTURES,
      model,
    };
  }

  private toSafeTurnLog(turn: {
    id: string;
    sessionId: string;
    userMessageId: string;
    assistantMessageId: string;
    answerStatus: SafeTurnLog['answerStatus'];
    intents: Prisma.JsonValue;
    attributes: Prisma.JsonValue;
    toolsCalled: Prisma.JsonValue;
    cta: Prisma.JsonValue | null;
    latencyMs: number;
    createdAt: Date;
  }): SafeTurnLog {
    return {
      id: turn.id,
      sessionId: turn.sessionId,
      userMessageId: turn.userMessageId,
      assistantMessageId: turn.assistantMessageId,
      answerStatus: turn.answerStatus,
      intents: this.parseStringArray(turn.intents),
      attributes: this.parseStringArray(turn.attributes),
      toolsCalled: this.parseToolsCalled(turn.toolsCalled),
      cta: this.parseCta(turn.cta),
      latencyMs: turn.latencyMs,
      createdAt: turn.createdAt.toISOString(),
    };
  }

  private parseStringArray(value: Prisma.JsonValue): string[] {
    if (!Array.isArray(value)) {
      return [];
    }
    const result: string[] = [];
    for (const item of value) {
      if (typeof item === 'string') {
        result.push(item);
      }
    }
    return result;
  }

  private parseToolsCalled(value: Prisma.JsonValue): Array<{ name: string; result: string }> {
    if (!Array.isArray(value)) {
      return [];
    }

    const tools: Array<{ name: string; result: string }> = [];
    for (const item of value) {
      if (isRecord(item) && typeof item.name === 'string' && typeof item.result === 'string') {
        tools.push({ name: item.name, result: item.result });
      }
    }
    return tools;
  }

  private parseCta(value: Prisma.JsonValue | null): string | null {
    if (!isRecord(value)) {
      return null;
    }
    return typeof value.type === 'string' ? value.type : null;
  }
}

export const demoService = new DemoService();
