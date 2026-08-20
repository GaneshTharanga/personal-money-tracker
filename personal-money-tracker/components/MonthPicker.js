'use client';

import { monthLabel, shiftMonth } from '@/lib/money';

export default function MonthPicker({ month, onChange }) {
  return (
    <div className="month-picker">
      <button className="icon-button" type="button" onClick={() => onChange(shiftMonth(month, -1))} aria-label="Previous month">‹</button>
      <strong>{monthLabel(month)}</strong>
      <button className="icon-button" type="button" onClick={() => onChange(shiftMonth(month, 1))} aria-label="Next month">›</button>
    </div>
  );
}
