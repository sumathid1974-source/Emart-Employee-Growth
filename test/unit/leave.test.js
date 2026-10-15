const { describe, it } = require('node:test');
const assert = require('node:assert');

function calculateWorkingDays(startDateStr, endDateStr, holidays = []) {
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  if (isNaN(start.getTime()) || isNaN(end.getTime()) || end < start) {
    return 0;
  }

  const holidaySet = new Set(holidays);
  let workingDays = 0;
  const current = new Date(start);

  while (current <= end) {
    const dayOfWeek = current.getDay(); // 0 is Sunday, 6 is Saturday
    const dateIso = current.toISOString().split('T')[0];

    if (dayOfWeek !== 0 && dayOfWeek !== 6 && !holidaySet.has(dateIso)) {
      workingDays++;
    }
    current.setDate(current.getDate() + 1);
  }

  return workingDays;
}

describe('Leave Unit Tests — Working Days & Holiday Calculations', () => {
  it('should count standard Monday-Friday business days correctly', () => {
    // 2026-10-12 (Mon) to 2026-10-16 (Fri) = 5 working days
    const days = calculateWorkingDays('2026-10-12', '2026-10-16');
    assert.strictEqual(days, 5);
  });

  it('should strictly exclude Saturdays and Sundays from leave deduction', () => {
    // 2026-10-12 (Mon) to 2026-10-18 (Sun) = 5 working days (Sat & Sun excluded)
    const days = calculateWorkingDays('2026-10-12', '2026-10-18');
    assert.strictEqual(days, 5);
  });

  it('should exclude designated public holidays that fall on weekdays', () => {
    // 2026-10-12 (Mon) to 2026-10-16 (Fri), with 2026-10-14 as holiday = 4 working days
    const days = calculateWorkingDays('2026-10-12', '2026-10-16', ['2026-10-14']);
    assert.strictEqual(days, 4);
  });

  it('should return 0 when start date is after end date or dates are invalid', () => {
    assert.strictEqual(calculateWorkingDays('2026-10-20', '2026-10-15'), 0);
    assert.strictEqual(calculateWorkingDays('invalid-date', '2026-10-15'), 0);
  });
});
