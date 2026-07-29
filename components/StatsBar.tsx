'use client';

interface Props {
  collected: number;
  expectedCollectibles: number;
  memberCount: number;
}

export default function StatsBar({ collected, expectedCollectibles, memberCount }: Props) {
  return (
    <div className="stats-bar">
      <div className="stat">
        <span className="stat-label">Collected</span>
        <span className="stat-value">₱{collected.toFixed(2)}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Expected Collectibles</span>
        <span className="stat-value">₱{expectedCollectibles.toFixed(2)}</span>
      </div>
      <div className="stat">
        <span className="stat-label">Members</span>
        <span className="stat-value">{memberCount}</span>
      </div>
    </div>
  );
}
