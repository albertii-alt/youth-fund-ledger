'use client';

interface Props {
  year: number;
  month: number; // 1-12
  allTime: boolean;
  years: number[];
  onChange: (year: number, month: number) => void;
  onAllTime: () => void;
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function YearMonthPicker({ year, month, allTime, years, onChange, onAllTime }: Props) {
  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1;

  return (
    <div className="ymp-wrap">
      <div className="ymp-years">
        <button
          className={`ymp-year-btn${allTime ? ' active' : ''}`}
          onClick={onAllTime}
        >All time</button>
        {years.map((y) => (
          <button
            key={y}
            className={`ymp-year-btn${!allTime && y === year ? ' active' : ''}`}
            onClick={() => onChange(y, y === year ? month : currentMonth)}
          >{y}</button>
        ))}
      </div>
      {!allTime && (
        <div className="ymp-months">
          {MONTH_LABELS.map((label, i) => {
            const m = i + 1;
            const isFuture = year > currentYear || (year === currentYear && m > currentMonth);
            const isSelected = m === month;
            return (
              <button
                key={m}
                disabled={isFuture}
                className={`ymp-month-btn${isSelected ? ' active' : ''}${isFuture ? ' disabled' : ''}`}
                onClick={() => !isFuture && onChange(year, m)}
              >{label}</button>
            );
          })}
        </div>
      )}
    </div>
  );
}
