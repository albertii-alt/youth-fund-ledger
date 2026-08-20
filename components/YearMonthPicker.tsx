'use client';

interface Props {
  year: number;
  month: number; // 1-12
  allTime: boolean;
  years: number[];
  onChange: (year: number, month: number) => void;
  onAllTime: () => void;
}

const MONTH_FULL = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const ALL_TIME_VALUE = 'all';

export default function YearMonthPicker({ year, month, allTime, years, onChange, onAllTime }: Props) {
  const phtToday = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const currentYear = Number(phtToday.slice(0, 4));
  const currentMonth = Number(phtToday.slice(5, 7));

  function handleYearChange(e: React.ChangeEvent<HTMLSelectElement>) {
    if (e.target.value === ALL_TIME_VALUE) { onAllTime(); return; }
    const y = Number(e.target.value);
    const safeMonth = y === currentYear && month > currentMonth ? currentMonth : month;
    onChange(y, safeMonth);
  }

  function handleMonthChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange(year, Number(e.target.value));
  }

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear  = month === 1 ? year - 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear  = month === 12 ? year + 1 : year;
  const isNextDisabled = nextYear > currentYear || (nextYear === currentYear && nextMonth > currentMonth);

  return (
    <div className="ymp-wrap">
      <div className="ymp-row">
        <select
          className="ymp-select"
          value={allTime ? ALL_TIME_VALUE : year}
          onChange={handleYearChange}
          aria-label="Select year"
        >
          <option value={ALL_TIME_VALUE}>All time</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>

        <select
          className="ymp-select"
          value={month}
          onChange={handleMonthChange}
          disabled={allTime}
          aria-label="Select month"
        >
          {MONTH_FULL.map((label, i) => {
            const m = i + 1;
            const isFuture = year > currentYear || (year === currentYear && m > currentMonth);
            return (
              <option key={m} value={m} disabled={isFuture}>
                {label}
              </option>
            );
          })}
        </select>
      </div>

      {!allTime && (
        <div className="ymp-nav">
          <button className="ymp-nav-arrow" onClick={() => onChange(prevYear, prevMonth)} aria-label={`Go to ${MONTH_FULL[prevMonth - 1]} ${prevYear}`}>
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8 2L2 8L8 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <span className="ymp-nav-current">{MONTH_FULL[month - 1]} {year}</span>
          <button
            className={`ymp-nav-arrow${isNextDisabled ? ' disabled' : ''}`}
            onClick={() => { if (!isNextDisabled) onChange(nextYear, nextMonth); }}
            disabled={isNextDisabled}
            aria-label={isNextDisabled ? 'No future months available' : `Go to ${MONTH_FULL[nextMonth - 1]} ${nextYear}`}
          >
            <svg width="10" height="16" viewBox="0 0 10 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 2L8 8L2 14" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
