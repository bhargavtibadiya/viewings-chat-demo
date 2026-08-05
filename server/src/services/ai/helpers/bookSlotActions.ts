import { formatNzDate, formatNzTime } from '../../../utils/helpers/date.js';
import { isRecord } from '../../../utils/helpers/json.js';
import { TIMEZONE } from '../../../utils/constants/pagination.js';
import type { ChatAction, ToolCallRecord } from '../types/ai.types.js';

interface SlotCandidate {
  id: string;
  label: string;
  startsAt?: string;
  endsAt?: string;
  timezone?: string;
}

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

function slotsFromToolResult(result: string): SlotCandidate[] {
  try {
    const parsed: unknown = JSON.parse(result);
    if (!isRecord(parsed)) {
      return [];
    }

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

/** Build selectable book_slot CTAs from the latest availability tool results. */
export function extractBookSlotActions(toolsCalled: ToolCallRecord[]): ChatAction[] {
  let slots: SlotCandidate[] = [];

  for (const tool of toolsCalled) {
    if (tool.name === 'create_booking' && bookingSucceeded(tool.result)) {
      return [];
    }

    if (tool.name === 'get_availability' || tool.name === 'create_booking') {
      const next = slotsFromToolResult(tool.result);
      if (next.length > 0) {
        slots = next;
      }
    }
  }

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
