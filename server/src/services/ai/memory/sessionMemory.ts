import { isRecord, isStringArray } from '../../../utils/helpers/json.js';
import type { SessionMemory, SessionMemoryFact } from '../types/ai.types.js';
import type { Prisma } from '../../../generated/client.js';

// ============================================================================
// SESSION MEMORY CORE
// Empty factory, Prisma JSON parse/serialize, and fact/pref upserts
// ============================================================================

/**
 * Returns a blank session memory with empty facts and prefs.
 *
 * @returns Empty SessionMemory ready for first write
 */
export function emptySessionMemory(): SessionMemory {
  return { facts: [], prefs: {} };
}

/**
 * Parses Prisma JSON into SessionMemory, dropping malformed facts/prefs.
 *
 * @param value - Raw JSON column from the chat session row
 * @returns Validated memory, or emptySessionMemory when value is not an object
 */
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
          // [WHY] legacy rows may omit updatedAt — stamp now so callers can sort/compare
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

/**
 * Serializes SessionMemory for Prisma JSON columns.
 *
 * @param memory - In-memory session state
 * @returns Prisma-compatible InputJsonValue (omits last_topic when unset)
 */
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

/**
 * Replaces any existing fact with the same attribute key and sets last_topic.
 *
 * @param memory - Current session memory
 * @param fact - Fact to upsert (updatedAt optional; defaults to now)
 * @returns New memory with the fact replaced by attribute
 */
export function upsertMemoryFact(
  memory: SessionMemory,
  fact: Omit<SessionMemoryFact, 'updatedAt'> & { updatedAt?: string },
): SessionMemory {
  const updatedAt = fact.updatedAt ?? new Date().toISOString();
  // [WHY] one fact per attribute — filter-then-push keeps the latest value only
  const nextFacts = memory.facts.filter((existing) => existing.attribute !== fact.attribute);
  nextFacts.push({ ...fact, updatedAt });

  return {
    ...memory,
    facts: nextFacts,
    last_topic: fact.attribute,
  };
}

/**
 * Sets or overwrites a single preference key.
 *
 * @param memory - Current session memory
 * @param key - Preference key
 * @param value - Scalar preference value (null clears semantically at call sites)
 * @returns New memory with updated prefs
 */
export function upsertMemoryPref(
  memory: SessionMemory,
  key: string,
  value: string | number | boolean | null,
): SessionMemory {
  return {
    ...memory,
    prefs: {
      ...memory.prefs,
      [key]: value,
    },
  };
}

// ============================================================================
// BOOKING / DATE PREFS
// Active booking and preferred-date keys used by cancel + availability tools
// ============================================================================

/**
 * Persists active booking id plus optional slot label/start for later cancel/context.
 *
 * @param memory - Current session memory
 * @param booking - Booking id with optional human label and ISO start
 * @returns Memory with active_booking_* prefs set
 */
export function setActiveBookingPref(
  memory: SessionMemory,
  booking: { bookingId: string; slotLabel?: string; startsAt?: string },
): SessionMemory {
  let next = upsertMemoryPref(memory, 'active_booking_id', booking.bookingId);
  if (booking.slotLabel) {
    next = upsertMemoryPref(next, 'active_booking_slot_label', booking.slotLabel);
  }
  if (booking.startsAt) {
    next = upsertMemoryPref(next, 'active_booking_starts_at', booking.startsAt);
  }
  return next;
}

/**
 * Removes all active-booking preference keys from session memory.
 *
 * @param memory - Current session memory
 * @returns Memory without active_booking_* prefs
 */
export function clearActiveBookingPref(memory: SessionMemory): SessionMemory {
  const prefs = { ...memory.prefs };
  delete prefs.active_booking_id;
  delete prefs.active_booking_slot_label;
  delete prefs.active_booking_starts_at;
  return { ...memory, prefs };
}

/**
 * Stores a preferred viewing date/range for subsequent availability calls.
 *
 * @param memory - Current session memory
 * @param prefs - Optional from/to ISO strings and display label
 * @returns Memory with preferred_date_* prefs set when provided
 */
export function setPreferredDatePref(
  memory: SessionMemory,
  prefs: { fromIso?: string; toIso?: string; label?: string },
): SessionMemory {
  let next = memory;
  if (prefs.fromIso) {
    next = upsertMemoryPref(next, 'preferred_date_from', prefs.fromIso);
  }
  if (prefs.toIso) {
    next = upsertMemoryPref(next, 'preferred_date_to', prefs.toIso);
  }
  if (prefs.label) {
    next = upsertMemoryPref(next, 'preferred_date_label', prefs.label);
  }
  return next;
}

// ============================================================================
// PROMPT FORMATTING
// Compact SESSION MEMORY block injected into the system prompt
// ============================================================================

/**
 * Builds a prompt-ready SESSION MEMORY block, or null when there is nothing to recall.
 *
 * @param memory - Current session memory
 * @returns Multiline prompt string, or null if empty
 */
export function formatSessionMemoryForPrompt(memory: SessionMemory): string | null {
  const lines: string[] = [];

  const bookingId = memory.prefs.active_booking_id;
  if (typeof bookingId === 'string' && bookingId.length > 0) {
    const slot =
      typeof memory.prefs.active_booking_slot_label === 'string'
        ? memory.prefs.active_booking_slot_label
        : null;
    lines.push(
      slot
        ? `Active booking in this session: booking_id=${bookingId} (${slot}). Use this id for cancel_booking unless the user names a different booking.`
        : `Active booking in this session: booking_id=${bookingId}. Use this id for cancel_booking unless the user names a different booking.`,
    );
  }

  const from = memory.prefs.preferred_date_from;
  const to = memory.prefs.preferred_date_to;
  const dateLabel = memory.prefs.preferred_date_label;
  if (typeof from === 'string' || typeof dateLabel === 'string') {
    const range =
      typeof to === 'string' && typeof from === 'string'
        ? `${from} → ${to}`
        : typeof from === 'string'
          ? from
          : String(dateLabel);
    lines.push(`Remembered preferred viewing date/range: ${range}.`);
  }

  // [PERF] cap facts in the prompt so long sessions do not blow the context window
  const factLines = memory.facts.slice(0, 12).map((fact) => `${fact.attribute}=${fact.value}`);
  if (factLines.length > 0) {
    lines.push(
      `Session facts already confirmed (stay consistent — do not change these unless tools return updated values): ${factLines.join('; ')}.`,
    );
  }

  if (lines.length === 0) {
    return null;
  }

  return `SESSION MEMORY:\n- ${lines.join('\n- ')}`;
}

// ============================================================================
// TOOL ARG HELPERS
// Safe typed getters for LLM tool argument bags (and JSON parse)
// ============================================================================

/**
 * Reads a string tool argument when present and typed correctly.
 *
 * @param args - Parsed tool argument object
 * @param key - Argument key
 * @returns The string value, or undefined if missing/wrong type
 */
export function getStringArg(args: Record<string, unknown>, key: string): string | undefined {
  const value = args[key];
  return typeof value === 'string' ? value : undefined;
}

/**
 * Reads a number tool argument when present and typed correctly.
 *
 * @param args - Parsed tool argument object
 * @param key - Argument key
 * @returns The number value, or undefined if missing/wrong type
 */
export function getNumberArg(args: Record<string, unknown>, key: string): number | undefined {
  const value = args[key];
  return typeof value === 'number' ? value : undefined;
}

/**
 * Reads a boolean tool argument when present and typed correctly.
 *
 * @param args - Parsed tool argument object
 * @param key - Argument key
 * @returns The boolean value, or undefined if missing/wrong type
 */
export function getBooleanArg(args: Record<string, unknown>, key: string): boolean | undefined {
  const value = args[key];
  return typeof value === 'boolean' ? value : undefined;
}

/**
 * Reads a string-array tool argument when present and typed correctly.
 *
 * @param args - Parsed tool argument object
 * @param key - Argument key
 * @returns The string array, or undefined if missing/wrong type
 */
export function getStringArrayArg(args: Record<string, unknown>, key: string): string[] | undefined {
  const value = args[key];
  return isStringArray(value) ? value : undefined;
}

/**
 * Parses a raw tool-arguments JSON string into a plain object.
 *
 * @param raw - JSON string from the model tool call
 * @returns Parsed object, or {} on invalid JSON / non-object root
 */
export function parseToolArguments(raw: string): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (isRecord(parsed)) {
      return parsed;
    }
  } catch {
    // Q: why empty object on parse failure? A: tool handlers treat missing args as soft misses
    return {};
  }
  return {};
}
