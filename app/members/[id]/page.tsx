import { notFound } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';
import { sundaysInMonth, toDateString } from '@/lib/dates';
import CollectionProgressBar from '@/components/CollectionProgressBar';

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-PH', {
    month: 'long', day: 'numeric', year: 'numeric',
  });
}

interface BreakdownRow { year: number; month: number; actual: number; expected: number }
interface Member { id: string; name: string; joined_date: string; left_date: string | null }

async function getProfile(id: string) {
  const [memberRes, settingsRes, contributionsRes] = await Promise.all([
    supabase.from('members').select('*').eq('id', id).single(),
    supabase.from('settings').select('expected_weekly_amount').single(),
    supabase.from('contributions').select('*').eq('member_id', id),
  ]);

  if (memberRes.error || !memberRes.data) return null;

  const member: Member = memberRes.data;
  const expectedWeekly = Number(settingsRes.data?.expected_weekly_amount ?? 20);
  const contributions = contributionsRes.data ?? [];

  const phtNow = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const ceiling = member.left_date ?? phtNow;

  const ymSet = new Set<string>();
  for (const c of contributions) ymSet.add(c.contribution_date.slice(0, 7));
  ymSet.add(member.joined_date.slice(0, 7));
  ymSet.add(ceiling.slice(0, 7));

  const months = Array.from(ymSet)
    .filter((ym) => ym >= member.joined_date.slice(0, 7) && ym <= ceiling.slice(0, 7))
    .sort();

  const breakdown: BreakdownRow[] = months.map((ym) => {
    const [y, mo] = ym.split('-').map(Number);
    const sundays = sundaysInMonth(y, mo).map(toDateString);
    const activeSundays = sundays.filter(
      (s) => s >= member.joined_date && (member.left_date == null || s <= member.left_date)
    );
    const actual = contributions
      .filter((c) => sundays.includes(c.contribution_date))
      .reduce((sum, c) => sum + Number(c.amount), 0);
    const expected = activeSundays.length * expectedWeekly;
    return { year: y, month: mo, actual, expected };
  });

  const allTimeActual = breakdown.reduce((sum, r) => sum + r.actual, 0);
  const allTimeExpected = breakdown.reduce((sum, r) => sum + r.expected, 0);

  return { member, breakdown, allTimeActual, allTimeExpected };
}

export default async function MemberProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const data = await getProfile(id);
  if (!data) notFound();

  const { member, breakdown, allTimeActual, allTimeExpected } = data;

  return (
    <main className="main">
      <a href="/" className="mp-back">← Back to Ledger</a>
      <header className="header">
        <h1>{member.name}</h1>
        <p className="subtitle">Contribution Record</p>
        <p className="subtitle">Joined {fmtDate(member.joined_date)}</p>
        {member.left_date && (
          <span className="mp-left-banner">Left the program on {fmtDate(member.left_date)}</span>
        )}
      </header>

      <div className="mp-stats-bar">
        <div className="stat-card">
          <span className="stat-card-label">All-Time Collected</span>
          <span className="stat-card-value mp-mono">₱{allTimeActual.toFixed(2)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card-label">All-Time Expected</span>
          <span className="stat-card-value mp-mono">₱{allTimeExpected.toFixed(2)}</span>
        </div>
      </div>

      <CollectionProgressBar collected={allTimeActual} expected={allTimeExpected} />

      <div className="table-wrapper">
        <table className="ledger-table">
          <thead>
            <tr>
              <th className="col-name">Month</th>
              <th>Contributed</th>
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
                  <td className="mp-mono">
                    {row.actual > 0 ? `₱${row.actual.toFixed(2)}` : '—'}
                  </td>
                  <td className="col-progress">
                    {completed
                      ? <span className="status-completed">✓ Completed</span>
                      : row.actual > 0
                        ? <span className="status-partial">◑ ₱{row.actual.toFixed(2)} of ₱{row.expected.toFixed(2)}</span>
                        : <span className="status-not-yet">— not yet</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </main>
  );
}
