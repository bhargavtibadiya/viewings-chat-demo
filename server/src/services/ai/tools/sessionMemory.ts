import { isRecord, isStringArray } from '../../../utils/helpers/json.js';
import type { SessionMemory, SessionMemoryFact } from '../types/ai.types.js';
import type { Prisma } from '#generated/client.js';

export function emptySessionMemory(): SessionMemory {
  return { facts: [], prefs: {} };
}

export function parseSessionMemory(value: Prisma.JsonValue): SessionMemory {
  if (!isRecord(value)) {
    return emptySessionMemory();
  }

  const factsRaw = value.facts;
  const facts: SessionMemoryFact[] = [];

  if (Array.isArray(factsRaw)) {
    for (const item of factsRaw) {
      if (!isRecord(item)) {
        continue;
      }
      const attribute = item.attribute;
      const val = item.value;
      const source = item.source;
      if (typeof attribute === 'string' && typeof val === 'string' && typeof source === 'string') {
        const fact: SessionMemoryFact = {
          attribute,
          value: val,
          source,
          updatedAt: typeof item.updatedAt === 'string' ? item.updatedAt : new Date().toISOString(),
        };
        if (typeof item.questionId === 'string') {
          fact.questionId = item.questionId;
        }
        facts.push(fact);
      }
    }
  }

  const prefs: Record<string, string | number | boolean | null> = {};
  const prefsRaw = value.prefs;
  if (isRecord(prefsRaw)) {
    for (const [key, prefValue] of Object.entries(prefsRaw)) {
      if (
        typeof prefValue === 'string' ||
        typeof prefValue === 'number' ||
        typeof prefValue === 'boolean' ||
        prefValue === null
      ) {
        prefs[key] = prefValue;
      }
    }
  }

  const memory: SessionMemory = { facts, prefs };
  if (typeof value.last_topic === 'string') {
    memory.last_topic = value.last_topic;
  }

  return memory;
}

export function sessionMemoryToJson(memory: SessionMemory): Prisma.InputJsonValue {
  const factsJson = memory.facts.map((fact) => {
    if (fact.questionId) {
      return {
        attribute: fact.attribute,
        value: fact.value,
        source: fact.source,
        updatedAt: fact.updatedAt,
        questionId: fact.questionId,
      };
    }
    return {
      attribute: fact.attribute,
      value: fact.value,
      source: fact.source,
      updatedAt: fact.updatedAt,
    };
  });

  if (memory.last_topic) {
    return {
      facts: factsJson,
      prefs: memory.prefs,
      last_topic: memory.last_topic,
    };
  }

  return {
    facts: factsJson,
    prefs: memory.prefs,
  };
}

export function upsertMemoryFact(
  memory: SessionMemory,
  fact: Omit<SessionMemoryFact, 'updatedAt'> & { updatedAt?: string },
): SessionMemory {
  const updatedAt = fact.updatedAt ?? new Date().toISOString();
  const nextFacts = memory.facts.filter((existing) => existing.attribute !== fact.attribute);
  nextFacts.push({ ...fact, updatedAt });

  return {
    ...memory,
    facts: nextFacts,
    last_topic: fact.attribute,
  };
}

export function getStringArg(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key];
  return typeof value === 'string' ? value : undefined;
}

export function getNumberArg(args: Record<string, unknown>, key: string): number | undefined {
  const value = args[key];
  return typeof value === 'number' ? value : undefined;
}

export function getBooleanArg(args: Record<string, unknown>, key: string): boolean | undefined {
  const value = args[key];
  return typeof value === 'boolean' ? value : undefined;
}

export function getStringArrayArg(args: Record<string, unknown>, key: string): string[] | undefined {
  const value = args[key];
  return isStringArray(value) ? value : undefined;
}

export function parseToolArguments(raw: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isRecord(parsed)) {
      return parsed;
    }
  } catch {
    return {};
  }
  return {};
}
