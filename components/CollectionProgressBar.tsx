'use client';

interface Props {
  collected: number;
  expected: number;
}

export default function CollectionProgressBar({ collected, expected }: Props) {
  if (expected === 0) {
    return (
      <div className="cpb-wrap">
        <p className="cpb-empty">No contributions expected this period.</p>
      </div>
    );
  }

  const pct = Math.min(100, Math.round((collected / expected) * 100));
  const state = pct >= 100 ? 'complete' : pct > 0 ? 'partial' : 'none';

  return (
    <div className="cpb-wrap">
      <div className="cpb-track" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% collected`}>
        <div className={`cpb-fill cpb-fill--${state}`} style={{ width: `${pct}%` }} />
      </div>
      <p className="cpb-label">
        <span className={`cpb-pct cpb-pct--${state}`}>{pct}%</span>
        {' '}₱{collected.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} collected of ₱{expected.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} expected
      </p>
    </div>
  );
}
