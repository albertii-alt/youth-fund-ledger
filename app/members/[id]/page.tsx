import { notFound } from 'next/navigation';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

interface BreakdownRow { year: number; month: number; actual: number; expected: number }
interface Member { id: string; name: string; joined_date: string; left_date: string | null }
interface ProfileData {
  member: Member;
  breakdown: BreakdownRow[];
  allTimeActual: number;
  allTimeExpected: number;
}

async function getProfile(id: string): Promise<ProfileData | null> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const res = await fetch(`${base}/api/members/${id}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProfile(id);
  if (!data) notFound();

  const { member, breakdown, allTimeActual, allTimeExpected } = data;

  return (
    <main className="main">
      <header className="header">
        <h1>{member.name}</h1>
        <p className="subtitle">Contribution Record</p>
        <p className="record-notice">
          Joined: {member.joined_date}
          {member.left_date && ` · Left: ${member.left_date}`}
        </p>
      </header>

      <div className="stats-bar">
        <div className="stat">
          <span className="stat-label">All-Time Collected</span>
          <span className="stat-value">₱{allTimeActual.toFixed(2)}</span>
        </div>
        <div className="stat">
          <span className="stat-label">All-Time Expected</span>
          <span className="stat-value">₱{allTimeExpected.toFixed(2)}</span>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="ledger-table">
          <thead>
            <tr>
              <th className="col-name">Month</th>
              <th className="col-progress">Status</th>
            </tr>
          </thead>
          <tbody>
            {breakdown.map((row) => {
              if (row.expected === 0) return null;
              const completed = row.actual >= row.expected;
              return (
                <tr key={`${row.year}-${row.month}`}>
                  <td className="col-name">{MONTH_LABELS[row.month - 1]} {row.year}</td>
                  <td className="col-progress">
                    {completed
                      ? <span className="status-completed">✓ Completed</span>
                      : <span>₱{row.actual.toFixed(2)} of ₱{row.expected.toFixed(2)}</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p style={{ textAlign: 'center', marginTop: '1.5rem' }}>
        <a href="/" className="btn-secondary" style={{ textDecoration: 'none' }}>← Back to ledger</a>
      </p>
    </main>
  );
}
