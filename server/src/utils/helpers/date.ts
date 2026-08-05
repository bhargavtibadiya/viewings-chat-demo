import { TIMEZONE } from '../constants/pagination.js';

export function formatNzDate(date: Date): string {
  return new Intl.DateTimeFormat('en-NZ', {
    timeZone: TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatNzDateTime(date: Date): string {
  return new Intl.DateTimeFormat('en-NZ', {
    timeZone: TIMEZONE,
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

function getTimezoneOffsetMs(date: Date, timeZone: string): number {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(date);
  const lookup: Record<string, string> = {};
  for (const part of parts) {
    if (part.type !== 'literal') {
      lookup[part.type] = part.value;
    }
  }
  const asUtc = Date.UTC(
    parseInt(lookup.year ?? '1970', 10),
    parseInt(lookup.month ?? '1', 10) - 1,
    parseInt(lookup.day ?? '1', 10),
    parseInt(lookup.hour ?? '0', 10),
    parseInt(lookup.minute ?? '0', 10),
    parseInt(lookup.second ?? '0', 10),
  );
  return asUtc - date.getTime();
}

export function startOfDayInTimezone(date: Date, timeZone: string = TIMEZONE): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const dateKey = formatter.format(date);
  const localMidnight = new Date(`${dateKey}T00:00:00`);
  const offset = getTimezoneOffsetMs(localMidnight, timeZone);
  return new Date(localMidnight.getTime() - offset);
}

export function endOfDayInTimezone(date: Date, timeZone: string = TIMEZONE): Date {
  const start = startOfDayInTimezone(date, timeZone);
  return new Date(start.getTime() + 24 * 60 * 60 * 1000 - 1);
}

/**
 * Build a UTC instant for a wall-clock time in `timeZone` on the local calendar
 * day of `reference` plus `dayOffset` (e.g. hour 9 → 9:00 am Pacific/Auckland).
 */
export function atLocalTimeInTimezone(
  reference: Date,
  dayOffset: number,
  hour: number,
  minute: number = 0,
  timeZone: string = TIMEZONE,
): Date {
  const dayStart = startOfDayInTimezone(reference, timeZone);
  const targetDay = addDays(dayStart, dayOffset);

  const dateKey = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(targetDay);

  const [yearText, monthText, dayText] = dateKey.split('-');
  const year = parseInt(yearText ?? '1970', 10);
  const month = parseInt(monthText ?? '1', 10);
  const day = parseInt(dayText ?? '1', 10);
  const desiredAsUtc = Date.UTC(year, month - 1, day, hour, minute, 0, 0);

  // First guess: treat desired wall clock as UTC, then subtract TZ offset.
  let guess = new Date(desiredAsUtc);
  let offset = getTimezoneOffsetMs(guess, timeZone);
  guess = new Date(desiredAsUtc - offset);
  // Refine once so DST transitions land on the correct offset.
  offset = getTimezoneOffsetMs(guess, timeZone);
  return new Date(desiredAsUtc - offset);
}

export function formatNzTime(date: Date, timeZone: string = TIMEZONE): string {
  return new Intl.DateTimeFormat('en-NZ', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date);
}

export interface DateRange {
  from: Date;
  to: Date;
}

export function parseRelativeDateRange(text: string, reference: Date = new Date()): DateRange | null {
  const normalized = text.toLowerCase();
  const todayStart = startOfDayInTimezone(reference);

  if (normalized.includes('today')) {
    return { from: todayStart, to: endOfDayInTimezone(reference) };
  }

  if (normalized.includes('tomorrow')) {
    const tomorrow = addDays(todayStart, 1);
    return { from: tomorrow, to: endOfDayInTimezone(tomorrow) };
  }

  const weekdayMap: Record<string, number> = {
    sunday: 0,
    monday: 1,
    tuesday: 2,
    wednesday: 3,
    thursday: 4,
    friday: 5,
    saturday: 6,
  };

  for (const [name, targetDay] of Object.entries(weekdayMap)) {
    if (normalized.includes(name)) {
      const currentDay = new Date(
        reference.toLocaleString('en-US', { timeZone: TIMEZONE }),
      ).getDay();
      let daysAhead = targetDay - currentDay;
      if (daysAhead <= 0) {
        daysAhead += 7;
      }
      const target = addDays(todayStart, daysAhead);
      return { from: target, to: endOfDayInTimezone(target) };
    }
  }

  return null;
}
