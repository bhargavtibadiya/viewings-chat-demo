import { formatNzDateTime } from '../../../utils/helpers/date.js';
import type { SafeAvailabilitySlot } from '../../../modules/properties/types/properties.types.js';

function normalizeSlotText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[–—]/g, '-')
    .replace(/(\d{1,2})(st|nd|rd|th)\b/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Match a free slot by id, ISO start time, or human label from get_availability. */
export function resolveAvailabilitySlot(
  slots: SafeAvailabilitySlot[],
  options: {
    slotId?: string;
    preferredStartsAt?: string;
    slotLabel?: string;
  },
): SafeAvailabilitySlot | null {
  const freeSlots = slots.filter((slot) => !slot.isBooked);

  if (options.slotId) {
    const byId = freeSlots.find((slot) => slot.id === options.slotId);
    if (byId) {
      return byId;
    }
  }

  if (options.preferredStartsAt) {
    const preferredMs = Date.parse(options.preferredStartsAt);
    if (!Number.isNaN(preferredMs)) {
      const byStart = freeSlots.find((slot) => {
        const slotMs = Date.parse(slot.startsAt);
        return !Number.isNaN(slotMs) && Math.abs(slotMs - preferredMs) < 60_000;
      });
      if (byStart) {
        return byStart;
      }
    }
  }

  if (options.slotLabel) {
    const needle = normalizeSlotText(options.slotLabel);
    if (needle.length > 0) {
      const byLabel = freeSlots.find((slot) => {
        const label = normalizeSlotText(slot.label);
        const startsLabel = normalizeSlotText(formatNzDateTime(new Date(slot.startsAt)));
        return label.includes(needle) || needle.includes(startsLabel) || startsLabel.includes(needle);
      });
      if (byLabel) {
        return byLabel;
      }

      // Looser match: weekday + time fragments (e.g. "sunday" + "5:00")
      const byLoose = freeSlots.find((slot) => {
        const startsLabel = normalizeSlotText(formatNzDateTime(new Date(slot.startsAt)));
        const weekday = startsLabel.split(' ')[0] ?? '';
        const hasWeekday = weekday.length > 0 && needle.includes(weekday);
        const timeMatch = startsLabel.match(/\d{1,2}:\d{2}/);
        const hasTime = timeMatch ? needle.includes(timeMatch[0]) : false;
        return hasWeekday && hasTime;
      });
      if (byLoose) {
        return byLoose;
      }
    }
  }

  return null;
}
