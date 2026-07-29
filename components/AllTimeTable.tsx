'use client';

interface Member { id: string; name: string }
interface AggRow { member_id: string; year: number; month: number; actual: number; expected: number }

interface Props {
  members: Member[];
  months: string[]; // 'YYYY-MM'
  rows: AggRow[];
}

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

export default function AllTimeTable({ members, months, rows }: Props) {
  const getRow = (memberId: string, ym: string) => {
    const [y, mo] = ym.split('-').map(Number);
    return rows.find((r) => r.member_id === memberId && r.year === y && r.month === mo);
  };

  if (members.length === 0) return <p className="empty-state">No members yet.</p>;
  if (months.length === 0) return <p className="empty-state">No data yet.</p>;

  return (
    <div className="table-wrapper">
      <table className="ledger-table">
        <thead>
          <tr>
            <th className="col-name">Member</th>
            {months.map((ym) => {
              const [y, mo] = ym.split('-').map(Number);
              return (
                <th key={ym} className="col-sunday">
                  {MONTH_LABELS[mo - 1]}<br /><span style={{ fontWeight: 'normal', fontSize: '0.7em' }}>{y}</span>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {members.map((m) => (
            <tr key={m.id}>
              <td className="col-name">{m.name}</td>
              {months.map((ym) => {
                const row = getRow(m.id, ym);
                if (!row || row.expected === 0) {
                  return <td key={ym} className="col-sunday"><span className="stamp-na">—</span></td>;
                }
                const completed = row.actual >= row.expected;
                return (
                  <td key={ym} className="col-sunday">
                    {completed
                      ? <span className="status-completed">✓</span>
                      : <span className="status-remaining">₱{(row.expected - row.actual).toFixed(0)}</span>
                    }
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
