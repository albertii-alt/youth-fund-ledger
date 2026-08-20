'use client';

interface Props {
  collected: number;
  expectedCollectibles: number;
  memberCount: number;
  prevMonthCollected: number | null;
  membersContributed: number;
  allTime: boolean;
}

export default function StatsBar({
  collected,
  expectedCollectibles,
  memberCount,
  prevMonthCollected,
  membersContributed,
  allTime,
}: Props) {
  const outstanding = Math.max(0, expectedCollectibles - collected);
  const collectedPct = expectedCollectibles > 0 ? Math.round((collected / expectedCollectibles) * 100) : null;

  const showPctChange = !allTime && prevMonthCollected !== null && prevMonthCollected > 0;
  const pctChange = showPctChange
    ? (((collected - prevMonthCollected!) / prevMonthCollected!) * 100).toFixed(1)
    : null;
  const pctUp = pctChange !== null && Number(pctChange) >= 0;

  return (
    <div className="stats-bar">
      <div className="stat-card">
        <span className="stat-card-label">Total Collected</span>
        <span className="stat-card-value">₱{collected.toFixed(2)}</span>
        {pctChange !== null && (
          <span className={`stat-card-secondary ${pctUp ? 'stat-trend-up' : 'stat-trend-down'}`}>
            {pctUp ? '↑' : '↓'} {Math.abs(Number(pctChange))}% vs prev month
          </span>
        )}
      </div>

      <div className="stat-card">
        <span className="stat-card-label">Expected Collectibles</span>
        <span className="stat-card-value">₱{expectedCollectibles.toFixed(2)}</span>
        {collectedPct !== null && (
          <span className="stat-card-secondary">{collectedPct}% collected</span>
        )}
      </div>

      <div className={`stat-card${outstanding === 0 && expectedCollectibles > 0 ? ' stat-card--complete' : ''}`}>
        <span className="stat-card-label">Outstanding</span>
        <span className="stat-card-value">₱{outstanding.toFixed(2)}</span>
        <span className="stat-card-secondary">remaining this period</span>
      </div>

      <div className="stat-card">
        <span className="stat-card-label">Members</span>
        <span className="stat-card-value">{memberCount}</span>
        <span className="stat-card-secondary">
          {allTime
            ? `${membersContributed} contributed at least once`
            : `${membersContributed} contributed`}
        </span>
      </div>
    </div>
  );
}
