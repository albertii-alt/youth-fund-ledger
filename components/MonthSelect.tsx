'use client';

interface Props {
  allSundays: { the_date: string }[];
  value: string;
  onChange: (month: string) => void;
}

export default function MonthSelect({ allSundays, value, onChange }: Props) {
  const currentMonth = new Date().toISOString().slice(0, 7);

  const months = Array.from(
    new Set([
      ...allSundays.map((s) => s.the_date.slice(0, 7)),
      currentMonth,
    ])
  ).sort();

  return (
    <select className="month-select" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="all">All time</option>
      {months.map((m) => (
        <option key={m} value={m}>
          {new Date(m + '-02').toLocaleString('default', { month: 'long', year: 'numeric' })}
        </option>
      ))}
    </select>
  );
}
