import type { Prisma } from '../../../generated/client.js';
import type { ChatAction, ChatFact, ToolCallRecord } from '../../../services/ai/index.js';

/**
 * Converts chat actions into a Prisma-compatible JSON value.
 *
 * @param actions - Actions to persist
 * @returns JSON-safe action data
 */
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

/**
 * Converts chat facts into a Prisma-compatible JSON value.
 *
 * @param facts - Facts to persist
 * @returns JSON-safe fact data
 */
export function chatFactsToJson(facts: ChatFact[]): Prisma.InputJsonValue {
  return facts.map((fact) => ({
    attribute: fact.attribute,
    value: fact.value,
    source: fact.source,
  }));
}

/**
 * Converts recorded tool calls into a Prisma-compatible JSON value.
 *
 * @param tools - Tool calls to persist
 * @returns JSON-safe tool-call data
 */
export function toolCallsToJson(tools: ToolCallRecord[]): Prisma.InputJsonValue {
  return tools.map((tool) => ({
    name: tool.name,
    result: tool.result,
  }));
}

/**
 * Converts string values into a Prisma-compatible JSON value.
 *
 * @param values - Strings to persist
 * @returns JSON-safe string data
 */
export function stringArrayToJson(values: string[]): Prisma.InputJsonValue {
  return values;
}

/**
 * Converts an optional primitive record into JSON, preserving null values.
 *
 * @param value - Optional record to convert
 * @returns JSON-safe record or null
 */
export function optionalJsonObject(
  value: Record<string, string> | null,
): Prisma.InputJsonValue | undefined {
  if (!value) {
    return undefined;
  }
  return value;
}

/**
 * Converts a raw agent trace into a Prisma-compatible JSON value.
 *
 * @param trace - Raw trace entries to persist
 * @returns JSON-safe trace data
 */
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
