import type { Prisma } from '../../../generated/client.js';
import type { ChatAction, ChatFact, ToolCallRecord } from '../../../services/ai/types/ai.types.js';

export function chatActionsToJson(actions: ChatAction[]): Prisma.InputJsonValue {
  return actions.map((action) => {
    const entry: Record<string, Prisma.InputJsonValue> = {
      type: action.type,
      label: action.label,
    };
    if (action.payload) {
      entry.payload = action.payload;
    }
    return entry;
  });
}

export function chatFactsToJson(facts: ChatFact[]): Prisma.InputJsonValue {
  return facts.map((fact) => ({
    attribute: fact.attribute,
    value: fact.value,
    source: fact.source,
  }));
}

export function toolCallsToJson(tools: ToolCallRecord[]): Prisma.InputJsonValue {
  return tools.map((tool) => ({
    name: tool.name,
    result: tool.result,
  }));
}

export function stringArrayToJson(values: string[]): Prisma.InputJsonValue {
  return values;
}

export function optionalJsonObject(
  value: Record<string, string> | null,
): Prisma.InputJsonValue | undefined {
  if (!value) {
    return undefined;
  }
  return value;
}

export function rawTraceToJson(
  trace: Record<string, string | number | boolean | null>[],
): Prisma.InputJsonValue {
  return trace.map((entry) => {
    const jsonEntry: Record<string, Prisma.InputJsonValue> = {};
    for (const [key, value] of Object.entries(entry)) {
      if (
        typeof value === 'string' ||
        typeof value === 'number' ||
        typeof value === 'boolean'
      ) {
        jsonEntry[key] = value;
      }
    }
    return jsonEntry;
  });
}
