'use client';

interface Props {
  allTimeTotal: number;
  memberCount: number;
  monthCollected: number;
  monthExpected: number;
}

export default function StatsBar({ allTimeTotal, memberCount, monthCollected, monthExpected }: Props) {
  return (
    <div className="stats-bar">
      <div className="stat">
        <span className="stat-label">All-time Total</span>
        <span className="stat-value">₱{allTimeTotal.toFixed(2)}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Members</span>
        <span className="stat-value">{memberCount}</span>
      </div>
      <div className="stat">
        <span className="stat-label">This Month</span>
        <span className="stat-value">₱{monthCollected.toFixed(2)} of ₱{monthExpected.toFixed(2)}</span>
      </div>
    </div>
  );
}
