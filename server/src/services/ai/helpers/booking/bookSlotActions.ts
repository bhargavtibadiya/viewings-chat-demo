import { formatNzDate, formatNzTime } from '../../../../utils/helpers/date.js';
import { isRecord } from '../../../../utils/helpers/json.js';
import { TIMEZONE } from '../../../../utils/constants/pagination.js';
import type { ChatAction, ToolCallRecord } from '../../types/ai.types.js';

// ============================================================================
// SLOT PARSING HELPERS
// Normalize availability / booking tool JSON into selectable slot candidates
// ============================================================================

interface SlotCandidate {
  id: string;
  label: string;
  startsAt?: string;
  endsAt?: string;
  timezone?: string;
}

/**
 * Validates a raw slot object into a SlotCandidate, or null if unusable.
 *
 * @param value - Unknown item from a tool result slots array
 * @returns Parsed candidate, or null when id is missing
 */
function parseSlotCandidate(value: unknown): SlotCandidate | null {
  if (!isRecord(value)) {
    return null;
  }

  const id = value.id;
  if (typeof id !== 'string' || id.length === 0) {
    return null;
  }

  const label = typeof value.label === 'string' && value.label.length > 0 ? value.label : id;
  const startsAt = typeof value.startsAt === 'string' ? value.startsAt : undefined;
  const endsAt = typeof value.endsAt === 'string' ? value.endsAt : undefined;
  const timezone = typeof value.timezone === 'string' ? value.timezone : undefined;

  return { id, label, startsAt, endsAt, timezone };
}

/**
 * Formats a CTA button label using NZ date/time when startsAt is valid.
 *
 * @param slot - Slot candidate to display
 * @returns Human-readable button label
 */
function formatButtonLabel(slot: SlotCandidate): string {
  if (!slot.startsAt) {
    return slot.label;
  }

  const startsAt = new Date(slot.startsAt);
  if (Number.isNaN(startsAt.getTime())) {
    return slot.label;
  }

  const timezone = slot.timezone ?? TIMEZONE;
  const datePart = formatNzDate(startsAt);
  const startTime = formatNzTime(startsAt, timezone);

  if (slot.endsAt) {
    const endsAt = new Date(slot.endsAt);
    if (!Number.isNaN(endsAt.getTime())) {
      return `${datePart} · ${startTime}–${formatNzTime(endsAt, timezone)}`;
    }
  }

  return `${datePart} · ${startTime}`;
}

/**
 * Extracts slot candidates from a get_availability / create_booking tool result JSON.
 *
 * @param result - Raw tool result string
 * @returns Parsed slots (empty on parse failure or missing arrays)
 */
function slotsFromToolResult(result: string): SlotCandidate[] {
  try {
    const parsed: unknown = JSON.parse(result);
    if (!isRecord(parsed)) {
      return [];
    }

    // [NOTE] create_booking may echo availableSlots; get_availability uses slots
    const rawSlots = Array.isArray(parsed.slots)
      ? parsed.slots
      : Array.isArray(parsed.availableSlots)
        ? parsed.availableSlots
        : [];

    const slots: SlotCandidate[] = [];
    for (const item of rawSlots) {
      const slot = parseSlotCandidate(item);
      if (slot) {
        slots.push(slot);
      }
    }
    return slots;
  } catch {
    return [];
  }
}

/**
 * Detects whether a create_booking tool result indicates a successful booking.
 *
 * @param result - Raw tool result string
 * @returns True when booking or bookedSlot is present
 */
function bookingSucceeded(result: string): boolean {
  try {
    const parsed: unknown = JSON.parse(result);
    if (!isRecord(parsed)) {
      return false;
    }
    return Boolean(parsed.booking || parsed.bookedSlot);
  } catch {
    return false;
  }
}

/**
 * Detects an explicitly empty availability payload (not a parse error).
 *
 * @param result - Raw get_availability tool result string
 * @returns True when empty flag is set or slots array is empty
 */
function availabilityWasEmpty(result: string): boolean {
  try {
    const parsed: unknown = JSON.parse(result);
    if (!isRecord(parsed)) {
      return false;
    }
    if (parsed.empty === true) {
      return true;
    }
    return Array.isArray(parsed.slots) && parsed.slots.length === 0;
  } catch {
    return false;
  }
}

// ============================================================================
// BOOK SLOT ACTIONS
// ChatAction CTAs derived from the turn's availability / booking tool calls
// ============================================================================

/**
 * Builds selectable book_slot CTAs from the latest availability tool results.
 *
 * @param toolsCalled - Tool call records from the agent loop for this turn
 * @returns book_slot actions, an another_date CTA when empty, or [] after a successful booking
 */
export function extractBookSlotActions(toolsCalled: ToolCallRecord[]): ChatAction[] {
  let slots: SlotCandidate[] = [];
  let sawEmptyAvailability = false;

  for (const tool of toolsCalled) {
    // [WHY] successful booking means no further slot CTAs for this turn
    if (tool.name === 'create_booking' && bookingSucceeded(tool.result)) {
      return [];
    }

    if (tool.name === 'get_availability' || tool.name === 'create_booking') {
      const next = slotsFromToolResult(tool.result);
      if (next.length > 0) {
        // [WHY] later tool results win — keep the freshest slot list only
        slots = next;
        sawEmptyAvailability = false;
      } else if (tool.name === 'get_availability' && availabilityWasEmpty(tool.result)) {
        sawEmptyAvailability = true;
      }
    }
  }

  if (slots.length === 0 && sawEmptyAvailability) {
    return [
      {
        type: 'another_date',
        label: 'Try another date',
        payload: { intent: 'another_date' },
      },
    ];
  }

  // [PERF] cap CTAs so the chat UI stays scannable
  return slots.slice(0, 16).map((slot) => {
    const buttonLabel = formatButtonLabel(slot);
    const payload: Record<string, string> = {
      slotId: slot.id,
      label: slot.label,
    };
    if (slot.startsAt) {
      payload.startsAt = slot.startsAt;
    }
    if (slot.endsAt) {
      payload.endsAt = slot.endsAt;
    }

    return {
      type: 'book_slot',
      label: buttonLabel,
      payload,
    };
  });
}
