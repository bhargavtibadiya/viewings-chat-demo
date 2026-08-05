import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { atLocalTimeInTimezone, formatNzDateTime, formatNzTime } from './date.js';

describe('atLocalTimeInTimezone', () => {
  it('maps hours 9, 12, 17, 10 to Auckland am/pm wall times', () => {
    // Fixed UTC reference so local calendar day is stable across runners.
    const reference = new Date('2026-08-05T00:00:00.000Z');
    const timeZone = 'Pacific/Auckland';

    const cases: Array<{ hour: number; expected: string }> = [
      { hour: 9, expected: '9:00 am' },
      { hour: 12, expected: '12:00 pm' },
      { hour: 17, expected: '5:00 pm' },
      { hour: 10, expected: '10:00 am' },
    ];

    for (const { hour, expected } of cases) {
      const instant = atLocalTimeInTimezone(reference, 2, hour, 0, timeZone);
      const label = formatNzTime(instant, timeZone).toLowerCase().replace(/\s+/g, ' ');
      assert.equal(label, expected, `hour ${hour} should format as ${expected}, got ${label}`);

      // Sanity: en-NZ datetime should include the same clock period.
      const full = formatNzDateTime(instant).toLowerCase();
      assert.ok(full.includes(expected.replace(':00', ':00')), `full label missing ${expected}: ${full}`);
    }
  });

  it('does not treat hour as UTC (regression for 9 → 9pm NZST)', () => {
    const reference = new Date('2026-08-05T00:00:00.000Z');
    const instant = atLocalTimeInTimezone(reference, 0, 9, 0, 'Pacific/Auckland');
    const label = formatNzTime(instant, 'Pacific/Auckland').toLowerCase();
    assert.equal(label, '9:00 am');
    assert.notEqual(label, '9:00 pm');
  });
});
