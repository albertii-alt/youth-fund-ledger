'use client';

interface Member { id: string; name: string; joined_date: string }
interface Contribution { member_id: string; contribution_date: string; amount: number }

interface Props {
  members: Member[];
  sundays: string[];
  contributions: Contribution[];
  expectedWeeklyAmount: number;
  loggedIn?: boolean;
  onEditAmount?: (memberId: string, date: string, current: number | null) => void;
  onRemoveMember?: (id: string, name: string) => void;
  onEditMember?: (member: Member) => void;
}

export default function LedgerTable({
  members, sundays, contributions, expectedWeeklyAmount,
  loggedIn, onEditAmount, onRemoveMember, onEditMember,
}: Props) {
  const getAmount = (memberId: string, date: string) =>
    contributions.find((c) => c.member_id === memberId && c.contribution_date === date)?.amount ?? null;

  const memberActual = (memberId: string) =>
    contributions
      .filter((c) => c.member_id === memberId && sundays.includes(c.contribution_date))
      .reduce((sum, c) => sum + Number(c.amount), 0);

  const memberExpected = (member: Member) =>
    sundays.filter((s) => s >= member.joined_date).length * expectedWeeklyAmount;

  if (members.length === 0) return <p className="empty-state">No members yet.</p>;
  if (sundays.length === 0) return <p className="empty-state">No Sundays recorded for this period.</p>;

  return (
    <div className="table-wrapper">
      <table className="ledger-table">
        <thead>
          <tr>
            <th className="col-name">Member</th>
            {sundays.map((s) => (
              <th key={s} className="col-sunday">
                {new Date(s + 'T00:00:00').toLocaleDateString('default', { month: 'short', day: 'numeric' })}
              </th>
            ))}
            <th className="col-progress">Progress</th>
            {loggedIn && <th className="col-action"></th>}
          </tr>
        </thead>
        <tbody>
          {members.map((m) => {
            const actual = memberActual(m.id);
            const expected = memberExpected(m);
            const completed = actual >= expected && expected > 0;
            return (
              <tr key={m.id}>
                <td className="col-name">{m.name}</td>
                {sundays.map((s) => {
                  const amount = getAmount(m.id, s);
                  const eligible = s >= m.joined_date;
                  return (
                    <td key={s} className="col-sunday">
                      {!eligible ? (
                        <span className="stamp-na">—</span>
                      ) : loggedIn ? (
                        <button
                          className={amount !== null && amount > 0 ? 'stamp stamp-btn' : 'stamp-empty stamp-empty-btn'}
                          onClick={() => onEditAmount?.(m.id, s, amount)}
                        >
                          {amount !== null && amount > 0 ? `₱${Number(amount).toFixed(0)}` : ''}
                        </button>
                      ) : amount !== null && amount > 0 ? (
                        <span className="stamp">₱{Number(amount).toFixed(0)}</span>
                      ) : (
                        <span className="stamp-empty" />
                      )}
                    </td>
                  );
                })}
                <td className="col-progress">
                  {completed
                    ? <span className="status-completed">✓ Completed</span>
                    : <span>₱{actual.toFixed(2)} of ₱{expected.toFixed(2)}</span>
                  }
                </td>
                {loggedIn && (
                  <td className="col-action">
                    <button className="remove-btn" title="Edit member" onClick={() => onEditMember?.(m)}>✎</button>
                    <button className="remove-btn" title="Remove member" onClick={() => onRemoveMember?.(m.id, m.name)}>×</button>
                  </td>
                )}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
